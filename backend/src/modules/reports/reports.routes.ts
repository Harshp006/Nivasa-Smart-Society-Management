import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { successResponse } from '../../utils/pagination';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/reports/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalApartments,
      occupiedApartments,
      totalResidents,
      pendingVisitors,
      currentVisitors,
      openComplaints,
      upcomingBookings,
      maintenanceStats,
    ] = await Promise.all([
      prisma.apartment.count(),
      prisma.apartment.count({ where: { occupancyStatus: 'OCCUPIED' } }),
      prisma.residentProfile.count({ where: { isActive: true } }),
      prisma.visitor.count({ where: { status: 'PENDING' } }),
      prisma.visitor.count({ where: { status: 'CHECKED_IN' } }),
      prisma.complaint.count({ where: { status: { not: 'CLOSED' } } }),
      prisma.amenityBooking.count({
        where: {
          date: { gte: new Date() },
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      }),
      prisma.maintenanceBill.aggregate({
        _sum: { amount: true, paidAmount: true },
        where: { billingYear: new Date().getFullYear() },
      }),
    ]);

    successResponse(res, {
      apartments: { total: totalApartments, occupied: occupiedApartments, vacant: totalApartments - occupiedApartments },
      residents: totalResidents,
      visitors: { pending: pendingVisitors, currentlyInside: currentVisitors },
      complaints: { open: openComplaints },
      bookings: { upcoming: upcomingBookings },
      maintenance: {
        totalBilled: maintenanceStats._sum.amount || 0,
        totalCollected: maintenanceStats._sum.paidAmount || 0,
        outstanding: Number(maintenanceStats._sum.amount || 0) - Number(maintenanceStats._sum.paidAmount || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/maintenance
router.get('/maintenance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query as any;
    const billYear = year ? parseInt(year) : new Date().getFullYear();

    const bills = await prisma.maintenanceBill.groupBy({
      by: ['billingMonth', 'status'],
      where: { billingYear: billYear },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    });

    const summary = await prisma.maintenanceBill.aggregate({
      where: { billingYear: billYear },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    });

    successResponse(res, { bills, summary, year: billYear });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/complaints
router.get('/complaints', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [byStatus, byCategory, byPriority] = await Promise.all([
      prisma.complaint.groupBy({ by: ['status'], _count: true }),
      prisma.complaint.groupBy({ by: ['category'], _count: true }),
      prisma.complaint.groupBy({ by: ['priority'], _count: true }),
    ]);
    successResponse(res, { byStatus, byCategory, byPriority });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/visitors
router.get('/visitors', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as any;
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [byStatus, byType, total] = await Promise.all([
      prisma.visitor.groupBy({ by: ['status'], where, _count: true }),
      prisma.visitor.groupBy({ by: ['visitorType'], where, _count: true }),
      prisma.visitor.count({ where }),
    ]);

    successResponse(res, { byStatus, byType, total });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20', 10));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          actor: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
