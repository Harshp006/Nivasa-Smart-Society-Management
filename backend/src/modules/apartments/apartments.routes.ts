import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate);

const apartmentSchema = z.object({
  societyId: z.string(),
  building: z.string().min(1),
  floor: z.number().int(),
  unitNumber: z.string().min(1),
  type: z.string().min(1),
  areaSqFt: z.number().positive().optional(),
  maintenanceAmt: z.number().positive().optional(),
  notes: z.string().optional(),
});

// GET /api/v1/apartments
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { search, building, status } = req.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { unitNumber: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (building) where.building = building;
    if (status) where.occupancyStatus = status;

    const [apartments, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        skip,
        take,
        include: {
          residentProfiles: {
            where: { isActive: true },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
          },
          _count: { select: { maintenanceBills: true } },
        },
        orderBy: [{ building: 'asc' }, { unitNumber: 'asc' }],
      }),
      prisma.apartment.count({ where }),
    ]);

    paginatedResponse(res, apartments, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/apartments/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apartment = await prisma.apartment.findUnique({
      where: { id: req.params.id },
      include: {
        residentProfiles: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            familyMembers: true,
            vehicles: true,
          },
        },
        maintenanceBills: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!apartment) throw new ApiError(404, 'Apartment not found');

    // Residents can only see their own apartment
    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findFirst({
        where: { userId: req.user!.id, apartmentId: apartment.id },
      });
      if (!profile) throw new ApiError(403, 'Access denied');
    }

    successResponse(res, apartment);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apartments — Admin only
router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = apartmentSchema.parse(req.body);
    const apartment = await prisma.apartment.create({ data: data as any });
    successResponse(res, apartment, 'Apartment created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/apartments/:id — Admin only
router.patch('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = apartmentSchema.partial().parse(req.body);
    const apartment = await prisma.apartment.update({
      where: { id: req.params.id },
      data: data as any,
    });
    successResponse(res, apartment, 'Apartment updated');
  } catch (error) {
    next(error);
  }
});

export default router;
