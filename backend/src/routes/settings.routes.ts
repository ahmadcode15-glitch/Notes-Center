import { Router } from 'express';
import {
  getPublicSettings,
  getAllSettings,
  updateSettings,
} from '../controllers/settings.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public configuration endpoint
router.get('/public', getPublicSettings);

// Super Admin only settings management
router.get('/', authenticate, requireSuperAdmin, getAllSettings);
router.post('/bulk', authenticate, requireSuperAdmin, updateSettings);

export default router;

