import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AuthRequest } from '../types';
import { extractDeviceInfo } from '../utils/fingerprint';
import { recordActivity } from '../utils/audit';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: trimmedUsername,
        },
      },
    });

    if (!user) {
      await recordActivity({
        username: trimmedUsername,
        action: 'FAILED_LOGIN',
        details: 'Login attempt with non-existent username.',
        req,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      await recordActivity({
        userId: user.id,
        username: user.username,
        action: 'BLOCKED_LOGIN',
        details: `Login blocked due to ${user.status} account status.`,
        req,
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: `Your account has been ${user.status.toLowerCase()}. Please contact administrator for assistance.`,
      });
    }

    // Strict student access expiry and inactive policy
    if (user.role === 'USER') {
      const isPastExpiry = user.accessExpiry && new Date() > new Date(user.accessExpiry);
      if (user.status === 'EXPIRED' || user.status === 'INACTIVE' || isPastExpiry) {
        if (isPastExpiry && user.status !== 'EXPIRED') {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'EXPIRED' },
          });
        }
        await prisma.session.updateMany({
          where: { userId: user.id, isRevoked: false },
          data: { isRevoked: true },
        });
        await recordActivity({
          userId: user.id,
          username: user.username,
          action: 'BLOCKED_LOGIN',
          details: 'Login blocked due to expired/inactive account.',
          req,
        });
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_EXPIRED',
          message: 'Your account access has expired or is inactive. Please contact administration on WhatsApp to reactivate.',
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await recordActivity({
        userId: user.id,
        username: user.username,
        action: 'FAILED_LOGIN',
        details: 'Incorrect password supplied.',
        req,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Device Management Check
    const deviceInfo = extractDeviceInfo(req);

    // Fetch active non-revoked sessions
    const now = new Date();
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: { gt: now },
      },
    });

    // Check if an existing session is on this exact device
    const existingSessionOnDevice = activeSessions.find(
      (s) => s.deviceIdentifier === deviceInfo.deviceIdentifier
    );

    // If device is not already authorized and active session count >= maxDevices
    if (!existingSessionOnDevice && activeSessions.length >= user.maxDevices) {
      await recordActivity({
        userId: user.id,
        username: user.username,
        action: 'DEVICE_LIMIT_EXCEEDED',
        details: `Max devices (${user.maxDevices}) reached. Login blocked for new device: ${deviceInfo.deviceName}.`,
        req,
      });

      return res.status(403).json({
        success: false,
        code: 'DEVICE_LIMIT_REACHED',
        message: 'You have reached the maximum number of devices allowed for your account. Please log out from another device or contact support/administrator.',
        maxDevices: user.maxDevices,
        activeDevicesCount: activeSessions.length,
      });
    }

    // Determine session duration (from DB setting or default 24 hours)
    let sessionDurationHours = 24;
    const sessionSetting = await prisma.setting.findUnique({
      where: { key: 'session_duration_hours' },
    });
    if (sessionSetting && parseInt(sessionSetting.value, 10) > 0) {
      sessionDurationHours = parseInt(sessionSetting.value, 10);
    }

    const expiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000);

    // If an existing session for this device existed, revoke the previous session token
    if (existingSessionOnDevice) {
      await prisma.session.update({
        where: { id: existingSessionOnDevice.id },
        data: { isRevoked: true },
      });
    }

    // Create session in DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        deviceIdentifier: deviceInfo.deviceIdentifier,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        expiresAt,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: session.id,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: `${sessionDurationHours}h` }
    );

    // Update user's last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // Record activity
    await recordActivity({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      details: `Successful login on ${deviceInfo.deviceName} (${deviceInfo.ipAddress}). Active sessions: ${activeSessions.length + (existingSessionOnDevice ? 0 : 1)}/${user.maxDevices}`,
      req,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      sessionDurationHours,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        maxDevices: user.maxDevices,
        accessExpiry: user.accessExpiry,
        lastLoginAt: user.lastLoginAt,
      },
      session: {
        id: session.id,
        deviceName: session.deviceName,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing login.',
    });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (req.sessionRecord) {
      await prisma.session.update({
        where: { id: req.sessionRecord.id },
        data: { isRevoked: true },
      });

      await recordActivity({
        userId: req.user?.id,
        username: req.user?.username,
        action: 'LOGOUT',
        details: `User logged out from session ${req.sessionRecord.id}`,
        req,
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while logging out.',
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
        maxDevices: true,
        accessExpiry: true,
        lastLoginAt: true,
        createdAt: true,
        sessions: {
          where: { isRevoked: false, expiresAt: { gt: new Date() } },
          select: {
            id: true,
            deviceName: true,
            browser: true,
            os: true,
            ipAddress: true,
            lastActiveAt: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        userAccess: {
          where: { status: 'ACTIVE' },
          include: {
            course: { select: { id: true, title: true, code: true } },
            subject: { select: { id: true, title: true, code: true } },
            note: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user,
      currentSessionId: req.sessionRecord?.id,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHashed },
    });

    await recordActivity({
      userId: user.id,
      username: user.username,
      action: 'PASSWORD_CHANGED',
      details: 'User successfully updated their account password.',
      req,
    });

    return res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
}

