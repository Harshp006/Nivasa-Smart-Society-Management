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

const generateBillsSchema = z.object({
  societyId: z.string(),
  billingMonth: z.number().int().min(1).max(12),
  billingYear: z.number().int().min(2020),
  dueDate: z.string().transform(s => new Date(s)),
  amount: z.number().positive().optional(),
});

// GET /api/v1/maintenance
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { apartmentId, status, month, year } = req.query as any;

    const where: any = {};

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) throw new ApiError(404, 'Resident profile not found');
      where.apartmentId = profile.apartmentId;
    }

    if (apartmentId && req.user!.role !== 'RESIDENT') where.apartmentId = apartmentId;
    if (status) where.status = status;
    if (month) where.billingMonth = parseInt(month);
    if (year) where.billingYear = parseInt(year);

    const [bills, total] = await Promise.all([
      prisma.maintenanceBill.findMany({
        where,
        skip,
        take,
        include: {
          apartment: { select: { building: true, unitNumber: true } },
          payments: {
            where: { paymentStatus: 'COMPLETED' },
            include: { receipt: true },
          },
        },
        orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
      }),
      prisma.maintenanceBill.count({ where }),
    ]);

    paginatedResponse(res, bills, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/maintenance/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.maintenanceBill.findUnique({
      where: { id: req.params.id as string },
      include: {
        apartment: {
          include: {
            residentProfiles: {
              where: { isActive: true },
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        payments: { include: { receipt: true } },
      },
    });

    if (!bill) throw new ApiError(404, 'Bill not found');

    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || bill.apartmentId !== profile.apartmentId) throw new ApiError(403, 'Access denied');
    }

    successResponse(res, bill);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/maintenance/generate — Admin generates bills
router.post('/generate', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = generateBillsSchema.parse(req.body);

    // Get all occupied apartments in the society
    const apartments = await prisma.apartment.findMany({
      where: { societyId: data.societyId, occupancyStatus: 'OCCUPIED' },
    });

    const results = { created: 0, skipped: 0, errors: 0 };

    for (const apt of apartments) {
      try {
        await prisma.maintenanceBill.create({
          data: {
            apartmentId: apt.id,
            billingMonth: data.billingMonth,
            billingYear: data.billingYear,
            amount: data.amount ?? apt.maintenanceAmt,
            dueDate: data.dueDate,
            generatedBy: req.user!.id,
          },
        });
        results.created++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          results.skipped++; // Already exists
        } else {
          results.errors++;
        }
      }
    }

    await createAuditLog({
      actorId: req.user!.id,
      action: 'BILL_GENERATED',
      entityType: 'MaintenanceBill',
      details: { billingMonth: data.billingMonth, billingYear: data.billingYear, ...results },
    });

    // Notify residents
    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const resident of residents) {
      await createNotification({
        userId: resident.id,
        type: 'MAINTENANCE_BILL',
        title: 'Maintenance Bill Generated',
        message: `Your maintenance bill for ${data.billingMonth}/${data.billingYear} has been generated`,
      });
    }

    successResponse(res, results, `Bills generated: ${results.created} created, ${results.skipped} skipped`);
  } catch (error) {
    next(error);
  }
});

export default router;
