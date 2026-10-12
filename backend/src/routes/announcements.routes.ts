import { Router } from 'express';
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public / Student endpoint
router.get('/active', getActiveAnnouncements);

// Super Admin only management
router.get('/', authenticate, requireSuperAdmin, getAllAnnouncements);
router.post('/', authenticate, requireSuperAdmin, createAnnouncement);
router.put('/:id', authenticate, requireSuperAdmin, updateAnnouncement);
router.delete('/:id', authenticate, requireSuperAdmin, deleteAnnouncement);

export default router;

