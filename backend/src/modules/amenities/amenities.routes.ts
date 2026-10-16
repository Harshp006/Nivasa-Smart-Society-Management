import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate);

const amenitySchema = z.object({
  societyId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  rules: z.string().optional(),
  openingTime: z.string(),
  closingTime: z.string(),
  slotDuration: z.number().int().positive().default(60),
  requiresApproval: z.boolean().default(false),
  imageUrl: z.string().optional(),
});

// GET /api/v1/amenities
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const amenities = await prisma.amenity.findMany({
      where: { isActive: true },
      include: { _count: { select: { bookings: true } } },
      orderBy: { name: 'asc' },
    });
    successResponse(res, amenities);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/amenities/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const amenity = await prisma.amenity.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!amenity) throw new ApiError(404, 'Amenity not found');
    successResponse(res, amenity);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/amenities/:id/availability?date=YYYY-MM-DD
router.get('/:id/availability', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query as { date: string };
    if (!date) throw new ApiError(400, 'Date required');

    const amenity = await prisma.amenity.findUnique({ where: { id: req.params.id } });
    if (!amenity) throw new ApiError(404, 'Amenity not found');

    const bookingDate = new Date(date);

    const existingBookings = await prisma.amenityBooking.findMany({
      where: {
        amenityId: req.params.id,
        date: bookingDate,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { startTime: true, endTime: true, status: true },
    });

    // Generate slots
    const slots = [];
    const [openH, openM] = amenity.openingTime.split(':').map(Number);
    const [closeH, closeM] = amenity.closingTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const duration = amenity.slotDuration;

    for (let start = openMinutes; start + duration <= closeMinutes; start += duration) {
      const startTime = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
      const endMinutes = start + duration;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      const isBooked = existingBookings.some(
        (b) => !(b.endTime <= startTime || b.startTime >= endTime)
      );

      slots.push({ startTime, endTime, available: !isBooked });
    }

    successResponse(res, { amenity, date, slots, existingBookings });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/amenities — Admin
router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = amenitySchema.parse(req.body);
    const amenity = await prisma.amenity.create({ data });
    successResponse(res, amenity, 'Amenity created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/amenities/:id — Admin
router.patch('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = amenitySchema.partial().parse(req.body);
    const amenity = await prisma.amenity.update({ where: { id: req.params.id }, data });
    successResponse(res, amenity, 'Amenity updated');
  } catch (error) {
    next(error);
  }
});

export default router;
