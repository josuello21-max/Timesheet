import { Router } from 'express';
import authRoutes from './auth.routes';
import timeEntryRoutes from './timeEntry.routes';
import timesheetRoutes from './timesheet.routes';
import projectRoutes from './project.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/timesheets', timesheetRoutes);
router.use('/projects', projectRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Star5 Timesheet API',
    });
});

export default router;
