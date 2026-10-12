import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/dashboard', getDashboardStats);

export default router;

