import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string;
    const search = (req.query.search as string || '').trim();

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (req.user?.role === 'ADMIN') {
      where.user = { createdById: req.user.id };
    }
    if (search) {
      where.OR = [
        { transactionRef: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
          package: { select: { id: true, name: true, price: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json({
      success: true,
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment records.' });
  }
}

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const { userId, packageId, amount, paymentMethod, transactionRef, paymentDate, expiryDate, status, notes } = req.body;

    if (!userId || amount === undefined || !paymentMethod || !transactionRef) {
      return res.status(400).json({
        success: false,
        message: 'User ID, amount, payment method, and transaction reference are required.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId: packageId || null,
        amount: parseFloat(amount),
        paymentMethod,
        transactionRef: transactionRef.trim(),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'PAID',
        notes: notes?.trim() || null,
        recordedBy: req.user?.username,
      },
      include: {
        user: { select: { username: true } },
        package: {
          include: {
            courses: true,
            subjects: true,
          },
        },
      },
    });

    // If status is PAID and a package or expiry is attached, grant user access
    if (payment.status === 'PAID') {
      const grantExpiry = payment.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Extend user account access expiry
      if (!user.accessExpiry || user.accessExpiry < grantExpiry) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            accessExpiry: grantExpiry,
            ...(user.status === 'EXPIRED' && { status: 'ACTIVE' }),
          },
        });
      }

      // If package has courses/subjects, grant access entries
      if (payment.package) {
        for (const pc of payment.package.courses) {
          await prisma.userAccess.create({
            data: {
              userId,
              accessType: 'COURSE',
              courseId: pc.courseId,
              startDate: new Date(),
              expiryDate: grantExpiry,
              status: 'ACTIVE',
              grantedBy: req.user?.username,
            },
          });
        }
        for (const ps of payment.package.subjects) {
          await prisma.userAccess.create({
            data: {
              userId,
              accessType: 'SUBJECT',
              subjectId: ps.subjectId,
              startDate: new Date(),
              expiryDate: grantExpiry,
              status: 'ACTIVE',
              grantedBy: req.user?.username,
            },
          });
        }
      }
    }

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'PAYMENT_RECORDED',
      details: `Recorded payment of $${payment.amount} for user '${user.username}' (Ref: ${payment.transactionRef}, Status: ${payment.status}).`,
      req,
    });

    return res.status(201).json({
      success: true,
      payment,
      message: 'Payment recorded successfully.',
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
}

export async function updatePaymentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: { user: true },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'PAYMENT_STATUS_UPDATED',
      details: `Updated payment ${id} status to '${payment.status}' for user '${payment.user.username}'.`,
      req,
    });

    return res.json({ success: true, payment, message: 'Payment updated successfully.' });
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment.' });
  }
}

export async function deletePayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.payment.delete({ where: { id } });
    return res.json({ success: true, message: 'Payment record deleted successfully.' });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete payment.' });
  }
}

