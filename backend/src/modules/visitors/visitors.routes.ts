import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';
import { createNotification } from '../../utils/notifications';

const router = Router();
router.use(authenticate);

const createVisitorSchema = z.object({
  visitorName: z.string().min(1),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  purpose: z.string().min(1),
  visitorType: z.enum(['GUEST', 'DELIVERY', 'SERVICE', 'CONTRACTOR', 'OTHER']).default('GUEST'),
  vehicleNumber: z.string().optional(),
  expectedDate: z.string().transform(s => new Date(s)),
  expectedTime: z.string().optional(),
  validUntil: z.string().transform(s => new Date(s)).optional(),
  notes: z.string().optional(),
  apartmentId: z.string().optional(),
});

function generatePassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NV-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/v1/visitors
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { search, status, apartmentId, date } = req.query as any;

    const where: any = {};

    // Role-based filtering
    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) throw new ApiError(404, 'Resident profile not found');
      where.residentProfileId = profile.id;
    }

    if (search) {
      where.OR = [
        { visitorName: { contains: search, mode: 'insensitive' } },
        { passCode: { contains: search, mode: 'insensitive' } },
        { visitorPhone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (apartmentId && req.user!.role !== 'RESIDENT') where.apartmentId = apartmentId;
    if (date) {
      const d = new Date(date);
      where.expectedDate = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        skip,
        take,
        include: {
          apartment: { select: { building: true, unitNumber: true } },
          residentProfile: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          approval: true,
          entryLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitor.count({ where }),
    ]);

    paginatedResponse(res, visitors, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/visitors/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id: req.params.id as string },
      include: {
        apartment: true,
        residentProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        approval: true,
        entryLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!visitor) throw new ApiError(404, 'Visitor not found');

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || visitor.residentProfileId !== profile.id) throw new ApiError(403, 'Access denied');
    }

    successResponse(res, visitor);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/visitors — Resident pre-registers
router.post('/', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createVisitorSchema.parse(req.body);

    let residentProfileId: string;
    let apartmentId: string;

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) throw new ApiError(404, 'Resident profile not found');
      residentProfileId = profile.id;
      apartmentId = profile.apartmentId;
    } else {
      if (!req.body.residentProfileId || !data.apartmentId) {
        throw new ApiError(400, 'residentProfileId and apartmentId required for admin');
      }
      residentProfileId = req.body.residentProfileId;
      apartmentId = data.apartmentId!;
    }

    let passCode = generatePassCode();
    // Ensure uniqueness
    while (await prisma.visitor.findUnique({ where: { passCode } })) {
      passCode = generatePassCode();
    }

    const visitor = await prisma.visitor.create({
      data: {
        ...data,
        apartmentId,
        residentProfileId,
        passCode,
        status: 'PENDING',
      },
      include: {
        apartment: { select: { building: true, unitNumber: true } },
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'VISITOR_REGISTERED',
      entityType: 'Visitor',
      entityId: visitor.id,
      details: { visitorName: visitor.visitorName, passCode: visitor.passCode },
    });

    successResponse(res, visitor, 'Visitor registered', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/visitors/:id/approve — Resident approves/rejects
router.patch('/:id/approve', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { decision, reason } = z.object({
      decision: z.enum(['APPROVED', 'REJECTED']),
      reason: z.string().optional(),
    }).parse(req.body);

    const visitor = await prisma.visitor.findUnique({
      where: { id: req.params.id as string },
      include: { residentProfile: true },
    });
    if (!visitor) throw new ApiError(404, 'Visitor not found');

    if (req.user!.role === 'RESIDENT' && visitor.residentProfile.userId !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    if (!['PENDING'].includes(visitor.status)) {
      throw new ApiError(400, 'Visitor is not in pending state');
    }

    await prisma.$transaction(async (tx) => {
      await tx.visitor.update({
        where: { id: visitor.id },
        data: { status: decision },
      });

      await tx.visitorApproval.upsert({
        where: { visitorId: visitor.id },
        create: {
          visitorId: visitor.id,
          approvedBy: req.user!.id,
          decision,
          reason,
          expiresAt: decision === 'APPROVED' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
        },
        update: {
          approvedBy: req.user!.id,
          decision,
          reason,
          decidedAt: new Date(),
        },
      });
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: decision === 'APPROVED' ? 'VISITOR_APPROVED' : 'VISITOR_REJECTED',
      entityType: 'Visitor',
      entityId: visitor.id,
    });

    successResponse(res, null, `Visitor ${decision.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
});

export default router;
