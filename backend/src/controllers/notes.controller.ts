import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

// Admin / Public List of Notes
export async function getNotes(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string || '').trim();
    const courseId = req.query.courseId as string;
    const subjectId = req.query.subjectId as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const conditions: any[] = [];
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }
    if (courseId) conditions.push({ courseId });
    if (subjectId) conditions.push({ subjectId });
    if (status) conditions.push({ status });

    // Scoping:
    // USER (Students) can ONLY see notes they have active course or note approval for!
    if (req.user?.role === 'USER') {
      conditions.push({ status: 'PUBLISHED' });
      conditions.push({
        OR: [
          {
            course: {
              userAccess: {
                some: {
                  userId: req.user.id,
                  status: 'ACTIVE',
                  expiryDate: { gt: new Date() },
                },
              },
            },
          },
          {
            userAccess: {
              some: {
                userId: req.user.id,
                status: 'ACTIVE',
                expiryDate: { gt: new Date() },
              },
            },
          },
        ],
      });
    } else if (req.user?.role === 'ADMIN') {
      // Regular ADMIN only sees notes they created
      conditions.push({ createdById: req.user.id });
    } else if (req.user?.role === 'SUPER_ADMIN') {
      if (req.query.adminId) {
        conditions.push({ createdById: req.query.adminId as string });
      }
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, username: true, fullName: true } },
          course: { select: { id: true, title: true, code: true } },
          subject: { select: { id: true, title: true, code: true } },
          topic: { select: { id: true, title: true } },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return res.json({
      success: true,
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notes.' });
  }
}

// Student Protected Note Viewer with Access Control & Watermarking metadata
export async function getNoteById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;
    const now = new Date();

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, code: true } },
        semester: { select: { id: true, title: true } },
        subject: { select: { id: true, title: true, code: true } },
        topic: { select: { id: true, title: true } },
      },
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Admins have universal preview access
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      // Must be published
      if (note.status !== 'PUBLISHED') {
        return res.status(403).json({
          success: false,
          message: 'This note is currently not published.',
        });
      }

      // Check global account expiry
      if (user.accessExpiry && new Date(user.accessExpiry) < now) {
        return res.status(403).json({
          success: false,
          code: 'ACCESS_EXPIRED',
          message: 'Your platform access has expired. Please contact support or renew your subscription to view this note.',
          expiryDate: user.accessExpiry,
        });
      }

      // Check permissions if note is RESTRICTED_PAID
      if (note.visibility === 'RESTRICTED_PAID') {
        // Query active grants for this student
        const accessGrant = await prisma.userAccess.findFirst({
          where: {
            userId: user.id,
            status: 'ACTIVE',
            expiryDate: { gt: now },
            OR: [
              { accessType: 'NOTE', noteId: note.id },
              ...(note.subjectId ? [{ accessType: 'SUBJECT', subjectId: note.subjectId }] : []),
              ...(note.courseId ? [{ accessType: 'COURSE', courseId: note.courseId }] : []),
            ],
          },
        });

        if (!accessGrant) {
          return res.status(403).json({
            success: false,
            code: 'FORBIDDEN',
            message: 'You do not have access to this educational note. Please contact administrator to subscribe to this course/subject.',
            requiredCourse: note.course?.title,
            requiredSubject: note.subject?.title,
          });
        }
      }

      // Record Recent View
      await prisma.recentView.upsert({
        where: {
          userId_noteId: {
            userId: user.id,
            noteId: note.id,
          },
        },
        update: { viewedAt: now },
        create: {
          userId: user.id,
          noteId: note.id,
          viewedAt: now,
        },
      });
    }

    // Fetch watermark settings
    const watermarkSetting = await prisma.setting.findUnique({ where: { key: 'watermark_enabled' } });
    const opacitySetting = await prisma.setting.findUnique({ where: { key: 'watermark_opacity' } });
    const isWatermarkEnabled = watermarkSetting ? watermarkSetting.value === 'true' : true;
    const watermarkOpacity = opacitySetting ? parseFloat(opacitySetting.value) : 0.15;

    const watermarkData = {
      enabled: isWatermarkEnabled,
      opacity: watermarkOpacity,
      studentUsername: user.username,
      studentName: user.fullName,
      sessionId: req.sessionRecord?.id?.substring(0, 8) || 'SEC-SESSION',
      timestamp: now.toISOString(),
      platform: 'Notes Center',
      watermarkText: `Notes Center  •  ${user.username}  •  ${now.toISOString().split('T')[0]}  •  ID:${req.sessionRecord?.id?.substring(0, 6)}`,
    };

    return res.json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        description: note.description,
        content: note.content,
        fileType: note.fileType,
        coverImage: note.coverImage,
        status: note.status,
        visibility: note.visibility,
        course: note.course,
        semester: note.semester,
        subject: note.subject,
        topic: note.topic,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
      watermark: watermarkData,
      protectionNotice: 'Educational content is protected. Unauthorized sharing, reproduction, or redistribution is strictly prohibited.',
    });
  } catch (error) {
    console.error('Get note by id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load protected note.' });
  }
}

