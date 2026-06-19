/**
 * Vocabulary Routes
 * Express router for vocabulary management endpoints
 * English and Japanese comments for clarity
 */

import { Router } from 'express';
import { VocabularyController } from './vocabulary.controller';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { validate } from '@middleware/validate.middleware';
import {
  createVocabularySchema,
  updateVocabularySchema,
  resolveReportSchema,
} from './vocabulary.validation';

const router = Router();
const controller = new VocabularyController();

// Apply authentication middleware to all routes
// 全ルートに認証ミドルウェアを適用
router.use(authMiddleware);

// Public routes (read-only) - require authentication
// 公開ルート（読み取り専用�E�E 認証が忁E��E
router.get('/', controller.findAll.bind(controller));
router.get('/:id', controller.findById.bind(controller));
router.get('/:id/analytics', controller.getAnalytics.bind(controller));
router.get('/relations/options', controller.getRelationOptions.bind(controller));

// Admin-only routes (write operations) - require admin role
// 管琁E��E��用ルート（書き込み操作！E 管琁E��E��限が忁E��E
router.post('/', requireRole('admin'), validate(createVocabularySchema), controller.create.bind(controller));
router.put('/:id', requireRole('admin'), validate(updateVocabularySchema), controller.update.bind(controller));
router.delete('/:id', requireRole('admin'), controller.delete.bind(controller));
router.patch('/:id/reports/:reportId', requireRole('admin'), validate(resolveReportSchema), controller.resolveReport.bind(controller));

export const vocabularyRoutes = router;
