// 語彙ルート定義 / Vocabulary routes definition
import { Router } from 'express';
import { VocabulariesController } from './vocabularies.controller';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createVocabularySchema,
  updateVocabularySchema,
} from './vocabularies.validation';

const router = Router();
const controller = new VocabulariesController();

// 全ルートに認証 + 管理者権限を適用 / Apply auth + admin guard to all routes
router.use(authMiddleware, requireRole('admin'));

// シンプル一覧 — /:idより前に登録すること / Simple list — must be registered before /:id
router.get('/list/simple', controller.getSimpleList.bind(controller));

// レポート操作 / Report resolve/reject
router.patch('/reports/:reportId/resolve', controller.resolveReport.bind(controller));
router.patch('/reports/:reportId/reject', controller.rejectReport.bind(controller));

// CRUD
router.get('/', controller.getVocabularies.bind(controller));
router.post('/', validate(createVocabularySchema), controller.createVocabulary.bind(controller));
router.get('/:id', controller.getVocabulary.bind(controller));
router.put('/:id', validate(updateVocabularySchema), controller.updateVocabulary.bind(controller));
router.delete('/:id', controller.deleteVocabulary.bind(controller));

// 監査ログ / Audit logs
router.get('/:id/audit-logs', controller.getAuditLogs.bind(controller));

export const vocabulariesRoutes = router;
