// チャットルーター / Chat routes for NotebookLM chat feature
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ChatController } from './chat.controller';
import {
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
  listSessionsQuerySchema,
} from './chat.validation';

const router = Router();
const controller = new ChatController();

// 認証ミドルウェアを全ルートに適用 / Apply auth middleware to all routes
router.use(authMiddleware);

// セッション関連ルート / Session routes
router.get(
  '/workspaces/:id/sessions',
  validate(listSessionsQuerySchema, 'query'),
  controller.listSessions.bind(controller),
);
router.post(
  '/workspaces/:id/sessions',
  validate(createSessionSchema),
  controller.createSession.bind(controller),
);
router.get('/sessions/:sessionId', controller.getSession.bind(controller));
router.patch(
  '/sessions/:sessionId',
  validate(updateSessionSchema),
  controller.updateSession.bind(controller),
);

// メッセージ関連ルート / Message routes
router.post(
  '/sessions/:sessionId/messages',
  validate(sendMessageSchema),
  controller.sendMessage.bind(controller),
);
router.get('/sessions/:sessionId/messages', controller.listMessages.bind(controller));

export const chatRoutes = router;
