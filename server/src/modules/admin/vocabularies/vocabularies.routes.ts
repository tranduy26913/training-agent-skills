import { Router } from 'express';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { asyncHandler } from '@middleware/async-handler.middleware';
import { validate } from '@middleware/validate.middleware';
import { VocabulariesController } from './vocabularies.controller';
import { createVocabularySchema, updateVocabularySchema } from './vocabularies.validation';

const router = Router();
const controller = new VocabulariesController();

router.use(authMiddleware, requireRole('admin'));

router.get('/', asyncHandler(controller.getVocabularies.bind(controller)));
router.post('/', validate(createVocabularySchema), asyncHandler(controller.createVocabulary.bind(controller)));
router.get('/:id', asyncHandler(controller.getVocabulary.bind(controller)));
router.put('/:id', validate(updateVocabularySchema), asyncHandler(controller.updateVocabulary.bind(controller)));
router.delete('/:id', asyncHandler(controller.deleteVocabulary.bind(controller)));

export const vocabulariesRoutes = router;
