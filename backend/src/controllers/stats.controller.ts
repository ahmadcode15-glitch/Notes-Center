import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const isAdmin = req.user?.role === 'ADMIN';
    const userScope = isAdmin ? { createdById: req.user!.id } : {};
    const courseScope = isAdmin ? { createdById: req.user!.id } : {};
    const noteScope = isAdmin ? { createdById: req.user!.id } : {};
    const sessionScope = isAdmin ? { user: { createdById: req.user!.id } } : {};

    const [
      totalUsers,
      activeUsers,
      expiredUsers,
      suspendedUsers,
      totalCourses,
      totalSubjects,
      totalNotes,
      activeSessions,
      todayLogins,
      recentActivity,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER', ...userScope } }),
      prisma.user.count({ where: { role: 'USER', status: 'ACTIVE', ...userScope } }),
      prisma.user.count({ where: { role: 'USER', status: 'EXPIRED', ...userScope } }),
      prisma.user.count({ where: { role: 'USER', status: { in: ['SUSPENDED', 'DISABLED'] }, ...userScope } }),
      prisma.course.count({ where: courseScope }),
      prisma.subject.count(),
      prisma.note.count({ where: noteScope }),
      prisma.session.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: now },
          ...sessionScope,
        },
      }),
      prisma.session.count({
        where: {
          createdAt: { gte: startOfToday },
          ...sessionScope,
        },
      }),
      prisma.activityLog.findMany({
        where: isAdmin ? { userId: req.user!.id } : {},
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: isAdmin ? { user: { createdById: req.user!.id } } : {},
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          user: { select: { username: true, fullName: true } },
          package: { select: { name: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        expiredUsers,
        suspendedUsers,
        totalCourses,
        totalSubjects,
        totalNotes,
        activeSessions,
        todayLogins,
      },
      recentActivity,
      recentPayments,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
  }
}

