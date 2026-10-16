import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../config/prisma';
import config from '../../config/env';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta, paginatedResponse, successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';

const router = Router();
router.use(authenticate);

const createResidentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  apartmentId: z.string(),
  residentType: z.enum(['OWNER', 'TENANT']).default('OWNER'),
  moveInDate: z.string().transform(s => new Date(s)),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

// GET /api/v1/residents
router.get('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { search, apartmentId, residentType } = req.query as any;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    if (apartmentId) where.apartmentId = apartmentId;
    if (residentType) where.residentType = residentType;

    const [residents, total] = await Promise.all([
      prisma.residentProfile.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true, email: true, firstName: true, lastName: true,
              phone: true, status: true, lastLoginAt: true,
            },
          },
          apartment: {
            select: { id: true, building: true, unitNumber: true, floor: true, type: true },
          },
          _count: { select: { familyMembers: true, vehicles: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.residentProfile.count({ where }),
    ]);

    paginatedResponse(res, residents, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/residents/me — Resident's own profile
router.get('/me', authorize('RESIDENT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.residentProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        apartment: true,
        familyMembers: true,
        vehicles: true,
      },
    });
    if (!profile) throw new ApiError(404, 'Resident profile not found');
    successResponse(res, profile);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/residents/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.residentProfile.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        apartment: true,
        familyMembers: true,
        vehicles: true,
      },
    });
    if (!profile) throw new ApiError(404, 'Resident profile not found');

    // Residents can only view their own profile
    if (req.user!.role === 'RESIDENT' && profile.userId !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    successResponse(res, profile);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/residents — Admin creates resident
router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createResidentSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'Email already in use');

    const apartment = await prisma.apartment.findUnique({ where: { id: data.apartmentId } });
    if (!apartment) throw new ApiError(404, 'Apartment not found');

    const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'RESIDENT',
        },
      });

      const residentProfile = await tx.residentProfile.create({
        data: {
          userId: user.id,
          apartmentId: data.apartmentId,
          residentType: data.residentType,
          moveInDate: data.moveInDate,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
        },
      });

      // Update apartment occupancy
      await tx.apartment.update({
        where: { id: data.apartmentId },
        data: { occupancyStatus: 'OCCUPIED' },
      });

      return { user, residentProfile };
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'RESIDENT_CREATED',
      entityType: 'ResidentProfile',
      entityId: result.residentProfile.id,
      details: { email: data.email, apartmentId: data.apartmentId },
    });

    const { passwordHash: _, ...userWithoutPassword } = result.user;
    successResponse(res, { ...result.residentProfile, user: userWithoutPassword }, 'Resident created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/residents/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.residentProfile.findUnique({
      where: { id: req.params.id as string },
      include: { user: true },
    });
    if (!profile) throw new ApiError(404, 'Resident profile not found');

    if (req.user!.role === 'RESIDENT' && profile.userId !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    const updateSchema = z.object({
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
      notes: z.string().optional(),
      moveOutDate: z.string().transform(s => new Date(s)).optional(),
      isActive: z.boolean().optional(),
      // User fields
      phone: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);
    const { phone, ...profileData } = data;

    await prisma.$transaction(async (tx) => {
      if (phone) {
        await tx.user.update({ where: { id: profile.userId }, data: { phone } });
      }
      await tx.residentProfile.update({ where: { id: req.params.id as string }, data: profileData });
    });

    successResponse(res, null, 'Resident updated');
  } catch (error) {
    next(error);
  }
});

export default router;
