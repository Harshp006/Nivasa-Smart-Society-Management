import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';
import { createNotification } from '../../utils/notifications';

const router = Router();
router.use(authenticate);

const complaintSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  category: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

// GET /api/v1/complaints
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { search, status, category, priority } = req.query as any;

    const where: any = {};

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) throw new ApiError(404, 'Resident profile not found');
      where.residentProfileId = profile.id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take,
        include: {
          residentProfile: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              apartment: { select: { building: true, unitNumber: true } },
            },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);

    paginatedResponse(res, complaints, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/complaints/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        residentProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            apartment: { select: { building: true, unitNumber: true } },
          },
        },
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
          where: req.user!.role === 'RESIDENT' ? { isInternal: false } : {},
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!complaint) throw new ApiError(404, 'Complaint not found');

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || complaint.residentProfileId !== profile.id) throw new ApiError(403, 'Access denied');
    }

    successResponse(res, complaint);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/complaints — Resident submits complaint
router.post('/', authorize('RESIDENT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = complaintSchema.parse(req.body);
    const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new ApiError(404, 'Resident profile not found');

    const complaint = await prisma.complaint.create({
      data: { ...data, residentProfileId: profile.id },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'COMPLAINT_SUBMITTED',
      entityType: 'Complaint',
      entityId: complaint.id,
    });

    successResponse(res, complaint, 'Complaint submitted', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/complaints/:id — Admin updates status/assignment
router.patch('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updateSchema = z.object({
      status: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
      assignedTo: z.string().optional(),
      resolutionNotes: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    });

    const data = updateSchema.parse(req.body);
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    const updateData: any = { ...data };
    if (data.status === 'RESOLVED') updateData.resolvedAt = new Date();

    const updated = await prisma.complaint.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Notify resident
    const profile = await prisma.residentProfile.findUnique({ where: { id: complaint.residentProfileId } });
    if (profile && data.status) {
      await createNotification({
        userId: profile.userId,
        type: 'COMPLAINT_UPDATE',
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.title}" status changed to ${data.status}`,
        entityId: complaint.id,
        entityType: 'Complaint',
      });
    }

    await createAuditLog({
      actorId: req.user!.id,
      action: data.status === 'RESOLVED' ? 'COMPLAINT_RESOLVED' : 'COMPLAINT_ASSIGNED',
      entityType: 'Complaint',
      entityId: complaint.id,
      details: { status: data.status, assignedTo: data.assignedTo },
    });

    successResponse(res, updated, 'Complaint updated');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/complaints/:id/comments
router.post('/:id/comments', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { comment, isInternal } = z.object({
      comment: z.string().min(1),
      isInternal: z.boolean().default(false),
    }).parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    // Residents can only comment on their own complaints
    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || complaint.residentProfileId !== profile.id) throw new ApiError(403, 'Access denied');
    }

    const newComment = await prisma.complaintComment.create({
      data: {
        complaintId: req.params.id,
        userId: req.user!.id,
        comment,
        isInternal: req.user!.role === 'ADMIN' ? isInternal : false,
      },
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    });

    successResponse(res, newComment, 'Comment added', 201);
  } catch (error) {
    next(error);
  }
});

export default router;
