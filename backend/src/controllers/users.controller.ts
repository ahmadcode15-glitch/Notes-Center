import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string || '').trim();
    const role = req.query.role as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    // Automatically mark any student accounts whose expiry date has arrived/passed as EXPIRED
    await prisma.user.updateMany({
      where: {
        role: 'USER',
        status: 'ACTIVE',
        accessExpiry: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { fullName: { contains: search } },
      ];
    }

    // Role-based visibility scoping:
    // Regular ADMIN can ONLY see students they created (cannot see other admins or other students)
    if (req.user?.role === 'ADMIN') {
      where.createdById = req.user.id;
      where.role = 'USER';
    } else if (req.user?.role === 'SUPER_ADMIN') {
      const adminFilter = req.query.adminId as string;
      if (adminFilter) {
        where.createdById = adminFilter;
      }
      if (role) {
        where.role = role;
      }
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          createdById: true,
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
          _count: {
            select: {
              sessions: { where: { isRevoked: false, expiresAt: { gt: new Date() } } },
              userAccess: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
        createdById: true,
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
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
          orderBy: { createdAt: 'desc' },
          include: {
            course: { select: { id: true, title: true, code: true } },
            subject: { select: { id: true, title: true, code: true } },
            note: { select: { id: true, title: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            package: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user?.role === 'ADMIN' && user.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own students.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { username, fullName, password, role, status, maxDevices, accessExpiry } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, Full Name, and Password are required.',
      });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Username '${trimmedUsername}' is already taken.`,
      });
    }

    // Role scoping: Regular ADMIN can ONLY create USER (students)
    let assignedRole = role || 'USER';
    let assignedCreatedById = req.user?.id;

    if (req.user?.role === 'ADMIN') {
      assignedRole = 'USER';
      assignedCreatedById = req.user.id;
    } else if (req.user?.role === 'SUPER_ADMIN') {
      if (req.body.createdById) {
        assignedCreatedById = req.body.createdById;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        fullName: fullName.trim(),
        passwordHash,
        role: assignedRole,
        status: status || 'ACTIVE',
        maxDevices: typeof maxDevices === 'number' ? maxDevices : 1,
        accessExpiry: accessExpiry ? new Date(accessExpiry) : null,
        createdById: assignedCreatedById,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    // If initial course is assigned, grant active access
    if (req.body.courseId) {
      const grantExpiry = accessExpiry ? new Date(accessExpiry) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      await prisma.userAccess.create({
        data: {
          userId: user.id,
          accessType: 'COURSE',
          courseId: req.body.courseId,
          startDate: new Date(),
          expiryDate: grantExpiry,
          status: 'ACTIVE',
          grantedBy: req.user?.username || 'Admin',
        },
      });
    }

    // If initial note is assigned, grant active access
    if (req.body.noteId) {
      const grantExpiry = accessExpiry ? new Date(accessExpiry) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      await prisma.userAccess.create({
        data: {
          userId: user.id,
          accessType: 'NOTE',
          noteId: req.body.noteId,
          startDate: new Date(),
          expiryDate: grantExpiry,
          status: 'ACTIVE',
          grantedBy: req.user?.username || 'Admin',
        },
      });
    }

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'USER_CREATED',
      details: `Created user '${user.username}' with role '${user.role}' and max devices ${user.maxDevices}.`,
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        maxDevices: user.maxDevices,
        accessExpiry: user.accessExpiry,
        createdById: user.createdById,
        createdBy: user.createdBy,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, role, status, maxDevices, accessExpiry } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Admin scoping: Regular admin can only edit students they created
    if (req.user?.role === 'ADMIN') {
      if (existingUser.createdById !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only modify your own students.',
        });
      }
    }

    // Protect Super Admin role alteration unless performed by another Super Admin
    if (existingUser.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can modify Super Admin accounts.',
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(req.user?.role === 'SUPER_ADMIN' && role && { role }),
        ...(status && { status }),
        ...(typeof maxDevices === 'number' && { maxDevices }),
        ...(accessExpiry !== undefined && { accessExpiry: accessExpiry ? new Date(accessExpiry) : null }),
      },
    });

    // If status changed to DISABLED, SUSPENDED, EXPIRED, or INACTIVE, revoke all active sessions
    if (status === 'DISABLED' || status === 'SUSPENDED' || status === 'EXPIRED' || status === 'INACTIVE') {
      await prisma.session.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'USER_UPDATED',
      details: `Updated user '${updated.username}' (Status: ${updated.status}, Role: ${updated.role}, Max Devices: ${updated.maxDevices})`,
      req,
    });

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user: updated,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user?.role === 'ADMIN' && targetUser.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only reset passwords for your own students.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Revoke all existing sessions for security
    await prisma.session.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'PASSWORD_RESET',
      details: `Admin reset password for user '${user.username}' and revoked active sessions.`,
      req,
    });

    return res.json({
      success: true,
      message: `Password reset successfully for ${user.username}. All active sessions revoked.`,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
}

export async function forceLogout(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user?.role === 'ADMIN' && user.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only manage sessions for your own students.',
      });
    }

    const result = await prisma.session.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'FORCE_LOGOUT',
      details: `Revoked ${result.count} active sessions for user '${user.username}'.`,
      req,
    });

    return res.json({
      success: true,
      message: `Revoked ${result.count} active sessions for ${user.username}.`,
    });
  } catch (error) {
    console.error('Force logout error:', error);
    return res.status(500).json({ success: false, message: 'Failed to force logout user.' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user?.role === 'ADMIN' && user.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own students.',
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete a Super Administrator account.',
      });
    }

    await prisma.user.delete({ where: { id } });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'USER_DELETED',
      details: `Deleted user '${user.username}' (ID: ${id})`,
      req,
    });

    return res.json({
      success: true,
      message: `User '${user.username}' has been deleted successfully.`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

