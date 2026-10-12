import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

export async function getCourses(req: AuthRequest, res: Response) {
  try {
    const where: any = {};

    // Scoping:
    // USER (Students) can ONLY see courses they are actively enrolled in!
    if (req.user?.role === 'USER') {
      where.status = 'ACTIVE';
      where.userAccess = {
        some: {
          userId: req.user.id,
          status: 'ACTIVE',
          expiryDate: { gt: new Date() },
        },
      };
    } else if (req.user?.role === 'ADMIN') {
      // Regular ADMIN only sees courses they created
      where.createdById = req.user.id;
    } else if (req.user?.role === 'SUPER_ADMIN') {
      if (req.query.adminId) {
        where.createdById = req.query.adminId as string;
      }
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
        _count: {
          select: {
            semesters: true,
            notes: true,
          },
        },
      },
    });

    return res.json({ success: true, courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
}

export async function getCourseById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Student enrollment validation:
    if (req.user?.role === 'USER') {
      const enrollment = await prisma.userAccess.findFirst({
        where: {
          userId: req.user.id,
          status: 'ACTIVE',
          expiryDate: { gt: new Date() },
          OR: [
            { courseId: id },
            { note: { courseId: id } },
          ],
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not enrolled in this course.',
        });
      }
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
        semesters: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              orderBy: { createdAt: 'asc' },
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                },
                _count: {
                  select: { notes: true },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Admin scoping:
    if (req.user?.role === 'ADMIN' && course.createdById && course.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own courses.',
      });
    }

    return res.json({ success: true, course });
  } catch (error) {
    console.error('Get course by id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch course details.' });
  }
}

export async function createCourse(req: AuthRequest, res: Response) {
  try {
    const { title, code, description, status } = req.body;
    if (!title || !code) {
      return res.status(400).json({ success: false, message: 'Course title and unique code are required.' });
    }

    const trimmedCode = code.trim().toUpperCase();
    const existing = await prisma.course.findUnique({ where: { code: trimmedCode } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Course code '${trimmedCode}' already exists.` });
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        code: trimmedCode,
        description: description?.trim() || null,
        status: status || 'ACTIVE',
        createdById: req.user?.id,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'COURSE_CREATED',
      details: `Created course '${course.title}' (${course.code}).`,
      req,
    });

    return res.status(201).json({ success: true, course, message: 'Course created successfully.' });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create course.' });
  }
}

export async function updateCourse(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, code, description, status } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user?.role === 'ADMIN' && existing.createdById && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only modify your own courses.',
      });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'COURSE_UPDATED',
      details: `Updated course '${course.title}' (${course.code}).`,
      req,
    });

    return res.json({ success: true, course, message: 'Course updated successfully.' });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user?.role === 'ADMIN' && existing.createdById && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own courses.',
      });
    }

    const course = await prisma.course.delete({ where: { id } });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'COURSE_DELETED',
      details: `Deleted course '${course.title}' (${course.code}).`,
      req,
    });

    return res.json({ success: true, message: `Course '${course.title}' deleted successfully.` });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
}

// Semester CRUD
export async function createSemester(req: AuthRequest, res: Response) {
  try {
    const { courseId, title, order } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ success: false, message: 'Course ID and Semester title are required.' });
    }

    const semester = await prisma.semester.create({
      data: {
        courseId,
        title: title.trim(),
        order: typeof order === 'number' ? order : 1,
      },
    });

    return res.status(201).json({ success: true, semester, message: 'Semester created successfully.' });
  } catch (error) {
    console.error('Create semester error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create semester.' });
  }
}

export async function deleteSemester(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.semester.delete({ where: { id } });
    return res.json({ success: true, message: 'Semester deleted successfully.' });
  } catch (error) {
    console.error('Delete semester error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete semester.' });
  }
}

// Subject CRUD
export async function createSubject(req: AuthRequest, res: Response) {
  try {
    const { semesterId, title, code, description, icon } = req.body;
    if (!semesterId || !title || !code) {
      return res.status(400).json({ success: false, message: 'Semester ID, title, and subject code are required.' });
    }

    const subject = await prisma.subject.create({
      data: {
        semesterId,
        title: title.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        icon: icon || 'BookOpen',
      },
    });

    await recordActivity({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'SUBJECT_CREATED',
      details: `Created subject '${subject.title}' (${subject.code}).`,
      req,
    });

    return res.status(201).json({ success: true, subject, message: 'Subject created successfully.' });
  } catch (error) {
    console.error('Create subject error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
}

export async function updateSubject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, code, description, icon } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon && { icon }),
      },
    });

    return res.json({ success: true, subject, message: 'Subject updated successfully.' });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
}

export async function deleteSubject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    return res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
}

// Topic CRUD
export async function createTopic(req: AuthRequest, res: Response) {
  try {
    const { subjectId, title, order } = req.body;
    if (!subjectId || !title) {
      return res.status(400).json({ success: false, message: 'Subject ID and topic title are required.' });
    }

    const topic = await prisma.topic.create({
      data: {
        subjectId,
        title: title.trim(),
        order: typeof order === 'number' ? order : 1,
      },
    });

    return res.status(201).json({ success: true, topic, message: 'Topic created successfully.' });
  } catch (error) {
    console.error('Create topic error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create topic.' });
  }
}

export async function deleteTopic(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id } });
    return res.json({ success: true, message: 'Topic deleted successfully.' });
  } catch (error) {
    console.error('Delete topic error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete topic.' });
  }
}

// Full curriculum hierarchy for student
export async function getStudentCurriculum(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const now = new Date();

    // Check user active access grants
    const activeGrants = await prisma.userAccess.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiryDate: { gt: now },
      },
    });

    const grantedCourseIds = new Set(
      activeGrants.filter((g) => g.accessType === 'COURSE' && g.courseId).map((g) => g.courseId!)
    );
    const grantedSubjectIds = new Set(
      activeGrants.filter((g) => g.accessType === 'SUBJECT' && g.subjectId).map((g) => g.subjectId!)
    );
    const grantedNoteIds = new Set(
      activeGrants.filter((g) => g.accessType === 'NOTE' && g.noteId).map((g) => g.noteId!)
    );

    const courseWhere: any = { status: 'ACTIVE' };
    if (req.user?.role === 'USER') {
      courseWhere.OR = [
        { id: { in: Array.from(grantedCourseIds) } },
        { semesters: { some: { subjects: { some: { id: { in: Array.from(grantedSubjectIds) } } } } } },
        { notes: { some: { id: { in: Array.from(grantedNoteIds) } } } },
      ];
    }

    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        semesters: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                },
                _count: {
                  select: { notes: { where: { status: 'PUBLISHED' } } },
                },
              },
            },
          },
        },
      },
    });

    const mapped = courses.map((course) => {
      const hasCourseAccess = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN' || grantedCourseIds.has(course.id);
      return {
        ...course,
        hasAccess: hasCourseAccess,
        semesters: course.semesters.map((sem) => ({
          ...sem,
          subjects: sem.subjects.map((sub) => {
            const hasSubAccess = hasCourseAccess || grantedSubjectIds.has(sub.id);
            return {
              ...sub,
              hasAccess: hasSubAccess,
            };
          }),
        })),
      };
    });

    return res.json({ success: true, courses: mapped });
  } catch (error) {
    console.error('Student curriculum error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student curriculum.' });
  }
}

