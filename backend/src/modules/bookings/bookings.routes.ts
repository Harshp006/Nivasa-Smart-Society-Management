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

const bookingSchema = z.object({
  amenityId: z.string(),
  date: z.string().transform(s => new Date(s)),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().optional(),
});

// GET /api/v1/bookings
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { status, amenityId } = req.query as any;

    const where: any = {};
    if (req.user!.role === 'RESIDENT') where.bookedBy = req.user!.id;
    if (status) where.status = status;
    if (amenityId) where.amenityId = amenityId;

    const [bookings, total] = await Promise.all([
      prisma.amenityBooking.findMany({
        where,
        skip,
        take,
        include: {
          amenity: { select: { name: true, location: true } },
          booker: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      }),
      prisma.amenityBooking.count({ where }),
    ]);

    paginatedResponse(res, bookings, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/bookings — Create booking with conflict detection
router.post('/', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = bookingSchema.parse(req.body);

    const amenity = await prisma.amenity.findUnique({ where: { id: data.amenityId } });
    if (!amenity || !amenity.isActive) throw new ApiError(404, 'Amenity not found or inactive');

    // Check for conflicts using a transaction with serializable isolation
    const booking = await prisma.$transaction(async (tx) => {
      // Lock: check existing bookings in same slot
      const conflicts = await tx.amenityBooking.findMany({
        where: {
          amenityId: data.amenityId,
          date: data.date,
          status: { in: ['CONFIRMED', 'PENDING'] },
          AND: [
            { startTime: { lt: data.endTime } },
            { endTime: { gt: data.startTime } },
          ],
        },
      });

      if (conflicts.length > 0) {
        throw new ApiError(409, 'This time slot is already booked. Please choose another slot.');
      }

      const status = amenity.requiresApproval ? 'PENDING' : 'CONFIRMED';

      return await tx.amenityBooking.create({
        data: {
          amenityId: data.amenityId,
          bookedBy: req.user!.id,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          purpose: data.purpose,
          status,
        },
        include: { amenity: { select: { name: true } } },
      });
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'BOOKING_CREATED',
      entityType: 'AmenityBooking',
      entityId: booking.id,
      details: { amenityId: data.amenityId, date: data.date, startTime: data.startTime },
    });

    await createNotification({
      userId: req.user!.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Created',
      message: `Your booking for ${booking.amenity.name} on ${data.startTime}-${data.endTime} is ${booking.status.toLowerCase()}`,
      entityId: booking.id,
      entityType: 'AmenityBooking',
    });

    successResponse(res, booking, 'Booking created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cancelReason } = z.object({ cancelReason: z.string().optional() }).parse(req.body);

    const booking = await prisma.amenityBooking.findUnique({
      where: { id: req.params.id },
      include: { amenity: true },
    });
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (req.user!.role === 'RESIDENT' && booking.bookedBy !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new ApiError(400, 'Booking cannot be cancelled');
    }

    const updated = await prisma.amenityBooking.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user!.id,
        cancelReason,
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'BOOKING_CANCELLED',
      entityType: 'AmenityBooking',
      entityId: booking.id,
    });

    successResponse(res, updated, 'Booking cancelled');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/bookings/:id/approve — Admin approves/rejects
router.patch('/:id/approve', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { decision } = z.object({
      decision: z.enum(['CONFIRMED', 'REJECTED']),
    }).parse(req.body);

    const booking = await prisma.amenityBooking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw new ApiError(404, 'Booking not found');

    const updated = await prisma.amenityBooking.update({
      where: { id: req.params.id },
      data: { status: decision, approvedBy: req.user!.id },
    });

    await createNotification({
      userId: booking.bookedBy,
      type: decision === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_REJECTED',
      title: `Booking ${decision === 'CONFIRMED' ? 'Approved' : 'Rejected'}`,
      message: `Your amenity booking has been ${decision === 'CONFIRMED' ? 'approved' : 'rejected'} by admin`,
      entityId: booking.id,
      entityType: 'AmenityBooking',
    });

    successResponse(res, updated, `Booking ${decision.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
});

export default router;
