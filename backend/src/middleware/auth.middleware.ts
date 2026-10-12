import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AuthRequest, AuthenticatedUser, AuthenticatedSession } from '../types';

interface JwtPayload {
  userId: string;
  sessionId: string;
  role: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Verify session in database
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: true,
      },
    });

    if (!session || session.isRevoked) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_REVOKED',
        message: 'Your session has been revoked or logged out. Please log in again.',
      });
    }

    if (new Date() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    const user = session.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: `Your account is currently ${user.status.toLowerCase()}. Please contact administrator.`,
      });
    }

    // Strict student access expiry and inactive policy
    if (user.role === 'USER') {
      const isPastExpiry = user.accessExpiry && new Date() > new Date(user.accessExpiry);
      if (user.status === 'EXPIRED' || user.status === 'INACTIVE' || isPastExpiry) {
        if (isPastExpiry && user.status !== 'EXPIRED') {
          prisma.user.update({
            where: { id: user.id },
            data: { status: 'EXPIRED' },
          }).catch(() => {});
        }
        prisma.session.updateMany({
          where: { userId: user.id, isRevoked: false },
          data: { isRevoked: true },
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_EXPIRED',
          message: 'Your account access has expired or is inactive. Please contact administration on WhatsApp to reactivate.',
        });
      }
    }

    // Asynchronously update lastActiveAt (touch session)
    prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as any,
      status: user.status as any,
      maxDevices: user.maxDevices,
      accessExpiry: user.accessExpiry,
    };

    req.sessionRecord = {
      id: session.id,
      userId: session.userId,
      deviceIdentifier: session.deviceIdentifier,
      deviceName: session.deviceName,
      expiresAt: session.expiresAt,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.',
    });
  }
  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Administrator privileges required.',
    });
  }
  next();
}

export async function checkMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const maintenanceSetting = await prisma.setting.findUnique({
      where: { key: 'maintenance_mode' },
    });

    if (maintenanceSetting && maintenanceSetting.value === 'true') {
      // Check if user is admin
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
            return next(); // Admins bypass maintenance
          }
        } catch {
          // Continue to maintenance response
        }
      }

      return res.status(503).json({
        success: false,
        isMaintenance: true,
        message: 'Notes Center is temporarily under maintenance. Please try again later.',
      });
    }

    next();
  } catch (error) {
    next();
  }
}

