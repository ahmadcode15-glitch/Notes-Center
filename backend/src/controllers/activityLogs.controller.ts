import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';

export async function getActivityLogs(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const action = req.query.action as string;
    const username = req.query.username as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (username) {
      where.username = { contains: username.trim() };
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, role: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activity logs.' });
  }
}

