import { prisma } from '../db/prisma';
import { Request } from 'express';

export async function recordActivity(params: {
  userId?: string;
  username?: string;
  action: string;
  details?: string;
  req?: Request;
}) {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'Unknown';

    if (params.req) {
      const forwarded = params.req.headers['x-forwarded-for'];
      ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : params.req.socket.remoteAddress) || '127.0.0.1';
      userAgent = params.req.headers['user-agent'] || 'Unknown';
    }

    await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        username: params.username || null,
        action: params.action,
        details: params.details || null,
        ipAddress,
        userAgent: userAgent.substring(0, 255),
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}

