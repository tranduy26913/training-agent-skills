/**
 * Unit tests for NotebookLM Chat Store - provider field
 * チャットストアのユニットテスト - プロバイダーフィールド
 * [CR-NBLM-LLM-001] Tests for llmProvider in chat session state management
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotebooklmChatStore } from '@/stores/notebooklm-chat.store';
import type { ChatSession } from '@/types/notebooklm.types';

// チャットサービスのモック / Mock notebooklm-chat.service
vi.mock('@/services/notebooklm-chat.service', () => ({
  notebooklmChatService: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    getJobProgress: vi.fn(),
  },
}));

// ワークスペースサービスのモック / Mock notebooklm-workspace.service
vi.mock('@/services/notebooklm-workspace.service', () => ({
  notebooklmWorkspaceService: {
    getWorkspace: vi.fn(),
  },
}));

// テスト用セッションフィクスチャ / Session fixtures
const SESSION_OLLAMA: ChatSession = {
  id: 1,
  workspaceId: 10,
  userId: 1,
  title: 'Ollama Session',
  llmProvider: 'ollama',
  createdAt: '2026-05-11T10:00:00.000Z',
  updatedAt: '2026-05-11T10:00:00.000Z',
};

const SESSION_GEMINI: ChatSession = {
  id: 2,
  workspaceId: 10,
  userId: 1,
  title: 'Gemini Session',
  llmProvider: 'gemini',
  createdAt: '2026-05-11T11:00:00.000Z',
  updatedAt: '2026-05-11T11:00:00.000Z',
};

describe('useNotebooklmChatStore - provider field', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // セッション取得テスト / fetchSessions test
  it('preserves llmProvider on sessions fetched from API', async () => {
    const { notebooklmChatService } = await import('@/services/notebooklm-chat.service');
    vi.mocked(notebooklmChatService.getSessions).mockResolvedValueOnce({
      data: [SESSION_OLLAMA, SESSION_GEMINI],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });

    const store = useNotebooklmChatStore();
    await store.fetchSessions(10);

    expect(store.sessions[0].llmProvider).toBe('ollama');
    expect(store.sessions[1].llmProvider).toBe('gemini');
  });

  // セッション作成テスト / createSession test
  it('creates session with llmProvider and returns it', async () => {
    const { notebooklmChatService } = await import('@/services/notebooklm-chat.service');
    vi.mocked(notebooklmChatService.createSession).mockResolvedValueOnce(SESSION_GEMINI);

    const store = useNotebooklmChatStore();
    const created = await store.createSession(10, { title: 'Gemini Session', llmProvider: 'gemini' });

    expect(created.llmProvider).toBe('gemini');
    expect(notebooklmChatService.createSession).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ llmProvider: 'gemini' }),
    );
  });

  // セッション更新テスト / updateSession test
  it('updates currentSession with new llmProvider after updateSession', async () => {
    const { notebooklmChatService } = await import('@/services/notebooklm-chat.service');
    const updatedSession = { ...SESSION_OLLAMA, llmProvider: 'mock' as const };
    vi.mocked(notebooklmChatService.updateSession).mockResolvedValueOnce(updatedSession);

    const store = useNotebooklmChatStore();
    // セッションリストにセッションを追加しておく / Seed sessions list
    store.sessions.push(SESSION_OLLAMA);

    await store.updateSession(1, { title: 'Ollama Session', llmProvider: 'mock' });

    const updated = store.sessions.find((s) => s.id === 1);
    expect(updated?.llmProvider).toBe('mock');
  });
});
