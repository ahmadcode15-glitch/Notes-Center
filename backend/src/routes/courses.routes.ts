import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createSemester,
  deleteSemester,
  createSubject,
  updateSubject,
  deleteSubject,
  createTopic,
  deleteTopic,
  getStudentCurriculum,
} from '../controllers/courses.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Student accessible routes
router.get('/student-tree', authenticate, getStudentCurriculum);
router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);

// Admin-only management routes
router.post('/', authenticate, requireAdmin, createCourse);
router.put('/:id', authenticate, requireAdmin, updateCourse);
router.delete('/:id', authenticate, requireAdmin, deleteCourse);

// Semester routes
router.post('/semesters', authenticate, requireAdmin, createSemester);
router.delete('/semesters/:id', authenticate, requireAdmin, deleteSemester);

// Subject routes
router.post('/subjects', authenticate, requireAdmin, createSubject);
router.put('/subjects/:id', authenticate, requireAdmin, updateSubject);
router.delete('/subjects/:id', authenticate, requireAdmin, deleteSubject);

// Topic routes
router.post('/topics', authenticate, requireAdmin, createTopic);
router.delete('/topics/:id', authenticate, requireAdmin, deleteTopic);

export default router;

