import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getRecentlyViewed,
} from '../controllers/notes.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protected search & recently viewed
router.get('/search', authenticate, searchNotes);
router.get('/recently-viewed', authenticate, getRecentlyViewed);

// List notes & view protected note
router.get('/', authenticate, getNotes);
router.get('/:id', authenticate, getNoteById);

// Admin-only operations
router.post('/', authenticate, requireAdmin, createNote);
router.put('/:id', authenticate, requireAdmin, updateNote);
router.delete('/:id', authenticate, requireAdmin, deleteNote);

export default router;

