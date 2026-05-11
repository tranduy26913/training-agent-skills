import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ChatController } from './chat.controller';
import type { ChatService } from './chat.service';

// モックサービスファクトリ / Mock service factory
function createMockService() {
  return {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    sendMessage: vi.fn(),
    listMessages: vi.fn(),
  };
}

type MockService = ReturnType<typeof createMockService>;

// テスト用アプリ構築 / Build test express app
function buildApp(service: MockService) {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    (req as any).user = {
      userId: Number(req.header('x-test-user-id') ?? 1),
      email: 'user@example.com',
      role: req.header('x-test-role') ?? 'user',
    };
    next();
  });

  const controller = new ChatController(service as unknown as ChatService);
  const router = express.Router();

  router.get('/workspaces/:id/sessions', controller.listSessions.bind(controller));
  router.post('/workspaces/:id/sessions', controller.createSession.bind(controller));
  router.patch('/sessions/:sessionId', controller.updateSession.bind(controller));
  router.post('/sessions/:sessionId/messages', controller.sendMessage.bind(controller));
  router.get('/sessions/:sessionId/messages', controller.listMessages.bind(controller));

  app.use('/api/notebooklm', router);
  return app;
}

describe('ChatController', () => {
  let service: MockService;

  beforeEach(() => {
    service = createMockService();
  });

  // セッション一覧 / List sessions
  it('GET /workspaces/:id/sessions returns 200 with sessions', async () => {
    service.listSessions.mockResolvedValueOnce({
      data: [{ id: 1, title: 'My Chat', workspace_id: 10 }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    const res = await request(buildApp(service))
      .get('/api/notebooklm/workspaces/10/sessions')
      .set('x-test-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  // セッション作成 / Create session
  it('POST /workspaces/:id/sessions returns 201 with session id', async () => {
    service.createSession.mockResolvedValueOnce({ id: 55, title: 'New Chat', workspace_id: 10 });

    const res = await request(buildApp(service))
      .post('/api/notebooklm/workspaces/10/sessions')
      .set('x-test-user-id', '1')
      .send({ title: 'New Chat' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(55);
  });

  // セッション更新 / Update session
  it('PATCH /sessions/:sessionId returns 200 with updated session', async () => {
    service.updateSession.mockResolvedValueOnce({ id: 1, title: 'Updated Title', workspace_id: 10 });

    const res = await request(buildApp(service))
      .patch('/api/notebooklm/sessions/1')
      .set('x-test-user-id', '1')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  // メッセージ送信 / Send message - enqueue QUERY job
  it('POST /sessions/:sessionId/messages returns 202 with jobId', async () => {
    service.sendMessage.mockResolvedValueOnce({ jobId: 9001 });

    const res = await request(buildApp(service))
      .post('/api/notebooklm/sessions/1/messages')
      .set('x-test-user-id', '1')
      .send({ content: 'What is the summary?' });

    expect(res.status).toBe(202);
    expect(res.body.data.jobId).toBe(9001);
  });

  // メッセージ一覧 / List messages
  it('GET /sessions/:sessionId/messages returns 200 with messages', async () => {
    service.listMessages.mockResolvedValueOnce([
      { id: 10, role: 'user', content: 'Hello', session_id: 1 },
      { id: 11, role: 'assistant', content: 'Hi there', session_id: 1 },
    ]);

    const res = await request(buildApp(service))
      .get('/api/notebooklm/sessions/1/messages')
      .set('x-test-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  // エラーハンドリング / Error handling
  it('returns 400 for missing content in sendMessage', async () => {
    const res = await request(buildApp(service))
      .post('/api/notebooklm/sessions/1/messages')
      .set('x-test-user-id', '1')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for missing title in updateSession', async () => {
    const res = await request(buildApp(service))
      .patch('/api/notebooklm/sessions/1')
      .set('x-test-user-id', '1')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when service throws ServiceError 404', async () => {
    const { ServiceError } = await import('../../models/common.model');
    service.listMessages.mockRejectedValueOnce(new ServiceError('Session not found', 404));

    const res = await request(buildApp(service))
      .get('/api/notebooklm/sessions/999/messages')
      .set('x-test-user-id', '1');

    expect(res.status).toBe(404);
  });
});
