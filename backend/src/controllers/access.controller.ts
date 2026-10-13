import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function grantAccess(req: AuthRequest, res: Response) {
  try {
    const { userId, accessType, courseId, subjectId, noteId, startDate, expiryDate, daysValid } = req.body;

    if (!userId || !accessType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Access Type (COURSE, SUBJECT, or NOTE) are required.',
      });
    }

    let parsedExpiry: Date;
    if (expiryDate) {
      parsedExpiry = new Date(expiryDate);
    } else if (daysValid) {
      parsedExpiry = new Date();
      parsedExpiry.setDate(parsedExpiry.getDate() + parseInt(String(daysValid), 10));
    } else {
      parsedExpiry = new Date();
      parsedExpiry.setDate(parsedExpiry.getDate() + 30);
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    if (req.user?.role === 'ADMIN' && user.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only grant access to your own students.',
      });
    }

    const grant = await prisma.userAccess.create({
      data: {
        userId,
        accessType,
        courseId: accessType === 'COURSE' ? courseId : null,
        subjectId: accessType === 'SUBJECT' ? subjectId : null,
        noteId: accessType === 'NOTE' ? noteId : null,
        startDate: parsedStart,
        expiryDate: parsedExpiry,
        status: 'ACTIVE',
        grantedBy: req.user?.username,
      },
      include: {
        course: { select: { title: true, code: true } },
        subject: { select: { title: true, code: true } },
        note: { select: { title: true } },
      },
    });

    // Automatically synchronize or extend the student's account accessExpiry
    if (!user.accessExpiry || user.accessExpiry < parsedExpiry) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessExpiry: parsedExpiry,
          // If status was EXPIRED, re-activate
          ...(user.status === 'EXPIRED' && { status: 'ACTIVE' }),
        },
      });
    }

    const targetDesc = grant.course?.title || grant.subject?.title || grant.note?.title || 'Educational Content';

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'ACCESS_GRANTED',
      details: `Granted ${accessType} access to '${user.username}' for '${targetDesc}' until ${parsedExpiry.toISOString().split('T')[0]}.`,
      req,
    });

    return res.status(201).json({
      success: true,
      grant,
      message: 'Access granted successfully.',
    });
  } catch (error) {
    console.error('Grant access error:', error);
    return res.status(500).json({ success: false, message: 'Failed to grant access.' });
  }
}

export async function revokeAccess(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const grant = await prisma.userAccess.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!grant) {
      return res.status(404).json({ success: false, message: 'Access grant not found.' });
    }

    if (req.user?.role === 'ADMIN' && grant.user.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only revoke access for your own students.',
      });
    }

    await prisma.userAccess.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'ACCESS_REVOKED',
      details: `Revoked access record for user '${grant.user.username}'.`,
      req,
    });

    return res.json({
      success: true,
      message: 'Access revoked successfully.',
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke access.' });
  }
}

export async function getUserAccess(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    if (req.user?.role === 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.createdById !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view access records for your own students.',
        });
      }
    }

    const grants = await prisma.userAccess.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, code: true } },
        subject: { select: { id: true, title: true, code: true } },
        note: { select: { id: true, title: true } },
      },
    });

    return res.json({ success: true, grants });
  } catch (error) {
    console.error('Get user access error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve access records.' });
  }
}

