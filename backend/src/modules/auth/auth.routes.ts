import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../config/prisma';
import config from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { successResponse } from '../../utils/pagination';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as any }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
  );
  return { accessToken, refreshToken };
}

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        residentProfile: {
          include: {
            apartment: {
              select: { id: true, building: true, unitNumber: true, floor: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Account is suspended or inactive');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // Set httpOnly cookie for token
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    successResponse(res, {
      user: userWithoutPassword,
      accessToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      throw new ApiError(401, 'Refresh token required');
    }

    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, { accessToken }, 'Token refreshed');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid refresh token'));
    } else {
      next(error);
    }
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  successResponse(res, null, 'Logged out successfully');
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        residentProfile: {
          include: {
            apartment: {
              select: { id: true, building: true, unitNumber: true, floor: true, type: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    successResponse(res, userWithoutPassword, 'User profile fetched');
  } catch (error) {
    next(error);
  }
});

export default router;
