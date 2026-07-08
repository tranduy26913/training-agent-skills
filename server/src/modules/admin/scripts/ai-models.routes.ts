import { Router } from 'express';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { ScriptsController } from './scripts.controller';

const router = Router();
const controller = new ScriptsController();

router.use(authMiddleware, requireRole('admin'));
router.get('/', asyncHandler(controller.getAiModels.bind(controller)));

export const aiModelsRoutes = router;
