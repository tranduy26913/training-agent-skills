/**
 * Unit tests for useNotebooklmChatStore
 * チャットストアのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotebooklmChatStore } from '../notebooklm-chat.store';
import type { PaginatedData } from '@/types/api.types';
import type {
  ChatSession,
  ChatMessage,
  SendMessageResult,
} from '@/types/notebooklm.types';

// ---- Service mocks / サービスモック ----
const chatServiceMocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getSession: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

const workspaceServiceMocks = vi.hoisted(() => ({
  getJobProgress: vi.fn(),
}));

vi.mock('@/services/notebooklm-chat.service', () => ({
  notebooklmChatService: chatServiceMocks,
}));

vi.mock('@/services/notebooklm-workspace.service', () => ({
  notebooklmWorkspaceService: workspaceServiceMocks,
}));

// ---- Fixtures / テストデータ ----
const SAMPLE_SESSION: ChatSession = {
  id: 1,
  workspaceId: 10,
  userId: 5,
  title: 'Test Session',
  llmProvider: 'ollama',
  createdAt: '2026-05-11T08:00:00.000Z',
  updatedAt: '2026-05-11T08:00:00.000Z',
};

const SAMPLE_SESSION_2: ChatSession = {
  id: 2,
  workspaceId: 10,
  userId: 5,
  title: 'Another Session',
  llmProvider: 'gemini',
  createdAt: '2026-05-11T09:00:00.000Z',
  updatedAt: '2026-05-11T09:00:00.000Z',
};

const SAMPLE_MESSAGE_USER: ChatMessage = {
  id: 101,
  sessionId: 1,
  role: 'user',
  content: 'What is this document about?',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:01:00.000Z',
};

const SAMPLE_MESSAGE_ASSISTANT: ChatMessage = {
  id: 102,
  sessionId: 1,
  role: 'assistant',
  content: 'This document is about AI.',
  sources: [{ document_id: 7, filename: 'ai.pdf', snippet: 'Artificial intelligence ...' }],
  jobId: 200,
  createdAt: '2026-05-11T08:01:30.000Z',
};

// ---- Tests / テスト ----
describe('useNotebooklmChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // fetchSessions / セッション一覧の取得
  // ----------------------------------------------------------------
  describe('fetchSessions', () => {
    it('loads sessions into state and stores pagination', async () => {
      const result: PaginatedData<ChatSession> = {
        data: [SAMPLE_SESSION, SAMPLE_SESSION_2],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      };
      chatServiceMocks.getSessions.mockResolvedValue(result);

      const store = useNotebooklmChatStore();
      await store.fetchSessions(10);

      expect(store.sessions).toHaveLength(2);
      expect(store.sessions[0].title).toBe('Test Session');
      expect(store.pagination.total).toBe(2);
      expect(store.currentWorkspaceId).toBe(10);
      expect(store.loading).toBe(false);
      expect(chatServiceMocks.getSessions).toHaveBeenCalledWith(10, undefined);
    });

    it('passes filters to the service', async () => {
      const result: PaginatedData<ChatSession> = {
        data: [],
        pagination: { page: 2, limit: 5, total: 0, pages: 0 },
      };
      chatServiceMocks.getSessions.mockResolvedValue(result);

      const store = useNotebooklmChatStore();
      await store.fetchSessions(10, { page: 2, limit: 5 });

      expect(chatServiceMocks.getSessions).toHaveBeenCalledWith(10, { page: 2, limit: 5 });
    });

    it('sets error state and rethrows on failure', async () => {
      const apiError = new Error('Network error');
      chatServiceMocks.getSessions.mockRejectedValue(apiError);

      const store = useNotebooklmChatStore();
      await expect(store.fetchSessions(10)).rejects.toThrow('Network error');
      expect(store.error).toBe('Failed to fetch chat sessions');
      expect(store.loading).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // createSession / セッション作成
  // ----------------------------------------------------------------
  describe('createSession', () => {
    it('calls service with workspaceId and dto, returns created session', async () => {
      chatServiceMocks.createSession.mockResolvedValue(SAMPLE_SESSION);

      const store = useNotebooklmChatStore();
      const created = await store.createSession(10, { title: 'Test Session' });

      expect(created).toEqual(SAMPLE_SESSION);
      expect(chatServiceMocks.createSession).toHaveBeenCalledWith(10, { title: 'Test Session' });
    });

    it('supports creating a session without a title', async () => {
      chatServiceMocks.createSession.mockResolvedValue({ ...SAMPLE_SESSION, title: '' });

      const store = useNotebooklmChatStore();
      const created = await store.createSession(10, {});

      expect(chatServiceMocks.createSession).toHaveBeenCalledWith(10, {});
      expect(created.id).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  // updateSession / セッション更新
  // ----------------------------------------------------------------
  describe('updateSession', () => {
    it('updates the sessions list in state when a matching item exists', async () => {
      const result: PaginatedData<ChatSession> = {
        data: [SAMPLE_SESSION],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      chatServiceMocks.getSessions.mockResolvedValue(result);

      const updatedSession: ChatSession = { ...SAMPLE_SESSION, title: 'Renamed Session' };
      chatServiceMocks.updateSession.mockResolvedValue(updatedSession);

      const store = useNotebooklmChatStore();
      await store.fetchSessions(10);
      await store.updateSession(1, { title: 'Renamed Session' });

      expect(store.sessions[0].title).toBe('Renamed Session');
      expect(chatServiceMocks.updateSession).toHaveBeenCalledWith(1, { title: 'Renamed Session' });
    });

    it('also updates currentSession when it matches the sessionId', async () => {
      const updatedSession: ChatSession = { ...SAMPLE_SESSION, title: 'Updated Current' };
      chatServiceMocks.updateSession.mockResolvedValue(updatedSession);

      const store = useNotebooklmChatStore();
      store.currentSession = { ...SAMPLE_SESSION };
      await store.updateSession(1, { title: 'Updated Current' });

      expect(store.currentSession?.title).toBe('Updated Current');
    });
  });

  // ----------------------------------------------------------------
  // fetchMessages / メッセージ取得
  // ----------------------------------------------------------------
  describe('fetchMessages', () => {
    it('loads messages into state', async () => {
      chatServiceMocks.getMessages.mockResolvedValue([SAMPLE_MESSAGE_USER, SAMPLE_MESSAGE_ASSISTANT]);

      const store = useNotebooklmChatStore();
      await store.fetchMessages(1);

      expect(store.messages).toHaveLength(2);
      expect(store.messages[0].role).toBe('user');
      expect(store.messages[1].role).toBe('assistant');
      expect(store.loadingMessages).toBe(false);
    });

    it('sets error state and rethrows on failure', async () => {
      chatServiceMocks.getMessages.mockRejectedValue(new Error('Fetch failed'));

      const store = useNotebooklmChatStore();
      await expect(store.fetchMessages(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Failed to fetch messages');
    });
  });

  // ----------------------------------------------------------------
  // sendMessage / メッセージ送信とジョブポーリング
  // ----------------------------------------------------------------
  describe('sendMessage', () => {
    it('sends message, polls until job is done, then refreshes messages', async () => {
      const sendResult: SendMessageResult = { jobId: 200 };
      chatServiceMocks.sendMessage.mockResolvedValue(sendResult);

      workspaceServiceMocks.getJobProgress
        .mockResolvedValueOnce({ jobId: 200, status: 'processing', steps: [], updatedAt: '' })
        .mockResolvedValueOnce({ jobId: 200, status: 'done', steps: [], updatedAt: '' });

      chatServiceMocks.getMessages.mockResolvedValue([
        SAMPLE_MESSAGE_USER,
        SAMPLE_MESSAGE_ASSISTANT,
      ]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'What is this?' });

      expect(chatServiceMocks.sendMessage).toHaveBeenCalledWith(1, { content: 'What is this?' });
      expect(workspaceServiceMocks.getJobProgress).toHaveBeenCalledTimes(2);
      expect(chatServiceMocks.getMessages).toHaveBeenCalledWith(1);
      expect(store.messages).toHaveLength(2);
      expect(store.loadingMessages).toBe(false);
    });

    it('stops polling immediately when job is already done on first poll', async () => {
      chatServiceMocks.sendMessage.mockResolvedValue({ jobId: 300 });
      workspaceServiceMocks.getJobProgress.mockResolvedValue({
        jobId: 300,
        status: 'done',
        steps: [],
        updatedAt: '',
      });
      chatServiceMocks.getMessages.mockResolvedValue([SAMPLE_MESSAGE_USER]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'Hello' });

      expect(workspaceServiceMocks.getJobProgress).toHaveBeenCalledTimes(1);
      expect(store.messages).toHaveLength(1);
    });

    it('stops polling when job has failed status', async () => {
      chatServiceMocks.sendMessage.mockResolvedValue({ jobId: 400 });
      workspaceServiceMocks.getJobProgress.mockResolvedValue({
        jobId: 400,
        status: 'failed',
        steps: [],
        updatedAt: '',
      });
      chatServiceMocks.getMessages.mockResolvedValue([]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'Hello' });

      expect(workspaceServiceMocks.getJobProgress).toHaveBeenCalledTimes(1);
    });

    it('stops polling when job is dead_letter', async () => {
      chatServiceMocks.sendMessage.mockResolvedValue({ jobId: 500 });
      workspaceServiceMocks.getJobProgress.mockResolvedValue({
        jobId: 500,
        status: 'dead_letter',
        steps: [],
        updatedAt: '',
      });
      chatServiceMocks.getMessages.mockResolvedValue([]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'Test' });

      expect(workspaceServiceMocks.getJobProgress).toHaveBeenCalledTimes(1);
    });

    it('sets error and rethrows when sendMessage fails', async () => {
      chatServiceMocks.sendMessage.mockRejectedValue(new Error('Send failed'));

      const store = useNotebooklmChatStore();
      await expect(store.sendMessage(1, { content: 'Hi' })).rejects.toThrow('Send failed');
      expect(store.error).toBe('Failed to send message');
      expect(store.loadingMessages).toBe(false);
    });

    // 楽観的更新 / Optimistic update — user message appears immediately
    it('appends user message optimistically before polling starts', async () => {
      let snapshotBeforePolling: typeof store.messages = [];

      // sendMessage resolves AFTER we capture the store state inside the mock
      // / モック内でストアの状態をキャプチャしてから resolveする
      chatServiceMocks.sendMessage.mockImplementation(async () => {
        snapshotBeforePolling = [...store.messages];
        return { jobId: 200 };
      });

      workspaceServiceMocks.getJobProgress.mockResolvedValue({
        jobId: 200,
        status: 'done',
        steps: [],
        updatedAt: '',
      });
      chatServiceMocks.getMessages.mockResolvedValue([
        SAMPLE_MESSAGE_USER,
        SAMPLE_MESSAGE_ASSISTANT,
      ]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'What is this?' });

      // 楽観的メッセージが即座に追加されていたことを確認する
      // The optimistic message must have been in state at the time sendMessage was called
      expect(snapshotBeforePolling).toHaveLength(1);
      expect(snapshotBeforePolling[0].role).toBe('user');
      expect(snapshotBeforePolling[0].content).toBe('What is this?');
      // Temporary negative ID used for optimistic entry
      expect(snapshotBeforePolling[0].id).toBeLessThan(0);
    });

    it('replaces optimistic message with server data after polling', async () => {
      chatServiceMocks.sendMessage.mockResolvedValue({ jobId: 200 });
      workspaceServiceMocks.getJobProgress.mockResolvedValue({
        jobId: 200,
        status: 'done',
        steps: [],
        updatedAt: '',
      });
      chatServiceMocks.getMessages.mockResolvedValue([
        SAMPLE_MESSAGE_USER,
        SAMPLE_MESSAGE_ASSISTANT,
      ]);

      const store = useNotebooklmChatStore();
      await store.sendMessage(1, { content: 'What is this?' });

      // 最終的にはサーバーデータで置き換えられる（負のIDは消える）
      // Final state must be the authoritative server data (no negative-ID entries)
      expect(store.messages).toHaveLength(2);
      expect(store.messages.every((m) => m.id > 0)).toBe(true);
      expect(store.messages[0].role).toBe('user');
      expect(store.messages[1].role).toBe('assistant');
    });

    it('rolls back optimistic message when API call fails', async () => {
      chatServiceMocks.sendMessage.mockRejectedValue(new Error('Send failed'));

      const store = useNotebooklmChatStore();
      // Pre-load one existing message so we can verify the rollback is precise
      // / ロールバックが正確かを確認するために既存メッセージをプリロードする
      store.messages = [SAMPLE_MESSAGE_ASSISTANT];

      await expect(store.sendMessage(1, { content: 'Hi' })).rejects.toThrow('Send failed');

      // 楽観的メッセージがロールバックされ、元のメッセージは残る
      // Optimistic message removed; pre-existing message stays intact
      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].id).toBe(SAMPLE_MESSAGE_ASSISTANT.id);
    });
  });

  // ----------------------------------------------------------------
  // clearCurrentSession / セッションのクリア
  // ----------------------------------------------------------------
  describe('clearCurrentSession', () => {
    it('resets currentSession and messages to empty state', () => {
      const store = useNotebooklmChatStore();
      store.currentSession = { ...SAMPLE_SESSION };
      store.messages = [SAMPLE_MESSAGE_USER];

      store.clearCurrentSession();

      expect(store.currentSession).toBeNull();
      expect(store.messages).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------
  // fetchCurrentSession / 現在のセッション取得
  // ----------------------------------------------------------------
  describe('fetchCurrentSession', () => {
    it('sets currentSession after fetching a single session', async () => {
      chatServiceMocks.getSession.mockResolvedValue(SAMPLE_SESSION);

      const store = useNotebooklmChatStore();
      await store.fetchCurrentSession(1);

      expect(store.currentSession).toEqual(SAMPLE_SESSION);
      expect(chatServiceMocks.getSession).toHaveBeenCalledWith(1);
    });

    it('sets error state and rethrows on failure', async () => {
      chatServiceMocks.getSession.mockRejectedValue(new Error('Not found'));

      const store = useNotebooklmChatStore();
      await expect(store.fetchCurrentSession(999)).rejects.toThrow('Not found');
      expect(store.error).toBe('Failed to fetch session');
    });
  });
});
