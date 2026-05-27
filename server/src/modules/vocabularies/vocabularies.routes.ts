// 語彙ルート定義 / Vocabulary module routes
import { Router } from 'express';
import { VocabulariesController } from './vocabularies.controller';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createVocabularySchema,
  updateVocabularySchema,
  updateReportStatusSchema,
} from './vocabularies.validation';

const router = Router();
const controller = new VocabulariesController();

// 全ルートに認証 + 管理者権限を適用 / Apply auth + admin guard to all routes
router.use(authMiddleware, requireRole('admin'));

// NOTE: 静的パス /search を /:id より前に登録して衝突を回避 / Register /search before /:id
router.get('/search', controller.searchVocabularies.bind(controller));
router.get('/', controller.getVocabularies.bind(controller));
router.post('/', validate(createVocabularySchema), controller.createVocabulary.bind(controller));
router.get('/:id', controller.getVocabulary.bind(controller));
router.put('/:id', validate(updateVocabularySchema), controller.updateVocabulary.bind(controller));
router.delete('/:id', controller.deleteVocabulary.bind(controller));
router.get('/:id/change-logs', controller.getChangeLogs.bind(controller));
router.get('/:id/reports', controller.getReports.bind(controller));
router.patch('/:id/reports/:reportId', validate(updateReportStatusSchema), controller.updateReportStatus.bind(controller));

export const vocabulariesRoutes = router;
