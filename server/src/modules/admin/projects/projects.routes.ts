// Projects module routes.
import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { createProjectSchema, updateProjectSchema } from './projects.validation';

const router = Router();
const controller = new ProjectsController();

// Apply auth + admin guard to all routes.
router.use(authMiddleware, requireRole('admin'));

router.get('/', asyncHandler(controller.getProjects.bind(controller)));
router.post('/', validate(createProjectSchema), asyncHandler(controller.createProject.bind(controller)));
router.get('/:id', asyncHandler(controller.getProject.bind(controller)));
router.put('/:id', validate(updateProjectSchema), asyncHandler(controller.updateProject.bind(controller)));
router.delete('/:id', asyncHandler(controller.deleteProject.bind(controller)));

export const projectsRoutes = router;
