import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@middleware/validate.middleware';
import { authMiddleware } from '@middleware/auth.middleware';
import { loginSchema, updateProfileSchema, changePasswordSchema } from './auth.validation';

const router = Router();
const controller = new AuthController();

// 認証ルート / Authentication routes
router.post('/login', validate(loginSchema), controller.login.bind(controller));
router.get('/me', authMiddleware, controller.me.bind(controller));
router.put('/me', authMiddleware, validate(updateProfileSchema), controller.updateMe.bind(controller));
router.put('/me/password', authMiddleware, validate(changePasswordSchema), controller.changeMyPassword.bind(controller));

export const authRoutes = router;
