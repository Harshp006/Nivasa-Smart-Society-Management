import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate);

const familyMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  relation: z.string().min(1),
  age: z.number().int().positive().optional(),
  phone: z.string().optional(),
  isEmergencyContact: z.boolean().default(false),
});

async function getResidentProfileId(userId: string): Promise<string> {
  const profile = await prisma.residentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, 'Resident profile not found');
  return profile.id;
}

async function checkOwnership(memberId: string, userId: string): Promise<void> {
  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    include: { residentProfile: true },
  });
  if (!member) throw new ApiError(404, 'Family member not found');
  if (member.residentProfile.userId !== userId) throw new ApiError(403, 'Access denied');
}

// GET /api/v1/family-members?residentProfileId=...
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let residentProfileId = req.query.residentProfileId as string;
    
    if (req.user!.role === 'RESIDENT') {
      residentProfileId = await getResidentProfileId(req.user!.id);
    } else if (!residentProfileId) {
      throw new ApiError(400, 'residentProfileId required');
    }

    const members = await prisma.familyMember.findMany({
      where: { residentProfileId },
      orderBy: { createdAt: 'asc' },
    });

    successResponse(res, members);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/family-members
router.post('/', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = familyMemberSchema.parse(req.body);
    let residentProfileId = req.body.residentProfileId;

    if (req.user!.role === 'RESIDENT') {
      residentProfileId = await getResidentProfileId(req.user!.id);
    }

    const member = await prisma.familyMember.create({
      data: { ...data, residentProfileId },
    });

    successResponse(res, member, 'Family member added', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/family-members/:id
router.patch('/:id', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === 'RESIDENT') {
      await checkOwnership(req.params.id, req.user!.id);
    }

    const data = familyMemberSchema.partial().parse(req.body);
    const member = await prisma.familyMember.update({
      where: { id: req.params.id },
      data,
    });

    successResponse(res, member, 'Family member updated');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/family-members/:id
router.delete('/:id', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === 'RESIDENT') {
      await checkOwnership(req.params.id as string, req.user!.id);
    }

    await prisma.familyMember.delete({ where: { id: req.params.id as string } });
    successResponse(res, null, 'Family member removed');
  } catch (error) {
    next(error);
  }
});

export default router;
