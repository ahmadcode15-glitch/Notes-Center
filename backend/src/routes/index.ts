import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import coursesRoutes from './courses.routes';
import notesRoutes from './notes.routes';
import accessRoutes from './access.routes';
import sessionsRoutes from './sessions.routes';
import packagesRoutes from './packages.routes';
import paymentsRoutes from './payments.routes';
import announcementsRoutes from './announcements.routes';
import socialLinksRoutes from './socialLinks.routes';
import settingsRoutes from './settings.routes';
import activityLogsRoutes from './activityLogs.routes';
import statsRoutes from './stats.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/notes', notesRoutes);
router.use('/access', accessRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/packages', packagesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/social-links', socialLinksRoutes);
router.use('/settings', settingsRoutes);
router.use('/activity-logs', activityLogsRoutes);
router.use('/stats', statsRoutes);
router.use('/upload', uploadRoutes);

export default router;