// Search Notes (Respecting permissions)
export async function searchNotes(req: AuthRequest, res: Response) {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ success: true, notes: [], subjects: [], courses: [] });
    }

    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const now = new Date();

    let accessibleCourseIds: string[] = [];
    let accessibleSubjectIds: string[] = [];
    const noteWhere: any = {
      title: { contains: q },
    };

    if (!isAdmin) {
      const activeGrants = await prisma.userAccess.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE',
          expiryDate: { gt: now },
        },
      });

      accessibleCourseIds = activeGrants.filter((g) => g.accessType === 'COURSE' && g.courseId).map((g) => g.courseId!);
      accessibleSubjectIds = activeGrants.filter((g) => g.accessType === 'SUBJECT' && g.subjectId).map((g) => g.subjectId!);
      const accessibleNoteIds = activeGrants.filter((g) => g.accessType === 'NOTE' && g.noteId).map((g) => g.noteId!);

      noteWhere.OR = [
        // Public notes matching query
        { visibility: 'PUBLIC_PREVIEW', title: { contains: q } },
        // Or notes in user's authorized courses, subjects, or notes
        ...(accessibleCourseIds.length > 0 ? [{ courseId: { in: accessibleCourseIds }, title: { contains: q } }] : []),
        ...(accessibleSubjectIds.length > 0 ? [{ subjectId: { in: accessibleSubjectIds }, title: { contains: q } }] : []),
        ...(accessibleNoteIds.length > 0 ? [{ id: { in: accessibleNoteIds }, title: { contains: q } }] : []),
      ];
    }

    const notes = await prisma.note.findMany({
      where: noteWhere,
      include: {
        course: { select: { id: true, title: true, code: true } },
        subject: { select: { id: true, title: true, code: true } },
      },
      take: 20,
    });

    return res.json({
      success: true,
      results: {
        notes,
        courses: [],
        subjects: [],
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform search.' });
  }
}

// Student Recently Viewed Notes
export async function getRecentlyViewed(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const recent = await prisma.recentView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 10,
      include: {
        note: {
          include: {
            course: { select: { id: true, title: true, code: true } },
            subject: { select: { id: true, title: true, code: true } },
          },
        },
      },
    });

    return res.json({
      success: true,
      recentViews: recent.map((r) => ({
        viewedAt: r.viewedAt,
        note: r.note,
      })),
    });
  } catch (error) {
    console.error('Recent views error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recently viewed notes.' });
  }
}

// Admin: Create Note
export async function createNote(req: AuthRequest, res: Response) {
  try {
    const { title, description, content, courseId, semesterId, subjectId, topicId, fileType, status, visibility, coverImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Note title and content are required.' });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        content,
        courseId: courseId || null,
        semesterId: semesterId || null,
        subjectId: subjectId || null,
        topicId: topicId || null,
        fileType: fileType || 'MARKDOWN',
        status: status || 'PUBLISHED',
        visibility: visibility || 'RESTRICTED_PAID',
        coverImage: coverImage || null,
        createdById: req.user?.id,
      },
      include: {
        createdBy: { select: { id: true, username: true, fullName: true } },
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'NOTE_CREATED',
      details: `Created note '${note.title}' (Status: ${note.status}, Visibility: ${note.visibility})`,
      req,
    });

    return res.status(201).json({ success: true, note, message: 'Note created successfully.' });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create note.' });
  }
}

// Admin: Update Note
export async function updateNote(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, content, courseId, semesterId, subjectId, topicId, fileType, status, visibility, coverImage } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (req.user?.role === 'ADMIN' && existing.createdById && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only modify your own notes.',
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(content && { content }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(semesterId !== undefined && { semesterId: semesterId || null }),
        ...(subjectId !== undefined && { subjectId: subjectId || null }),
        ...(topicId !== undefined && { topicId: topicId || null }),
        ...(fileType && { fileType }),
        ...(status && { status }),
        ...(visibility && { visibility }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'NOTE_UPDATED',
      details: `Updated note '${note.title}'.`,
      req,
    });

    return res.json({ success: true, note, message: 'Note updated successfully.' });
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update note.' });
  }
}

// Admin: Delete Note
export async function deleteNote(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (req.user?.role === 'ADMIN' && existing.createdById && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own notes.',
      });
    }

    const note = await prisma.note.delete({ where: { id } });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'NOTE_DELETED',
      details: `Deleted note '${note.title}'.`,
      req,
    });

    return res.json({ success: true, message: `Note '${note.title}' deleted successfully.` });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete note.' });
  }
}

