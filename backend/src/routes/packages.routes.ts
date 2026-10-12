import { Router } from 'express';
import { getPackages, createPackage, updatePackage, deletePackage } from '../controllers/packages.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Authenticated users can list packages
router.get('/', authenticate, getPackages);

// Super Admin only management
router.post('/', authenticate, requireSuperAdmin, createPackage);
router.put('/:id', authenticate, requireSuperAdmin, updatePackage);
router.delete('/:id', authenticate, requireSuperAdmin, deletePackage);

export default router;

