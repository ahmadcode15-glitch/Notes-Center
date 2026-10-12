import { Router } from 'express';
import { grantAccess, revokeAccess, getUserAccess } from '../controllers/access.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/grant', grantAccess);
router.delete('/:id', revokeAccess);
router.get('/user/:userId', getUserAccess);

export default router;

