import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { loginSchema } from './auth.validation';

const router = Router();
const controller = new AuthController();

router.post('/login', validate(loginSchema), controller.login.bind(controller));
router.get('/me', authMiddleware, controller.me.bind(controller));

export const authRoutes = router;
