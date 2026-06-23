import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { createUserSchema, updateUserSchema, checkEmailSchema } from './users.validation';

const router = Router();
const controller = new UsersController();

// Apply auth + admin guard to all routes.
router.use(authMiddleware, requireRole('admin'));

router.get('/', asyncHandler(controller.getUsers.bind(controller)));
router.post('/', validate(createUserSchema), asyncHandler(controller.createUser.bind(controller)));
// NOTE: /check-email must be registered before /:id to avoid route conflict.
router.get('/check-email', validate(checkEmailSchema, 'query'), asyncHandler(controller.checkEmail.bind(controller)));
router.get('/:id', asyncHandler(controller.getUser.bind(controller)));
router.put('/:id', validate(updateUserSchema), asyncHandler(controller.updateUser.bind(controller)));
router.delete('/:id', asyncHandler(controller.deleteUser.bind(controller)));
router.get('/:id/activity', asyncHandler(controller.getUserActivity.bind(controller)));

export const usersRoutes = router;