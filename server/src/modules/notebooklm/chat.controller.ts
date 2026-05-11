// チャットコントローラー / Chat controller handling HTTP requests
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/express.d';
import { handleError, sendSuccess, sendError } from '../../utils/response.util';
import { ChatService } from './chat.service';
import {
  updateSessionSchema,
  sendMessageSchema,
  listSessionsQuerySchema,
  createSessionSchema,
} from './chat.validation';

export class ChatController {
  private readonly service: ChatService;

  // コンストラクタ / Constructor with optional service injection for testing
  constructor(service?: ChatService) {
    this.service = service ?? new ChatService();
  }

  // セッション一覧 / GET /workspaces/:id/sessions
  async listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = Number(req.params.id);
      const userId = req.user!.userId;

      const queryResult = listSessionsQuerySchema.safeParse(req.query);
      const filters = queryResult.success ? queryResult.data : {};

      const result = await this.service.listSessions(workspaceId, userId, filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  // セッション作成 / POST /workspaces/:id/sessions
  async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = Number(req.params.id);
      const userId = req.user!.userId;

      const parsed = createSessionSchema.safeParse(req.body);
      const dto = parsed.success ? parsed.data : {};

      const session = await this.service.createSession(workspaceId, dto, userId);
      sendSuccess(res, { data: session }, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  // セッション更新 / PATCH /sessions/:sessionId
  async updateSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessionId = Number(req.params.sessionId);
      const userId = req.user!.userId;

      const parsed = updateSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        sendError(res, message, 400);
        return;
      }

      const session = await this.service.updateSession(sessionId, parsed.data, userId);
      sendSuccess(res, { data: session });
    } catch (error) {
      handleError(res, error);
    }
  }

  // メッセージ送信 / POST /sessions/:sessionId/messages
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessionId = Number(req.params.sessionId);
      const userId = req.user!.userId;

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        sendError(res, message, 400);
        return;
      }

      const result = await this.service.sendMessage(sessionId, parsed.data, userId);
      sendSuccess(res, { data: result }, 202);
    } catch (error) {
      handleError(res, error);
    }
  }

  // メッセージ一覧 / GET /sessions/:sessionId/messages
  async listMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessionId = Number(req.params.sessionId);
      const userId = req.user!.userId;

      const messages = await this.service.listMessages(sessionId, userId);
      sendSuccess(res, { data: messages });
    } catch (error) {
      handleError(res, error);
    }
  }
}
