// 学習ルート定義 / FlashCard learning module routes
import { Router } from 'express';
import { LearnController } from './learn.controller';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { batchUpdateProgressSchema, getVocabulariesQuerySchema } from './learn.validation';

const router = Router();
const controller = new LearnController();

// 全ルートに認証 + ユーザー権限を適用 / Apply auth + user guard to all routes
router.use(authMiddleware, requireRole('user'));

router.get('/stats',           controller.getStats.bind(controller));
router.get('/vocabularies',    validate(getVocabulariesQuerySchema, 'query'), controller.getVocabularies.bind(controller));
router.post('/progress/batch', validate(batchUpdateProgressSchema),           controller.batchUpdateProgress.bind(controller));
router.post('/favorite/:vocabularyId', controller.toggleFavorite.bind(controller));

export const learnRoutes = router;
