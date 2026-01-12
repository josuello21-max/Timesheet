import { Router } from 'express';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectTasks,
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/tasks', getProjectTasks);
router.post('/', authorize('MANAGER', 'SUPER_ADMIN', 'FINANCE_ADMIN'), createProject);
router.put('/:id', authorize('MANAGER', 'SUPER_ADMIN', 'FINANCE_ADMIN'), updateProject);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteProject);

export default router;
