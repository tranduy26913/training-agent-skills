import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { validate } from '@middleware/validate.middleware';
import { createUserSchema, updateUserSchema, checkEmailSchema } from './users.validation';

const router = Router();
const controller = new UsersController();

// 全ルートに認証 + 管琁E��E��限を適用 / Apply auth + admin guard to all routes
router.use(authMiddleware, requireRole('admin'));

router.get('/', controller.getUsers.bind(controller));
router.post('/', validate(createUserSchema), controller.createUser.bind(controller));
// NOTE: /check-email must be registered before /:id to avoid route conflict
router.get('/check-email', validate(checkEmailSchema, 'query'), controller.checkEmail.bind(controller));
router.get('/:id', controller.getUser.bind(controller));
router.put('/:id', validate(updateUserSchema), controller.updateUser.bind(controller));
router.delete('/:id', controller.deleteUser.bind(controller));
router.get('/:id/activity', controller.getUserActivity.bind(controller));

export const usersRoutes = router;
