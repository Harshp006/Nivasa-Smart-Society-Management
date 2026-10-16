import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { successResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';
import { createNotification } from '../../utils/notifications';

const router = Router();
router.use(authenticate);

const paymentSchema = z.object({
  billId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['DEMO_PAYMENT', 'UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE']),
  notes: z.string().optional(),
});

// POST /api/v1/payments — Make a payment
router.post('/', authorize('RESIDENT', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = paymentSchema.parse(req.body);

    const bill = await prisma.maintenanceBill.findUnique({
      where: { id: data.billId },
      include: { apartment: { include: { residentProfiles: { where: { isActive: true } } } } },
    });

    if (!bill) throw new ApiError(404, 'Bill not found');

    // Residents can only pay their own apartment's bills
    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || bill.apartmentId !== profile.apartmentId) throw new ApiError(403, 'Access denied');
    }

    if (bill.status === 'PAID') throw new ApiError(400, 'Bill is already fully paid');

    const remaining = Number(bill.amount) - Number(bill.paidAmount);
    if (data.amount > remaining) {
      throw new ApiError(400, `Payment amount exceeds remaining balance of ₹${remaining}`);
    }

    const isDemo = data.paymentMethod === 'DEMO_PAYMENT';
    const refPrefix = isDemo ? 'DEMO-' : 'PAY-';
    const referenceNumber = `${refPrefix}${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          billId: data.billId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'COMPLETED',
          referenceNumber,
          isDemo,
          notes: data.notes,
        },
      });

      const newPaidAmount = Number(bill.paidAmount) + data.amount;
      const newStatus = newPaidAmount >= Number(bill.amount) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.maintenanceBill.update({
        where: { id: data.billId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      // Generate receipt
      const receiptNo = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const receipt = await tx.paymentReceipt.create({
        data: {
          paymentId: payment.id,
          receiptNo,
          receiptData: {
            receiptNo,
            isDemo,
            paymentId: payment.id,
            referenceNumber,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paidAt: payment.paidAt,
            billId: data.billId,
            billingMonth: bill.billingMonth,
            billingYear: bill.billingYear,
            apartmentInfo: `${bill.apartment?.building || ''} - ${bill.apartment?.unitNumber || ''}`,
            demoDisclaimer: isDemo ? 'THIS IS A SIMULATED DEMO PAYMENT. No actual money was transferred.' : null,
          },
        },
      });

      return { payment, receipt };
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.payment.id,
      details: { amount: data.amount, isDemo, referenceNumber },
    });

    // Notify resident
    if (req.user!.role === 'ADMIN') {
      const profile = bill.apartment?.residentProfiles[0];
      if (profile) {
        const resProfile = await prisma.residentProfile.findUnique({
          where: { id: profile.id },
          include: { user: true },
        });
        if (resProfile) {
          await createNotification({
            userId: resProfile.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Recorded',
            message: `Payment of ₹${data.amount} recorded for bill ${bill.billingMonth}/${bill.billingYear}`,
            entityId: result.payment.id,
            entityType: 'Payment',
          });
        }
      }
    }

    successResponse(res, result, isDemo ? 'Demo payment recorded (simulated only)' : 'Payment recorded', 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/payments/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
      include: {
        bill: {
          include: { apartment: { select: { building: true, unitNumber: true } } },
        },
        receipt: true,
      },
    });

    if (!payment) throw new ApiError(404, 'Payment not found');
    successResponse(res, payment);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/payments/receipts/:id
router.get('/receipts/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: req.params.id as string },
      include: {
        payment: {
          include: {
            bill: {
              include: { apartment: { include: { society: true } } },
            },
          },
        },
      },
    });

    if (!receipt) throw new ApiError(404, 'Receipt not found');

    // Residents can only view their own receipts
    if (req.user!.role === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || receipt.payment.bill.apartmentId !== profile.apartmentId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    successResponse(res, receipt);
  } catch (error) {
    next(error);
  }
});

export default router;
