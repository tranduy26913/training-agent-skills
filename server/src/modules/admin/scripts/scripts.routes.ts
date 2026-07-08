import { Router } from 'express';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { validate } from '@middleware/validate.middleware';
import { ScriptsController } from './scripts.controller';
import { createScriptSchema, generateScriptSchema, updateScriptSchema } from './scripts.validation';

const router = Router();
const controller = new ScriptsController();

router.use(authMiddleware, requireRole('admin'));

router.get('/', asyncHandler(controller.getScripts.bind(controller)));
router.post('/', validate(createScriptSchema), asyncHandler(controller.createScript.bind(controller)));
router.post('/generate', validate(generateScriptSchema), asyncHandler(controller.generateScript.bind(controller)));
router.get('/:id', asyncHandler(controller.getScript.bind(controller)));
router.put('/:id', validate(updateScriptSchema), asyncHandler(controller.updateScript.bind(controller)));
router.delete('/:id', asyncHandler(controller.deleteScript.bind(controller)));

export const scriptsRoutes = router;
