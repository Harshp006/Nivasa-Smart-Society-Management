import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';
import { createNotificationsForAll } from '../../utils/notifications';

const router = Router();
router.use(authenticate);

const announcementSchema = z.object({
  societyId: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['GENERAL', 'MAINTENANCE', 'SECURITY', 'EVENT', 'EMERGENCY', 'POLICY']).default('GENERAL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.string().transform(s => new Date(s)).optional(),
  expiresAt: z.string().transform(s => new Date(s)).optional(),
  isPinned: z.boolean().default(false),
});

// GET /api/v1/announcements
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { category, status } = req.query as any;

    const where: any = {};
    // Non-admin only see published
    if (req.user!.role !== 'ADMIN') {
      where.status = 'PUBLISHED';
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    } else if (status) {
      where.status = status;
    }
    if (category) where.category = category;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.announcement.count({ where }),
    ]);

    paginatedResponse(res, announcements, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/announcements/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    successResponse(res, announcement);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/announcements — Admin
router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = announcementSchema.parse(req.body);
    const announcement = await prisma.announcement.create({
      data: {
        ...data,
        createdBy: req.user!.id,
        publishedAt: data.status === 'PUBLISHED' ? (data.publishedAt || new Date()) : data.publishedAt,
      },
    });

    if (announcement.status === 'PUBLISHED') {
      // Notify all active residents
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT', status: 'ACTIVE' },
        select: { id: true },
      });

      await createNotificationsForAll(
        residents.map(r => r.id),
        {
          type: 'ANNOUNCEMENT',
          title: `New Announcement: ${announcement.title}`,
          message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
          entityId: announcement.id,
          entityType: 'Announcement',
        }
      );

      await createAuditLog({
        actorId: req.user!.id,
        action: 'ANNOUNCEMENT_PUBLISHED',
        entityType: 'Announcement',
        entityId: announcement.id,
      });
    }

    successResponse(res, announcement, 'Announcement created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/announcements/:id — Admin
router.patch('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = announcementSchema.partial().parse(req.body);
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Announcement not found');

    const updateData: any = { ...data };
    if (data.status === 'PUBLISHED' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: updateData,
    });
    successResponse(res, announcement, 'Announcement updated');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/announcements/:id — Admin
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Announcement deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
