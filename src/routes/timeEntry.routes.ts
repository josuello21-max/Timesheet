import { Router } from 'express';
import {
    createTimeEntry,
    getTimeEntries,
    updateTimeEntry,
    deleteTimeEntry,
    getWeeklySummary,
} from '../controllers/timeEntry.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTimeEntry);
router.get('/', getTimeEntries);
router.get('/weekly-summary', getWeeklySummary);
router.put('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
