import { Router } from 'express';
import { getActiveSessions, revokeSession, revokeAllSessions } from '../controllers/sessions.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/active', getActiveSessions);
router.delete('/:id', revokeSession);
router.post('/revoke-all-users', revokeAllSessions);

export default router;

