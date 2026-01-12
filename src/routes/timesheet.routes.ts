import { Router } from 'express';
import {
    createOrGetTimesheet,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet,
    getPendingApprovals,
    getTimesheetById,
} from '../controllers/timesheet.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createOrGetTimesheet);
router.get('/pending-approvals', authorize('MANAGER', 'SUPER_ADMIN'), getPendingApprovals);
router.get('/:id', getTimesheetById);
router.post('/:id/submit', submitTimesheet);
router.post('/:id/approve', authorize('MANAGER', 'SUPER_ADMIN'), approveTimesheet);
router.post('/:id/reject', authorize('MANAGER', 'SUPER_ADMIN'), rejectTimesheet);

export default router;
