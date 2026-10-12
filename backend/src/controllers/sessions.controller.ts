import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getActiveSessions(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const where: any = {
      isRevoked: false,
      expiresAt: { gt: now },
    };

    // Admin Scoping: Regular admin only sees active sessions of their own students
    if (req.user?.role === 'ADMIN') {
      where.user = { createdById: req.user.id };
    } else if (req.user?.role === 'SUPER_ADMIN' && req.query.adminId) {
      where.user = { createdById: req.query.adminId as string };
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { lastActiveAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            status: true,
            maxDevices: true,
            createdById: true,
          },
        },
      },
    });

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get active sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve active sessions.' });
  }
}

export async function revokeSession(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (req.user?.role === 'ADMIN' && session.user.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only revoke sessions for your own students.',
      });
    }

    await prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'SESSION_REVOKED',
      details: `Revoked session ${id} for user '${session.user.username}' on ${session.deviceName}.`,
      req,
    });

    return res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke session.' });
  }
}

export async function revokeAllSessions(req: AuthRequest, res: Response) {
  try {
    const currentSessionId = req.sessionRecord?.id;
    const where: any = {
      id: { not: currentSessionId },
      isRevoked: false,
    };

    if (req.user?.role === 'ADMIN') {
      where.user = { createdById: req.user.id };
    }

    // Revoke sessions
    const result = await prisma.session.updateMany({
      where,
      data: { isRevoked: true },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'ALL_SESSIONS_REVOKED',
      details: `Force logged out all users (${result.count} active sessions terminated).`,
      req,
    });

    return res.json({
      success: true,
      message: `Successfully terminated ${result.count} sessions across the platform.`,
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke sessions.' });
  }
}

