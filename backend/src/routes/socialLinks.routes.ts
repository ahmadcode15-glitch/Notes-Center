import { Router } from 'express';
import {
  getPublicSocialLinks,
  getAllSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from '../controllers/socialLinks.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public endpoint for Login page
router.get('/public', getPublicSocialLinks);

// Super Admin only management
router.get('/', authenticate, requireSuperAdmin, getAllSocialLinks);
router.post('/', authenticate, requireSuperAdmin, createSocialLink);
router.put('/:id', authenticate, requireSuperAdmin, updateSocialLink);
router.delete('/:id', authenticate, requireSuperAdmin, deleteSocialLink);

export default router;

