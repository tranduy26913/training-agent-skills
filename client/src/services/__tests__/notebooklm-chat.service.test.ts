/**
 * Unit tests for NotebooklmChatService
 * チャットAPIサービスのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notebooklmChatService } from '../notebooklm-chat.service';

// APIクライアントのモック / Mock the axios api client (hoisted to avoid TDZ errors)
const { mockGet, mockPost, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock('../api.service', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
  },
}));

// ---------- Fixtures / テストデータ ----------

const SESSION_API = {
  id: 1,
  workspace_id: 10,
  user_id: 5,
  title: 'My Session',
  created_at: '2026-05-11T08:00:00.000Z',
  updated_at: '2026-05-11T08:00:00.000Z',
};

const SESSION_DOMAIN = {
  id: 1,
  workspaceId: 10,
  userId: 5,
  title: 'My Session',
  createdAt: '2026-05-11T08:00:00.000Z',
  updatedAt: '2026-05-11T08:00:00.000Z',
};

const MESSAGE_API = {
  id: 101,
  session_id: 1,
  role: 'user' as const,
  content: 'What is this about?',
  sources: null,
  job_id: null,
  created_at: '2026-05-11T08:01:00.000Z',
};

const MESSAGE_DOMAIN = {
  id: 101,
  sessionId: 1,
  role: 'user' as const,
  content: 'What is this about?',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:01:00.000Z',
};

const MESSAGE_ASSISTANT_API = {
  id: 102,
  session_id: 1,
  role: 'assistant' as const,
  content: 'This is about AI.',
  sources: [{ document_id: 7, filename: 'ai.pdf', snippet: 'Artificial intelligence...' }],
  job_id: 200,
  created_at: '2026-05-11T08:01:30.000Z',
};

const MESSAGE_ASSISTANT_DOMAIN = {
  id: 102,
  sessionId: 1,
  role: 'assistant' as const,
  content: 'This is about AI.',
  sources: [{ document_id: 7, filename: 'ai.pdf', snippet: 'Artificial intelligence...' }],
  jobId: 200,
  createdAt: '2026-05-11T08:01:30.000Z',
};

// ---------- Tests ----------

describe('notebooklmChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // getSessions / セッション一覧取得
  // ----------------------------------------------------------------
  describe('getSessions', () => {
    it('returns mapped paginated sessions for a workspace', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          data: [SESSION_API],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });

      const result = await notebooklmChatService.getSessions(10);

      expect(mockGet).toHaveBeenCalledWith('/notebooklm/workspaces/10/sessions');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(SESSION_DOMAIN);
      expect(result.pagination.total).toBe(1);
    });

    it('includes pagination query string in URL when filters provided', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: [], pagination: { page: 2, limit: 5, total: 0, pages: 0 } },
      });

      await notebooklmChatService.getSessions(10, { page: 2, limit: 5 });

      expect(mockGet).toHaveBeenCalledWith('/notebooklm/workspaces/10/sessions?page=2&limit=5');
    });

    it('handles empty session list', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
      });

      const result = await notebooklmChatService.getSessions(10);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // createSession / セッション作成
  // ----------------------------------------------------------------
  describe('createSession', () => {
    it('returns mapped session from { data: ... } envelope', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: SESSION_API } });

      const result = await notebooklmChatService.createSession(10, { title: 'My Session' });

      expect(mockPost).toHaveBeenCalledWith('/notebooklm/workspaces/10/sessions', { title: 'My Session' });
      expect(result).toEqual(SESSION_DOMAIN);
    });

    it('creates session without title (optional)', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: SESSION_API } });

      const result = await notebooklmChatService.createSession(10, {});

      expect(mockPost).toHaveBeenCalledWith('/notebooklm/workspaces/10/sessions', {});
      expect(result.id).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  // updateSession / セッション更新
  // ----------------------------------------------------------------
  describe('updateSession', () => {
    it('returns mapped updated session from { data: ... } envelope', async () => {
      const updated = { ...SESSION_API, title: 'Renamed' };
      mockPatch.mockResolvedValueOnce({ data: { data: updated } });

      const result = await notebooklmChatService.updateSession(1, { title: 'Renamed' });

      expect(mockPatch).toHaveBeenCalledWith('/notebooklm/sessions/1', { title: 'Renamed' });
      expect(result.title).toBe('Renamed');
      expect(result.id).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  // getMessages / メッセージ一覧取得
  // ----------------------------------------------------------------
  describe('getMessages', () => {
    it('returns mapped messages array from { data: [...] } envelope', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: [MESSAGE_API, MESSAGE_ASSISTANT_API] },
      });

      const result = await notebooklmChatService.getMessages(1);

      expect(mockGet).toHaveBeenCalledWith('/notebooklm/sessions/1/messages');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(MESSAGE_DOMAIN);
      expect(result[1]).toEqual(MESSAGE_ASSISTANT_DOMAIN);
    });

    it('maps sources correctly for assistant messages', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: [MESSAGE_ASSISTANT_API] },
      });

      const result = await notebooklmChatService.getMessages(1);

      expect(result[0].sources).toHaveLength(1);
      expect(result[0].sources![0].document_id).toBe(7);
      expect(result[0].sources![0].filename).toBe('ai.pdf');
    });

    it('handles null sources for user messages', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [MESSAGE_API] } });

      const result = await notebooklmChatService.getMessages(1);

      expect(result[0].sources).toBeNull();
      expect(result[0].jobId).toBeNull();
    });

    it('returns empty array when session has no messages', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } });

      const result = await notebooklmChatService.getMessages(1);

      expect(result).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------
  // sendMessage / メッセージ送信
  // ----------------------------------------------------------------
  describe('sendMessage', () => {
    it('returns jobId from { data: ... } envelope', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { jobId: 9001 } } });

      const result = await notebooklmChatService.sendMessage(1, { content: 'What is AI?' });

      expect(mockPost).toHaveBeenCalledWith('/notebooklm/sessions/1/messages', {
        content: 'What is AI?',
      });
      expect(result.jobId).toBe(9001);
    });
  });
});
