import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogs.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get('/', getActivityLogs);

export default router;

