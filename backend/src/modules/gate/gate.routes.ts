import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';

const router = Router();
router.use(authenticate, authorize('SECURITY', 'ADMIN'));

// GET /api/v1/gate/verify/:passCode
router.get('/verify/:passCode', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visitor = await prisma.visitor.findUnique({
      where: { passCode: req.params.passCode as string },
      include: {
        apartment: { select: { building: true, unitNumber: true } },
        residentProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        approval: true,
        entryLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!visitor) {
      return successResponse(res, { valid: false, message: 'Invalid pass code' });
    }

    const now = new Date();
    const isApproved = visitor.status === 'APPROVED';
    const isExpired = visitor.approval?.expiresAt && visitor.approval.expiresAt < now;
    const isAlreadyCheckedIn = visitor.status === 'CHECKED_IN';

    successResponse(res, {
      valid: isApproved && !isExpired,
      visitor,
      message: !isApproved ? 'Not approved'
        : isExpired ? 'Pass expired'
        : isAlreadyCheckedIn ? 'Already checked in'
        : 'Valid pass',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/gate/checkin
router.post('/checkin', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { passCode, securityNotes } = z.object({
      passCode: z.string(),
      securityNotes: z.string().optional(),
    }).parse(req.body);

    const visitor = await prisma.visitor.findUnique({
      where: { passCode },
      include: { approval: true },
    });

    if (!visitor) throw new ApiError(404, 'Visitor not found');
    if (visitor.status !== 'APPROVED') throw new ApiError(400, 'Visitor is not approved');
    if (visitor.approval?.expiresAt && visitor.approval.expiresAt < new Date()) {
      throw new ApiError(400, 'Visitor pass has expired');
    }

    await prisma.$transaction(async (tx) => {
      await tx.visitor.update({
        where: { id: visitor.id },
        data: { status: 'CHECKED_IN' },
      });

      await tx.visitorEntryLog.create({
        data: {
          visitorId: visitor.id,
          recordedBy: req.user!.id,
          checkInAt: new Date(),
          securityNotes,
        },
      });
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'VISITOR_CHECKIN',
      entityType: 'Visitor',
      entityId: visitor.id,
      details: { passCode },
    });

    successResponse(res, null, 'Visitor checked in');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/gate/checkout
router.post('/checkout', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { passCode, securityNotes } = z.object({
      passCode: z.string(),
      securityNotes: z.string().optional(),
    }).parse(req.body);

    const visitor = await prisma.visitor.findUnique({
      where: { passCode },
      include: { entryLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!visitor) throw new ApiError(404, 'Visitor not found');
    if (visitor.status !== 'CHECKED_IN') throw new ApiError(400, 'Visitor is not checked in');

    const latestLog = visitor.entryLogs[0];
    if (!latestLog) throw new ApiError(400, 'No check-in record found');

    await prisma.$transaction(async (tx) => {
      await tx.visitor.update({
        where: { id: visitor.id },
        data: { status: 'CHECKED_OUT' },
      });

      await tx.visitorEntryLog.update({
        where: { id: latestLog.id },
        data: { checkOutAt: new Date(), securityNotes },
      });
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'VISITOR_CHECKOUT',
      entityType: 'Visitor',
      entityId: visitor.id,
    });

    successResponse(res, null, 'Visitor checked out');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/gate/current - visitors currently inside
router.get('/current', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visitors = await prisma.visitor.findMany({
      where: { status: 'CHECKED_IN' },
      include: {
        apartment: { select: { building: true, unitNumber: true } },
        residentProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        entryLogs: { where: { checkOutAt: null }, orderBy: { checkInAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    successResponse(res, visitors);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/gate/logs - entry/exit logs
router.get('/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { date } = req.query as any;

    const where: any = {};
    if (date) {
      const d = new Date(date);
      where.createdAt = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.visitorEntryLog.findMany({
        where,
        skip,
        take,
        include: {
          visitor: {
            include: {
              apartment: { select: { building: true, unitNumber: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitorEntryLog.count({ where }),
    ]);

    paginatedResponse(res, logs, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

export default router;
