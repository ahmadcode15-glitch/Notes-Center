import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getPublicSettings(req: AuthRequest, res: Response) {
  try {
    const publicKeys = [
      'platform_name',
      'tagline',
      'maintenance_mode',
      'support_whatsapp',
      'support_email',
      'support_phone',
      'support_instructions',
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: publicKeys } },
    });

    const settingsMap: Record<string, string> = {
      platform_name: 'Notes Center',
      tagline: 'Your Notes. Your Preparation. Your Success.',
      maintenance_mode: 'false',
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error('Get public settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve public settings.' });
  }
}

export async function getAllSettings(req: AuthRequest, res: Response) {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { group: 'asc' },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.json({ success: true, settings: settingsMap, raw: settings });
  } catch (error) {
    console.error('Get all settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system settings.' });
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const updates: Record<string, string> = req.body;

    const groupMapping: Record<string, string> = {
      platform_name: 'GENERAL',
      tagline: 'GENERAL',
      session_duration_hours: 'SECURITY',
      default_max_devices: 'SECURITY',
      watermark_enabled: 'SECURITY',
      watermark_opacity: 'SECURITY',
      login_rate_limiting: 'SECURITY',
      default_note_visibility: 'CONTENT',
      maintenance_mode: 'SYSTEM',
      support_whatsapp: 'SYSTEM',
      support_email: 'SYSTEM',
      support_phone: 'SYSTEM',
      support_instructions: 'SYSTEM',
    };

    for (const [key, value] of Object.entries(updates)) {
      const group = groupMapping[key] || 'GENERAL';
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), group },
      });
    }

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'SETTINGS_UPDATED',
      details: `Updated system settings: ${Object.keys(updates).join(', ')}`,
      req,
    });

    return res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
}

