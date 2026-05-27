// タグルート定義 / Tags module routes (public)
import { Router } from 'express';
import { VocabulariesController } from './vocabularies/vocabularies.controller';

const router = Router();
const controller = new VocabulariesController();

// タグ提案はpublicエンドポイント / Tags suggest is public (no auth required)
router.get('/suggest', controller.suggestTags.bind(controller));

export const tagsRoutes = router;
