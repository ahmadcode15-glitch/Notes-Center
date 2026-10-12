import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getPackages(req: AuthRequest, res: Response) {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        courses: { include: { course: true } },
        subjects: { include: { subject: true } },
        _count: { select: { payments: true } },
      },
    });

    return res.json({ success: true, packages });
  } catch (error) {
    console.error('Get packages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve packages.' });
  }
}

export async function createPackage(req: AuthRequest, res: Response) {
  try {
    const { name, description, price, durationDays, courseIds, subjectIds, status } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Package name and price are required.' });
    }

    const pkg = await prisma.package.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10) || 30,
        status: status || 'ACTIVE',
        courses: {
          create: (courseIds || []).map((courseId: string) => ({ courseId })),
        },
        subjects: {
          create: (subjectIds || []).map((subjectId: string) => ({ subjectId })),
        },
      },
      include: {
        courses: { include: { course: true } },
        subjects: { include: { subject: true } },
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'PACKAGE_CREATED',
      details: `Created package '${pkg.name}' ($${pkg.price}).`,
      req,
    });

    return res.status(201).json({ success: true, package: pkg, message: 'Package created successfully.' });
  } catch (error) {
    console.error('Create package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create package.' });
  }
}

export async function updatePackage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, price, durationDays, status } = req.body;

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(durationDays !== undefined && { durationDays: parseInt(durationDays, 10) }),
        ...(status && { status }),
      },
    });

    return res.json({ success: true, package: pkg, message: 'Package updated successfully.' });
  } catch (error) {
    console.error('Update package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update package.' });
  }
}

export async function deletePackage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.package.delete({ where: { id } });
    return res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    console.error('Delete package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete package.' });
  }
}

