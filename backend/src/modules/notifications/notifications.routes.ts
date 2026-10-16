import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { unread } = req.query as any;

    const where: any = { userId: req.user!.id };
    if (unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Notifications fetched',
      data: notifications,
      meta: buildPaginationMeta(total, page, limit),
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id as string } });
    if (!notification) throw new ApiError(404, 'Notification not found');
    if (notification.userId !== req.user!.id) throw new ApiError(403, 'Access denied');

    await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true, readAt: new Date() },
    });

    successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;
