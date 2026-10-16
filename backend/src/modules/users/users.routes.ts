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

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'RESIDENT', 'SECURITY']),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// GET /api/v1/users — Admin only
router.get('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { search, role, status } = req.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, status: true, lastLoginAt: true,
          createdAt: true, updatedAt: true,
          residentProfile: {
            select: {
              id: true, residentType: true,
              apartment: { select: { building: true, unitNumber: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    paginatedResponse(res, users, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // Residents can only view themselves
    if (req.user!.role === 'RESIDENT' && req.user!.id !== id) {
      throw new ApiError(403, 'Access denied');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, avatarUrl: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        residentProfile: {
          include: {
            apartment: true,
            familyMembers: true,
            vehicles: true,
          },
        },
      },
    });

    if (!user) throw new ApiError(404, 'User not found');
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users — Admin only
router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'Email already in use');

    const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, createdAt: true,
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // Residents can only update themselves (limited fields)
    if (req.user!.role === 'RESIDENT' && req.user!.id !== id) {
      throw new ApiError(403, 'Access denied');
    }

    const data = updateUserSchema.parse(req.body);

    // Non-admin cannot change status
    if (req.user!.role !== 'ADMIN' && data.status) {
      throw new ApiError(403, 'Cannot change account status');
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, updatedAt: true,
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
    });

    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/:id/password
router.patch('/:id/password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (req.user!.id !== id && req.user!.role !== 'ADMIN') {
      throw new ApiError(403, 'Access denied');
    }

    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User not found');

    // If changing own password, require current password
    if (req.user!.id === id && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new ApiError(400, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
