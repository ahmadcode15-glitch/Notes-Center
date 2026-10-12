import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getActiveAnnouncements(req: AuthRequest, res: Response) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get active announcements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve announcements.' });
  }
}

export async function getAllAnnouncements(req: AuthRequest, res: Response) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get all announcements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve announcements.' });
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { title, content, type, isActive } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type: type || 'INFO',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'ANNOUNCEMENT_CREATED',
      details: `Created announcement '${announcement.title}'.`,
      req,
    });

    return res.status(201).json({ success: true, announcement, message: 'Announcement created successfully.' });
  } catch (error) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, type, isActive } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json({ success: true, announcement, message: 'Announcement updated successfully.' });
  } catch (error) {
    console.error('Update announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update announcement.' });
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
}

