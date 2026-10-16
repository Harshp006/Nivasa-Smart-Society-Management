import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate);

const vehicleSchema = z.object({
  registrationNo: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  color: z.string().min(1),
  type: z.string().min(1),
  parkingSlot: z.string().optional(),
});

async function getResidentProfileId(userId: string): Promise<string> {
  const profile = await prisma.residentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, 'Resident profile not found');
  return profile.id;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let residentProfileId = req.query.residentProfileId as string;
    if (req.user!.role === 'RESIDENT') {
      residentProfileId = await getResidentProfileId(req.user!.id);
    } else if (!residentProfileId) {
      throw new ApiError(400, 'residentProfileId required');
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { residentProfileId },
      orderBy: { createdAt: 'asc' },
    });
    successResponse(res, vehicles);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = vehicleSchema.parse(req.body);
    let residentProfileId = req.body.residentProfileId;
    if (req.user!.role === 'RESIDENT') {
      residentProfileId = await getResidentProfileId(req.user!.id);
    }

    const vehicle = await prisma.vehicle.create({ data: { ...data, residentProfileId } });
    successResponse(res, vehicle, 'Vehicle registered', 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id as string }, data });
    successResponse(res, vehicle, 'Vehicle updated');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id as string } });
    successResponse(res, null, 'Vehicle removed');
  } catch (error) {
    next(error);
  }
});

export default router;
