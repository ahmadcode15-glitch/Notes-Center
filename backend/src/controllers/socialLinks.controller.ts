import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

// Public endpoint for Login Page
export async function getPublicSocialLinks(req: AuthRequest, res: Response) {
  try {
    const links = await prisma.socialLink.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' },
    });

    return res.json({ success: true, links });
  } catch (error) {
    console.error('Get public social links error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve social links.' });
  }
}

// Admin endpoint: List all
export async function getAllSocialLinks(req: AuthRequest, res: Response) {
  try {
    const links = await prisma.socialLink.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return res.json({ success: true, links });
  } catch (error) {
    console.error('Get all social links error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve social links.' });
  }
}

// Admin endpoint: Update
export async function updateSocialLink(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { url, isEnabled, displayOrder, title } = req.body;

    const link = await prisma.socialLink.update({
      where: { id },
      data: {
        ...(url !== undefined && { url: url.trim() }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder, 10) }),
        ...(title && { title: title.trim() }),
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'SOCIAL_LINK_UPDATED',
      details: `Updated ${link.platform} social link (Enabled: ${link.isEnabled}, URL: ${link.url}).`,
      req,
    });

    return res.json({ success: true, link, message: 'Social link updated successfully.' });
  } catch (error) {
    console.error('Update social link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update social link.' });
  }
}

// Admin endpoint: Create
export async function createSocialLink(req: AuthRequest, res: Response) {
  try {
    const { platform, title, url, isEnabled, displayOrder } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ success: false, message: 'Platform and URL are required.' });
    }

    const link = await prisma.socialLink.create({
      data: {
        platform: platform.toUpperCase(),
        title: title?.trim() || platform,
        url: url.trim(),
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 1,
      },
    });

    return res.status(201).json({ success: true, link, message: 'Social link created successfully.' });
  } catch (error) {
    console.error('Create social link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create social link.' });
  }
}

// Admin endpoint: Delete
export async function deleteSocialLink(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.socialLink.delete({ where: { id } });
    return res.json({ success: true, message: 'Social link removed.' });
  } catch (error) {
    console.error('Delete social link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete social link.' });
  }
}

