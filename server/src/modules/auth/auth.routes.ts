import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@middleware/validate.middleware';
import { authMiddleware } from '@middleware/auth.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { loginSchema, updateProfileSchema, changePasswordSchema } from './auth.validation';

const router = Router();
const controller = new AuthController();

// Authentication routes.
router.post('/login', validate(loginSchema), asyncHandler(controller.login.bind(controller)));
router.get('/me', authMiddleware, asyncHandler(controller.me.bind(controller)));
router.put('/me', authMiddleware, validate(updateProfileSchema), asyncHandler(controller.updateMe.bind(controller)));
router.put('/me/password', authMiddleware, validate(changePasswordSchema), asyncHandler(controller.changeMyPassword.bind(controller)));

export const authRoutes = router;
