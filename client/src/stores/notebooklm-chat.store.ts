/**
 * NotebookLM Chat Store
 * チャットセッション・メッセージの状態管理
 */
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { notebooklmChatService } from '@/services/notebooklm-chat.service';
import { notebooklmWorkspaceService } from '@/services/notebooklm-workspace.service';
import type { PaginationInfo } from '@/types/api.types';
import type {
  ChatSession,
  ChatMessage,
  ChatSessionFilters,
  CreateChatSessionDto,
  UpdateChatSessionDto,
  SendMessageDto,
} from '@/types/notebooklm.types';

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
};

/** ミリ秒待機ユーティリティ / Sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const useNotebooklmChatStore = defineStore('notebooklmChat', () => {
  // セッション一覧 / List of chat sessions for the current workspace
  const sessions = ref<ChatSession[]>([]);
  // 現在のセッション / Currently opened session
  const currentSession = ref<ChatSession | null>(null);
  // セッション内のメッセージ / Messages for the current session
  const messages = ref<ChatMessage[]>([]);
  // 現在のワークスペースID / Currently selected workspace ID
  const currentWorkspaceId = ref<number | null>(null);
  // ページネーション情報 / Pagination metadata for session list
  const pagination = ref<PaginationInfo>({ ...DEFAULT_PAGINATION });
  // セッション一覧読み込み中 / Loading flag for session list
  const loading = shallowRef(false);
  // メッセージ読み込み中 / Loading flag for messages / sending
  const loadingMessages = shallowRef(false);
  // エラーメッセージ / Last error message
  const error = shallowRef<string | null>(null);

  /**
   * ワークスペースのチャットセッション一覧を取得する
   * Fetch all chat sessions for a given workspace
   */
  async function fetchSessions(
    workspaceId: number,
    filters?: ChatSessionFilters,
  ): Promise<void> {
    loading.value = true;
    error.value = null;
    currentWorkspaceId.value = workspaceId;
    try {
      const result = await notebooklmChatService.getSessions(workspaceId, filters);
      sessions.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch chat sessions';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 新しいチャットセッションを作成する
   * Create a new chat session in the given workspace
   */
  async function createSession(
    workspaceId: number,
    dto: CreateChatSessionDto,
  ): Promise<ChatSession> {
    error.value = null;
    const created = await notebooklmChatService.createSession(workspaceId, dto);
    return created;
  }

  /**
   * セッション1件を取得して currentSession にセットする
   * Fetch a single session and set it as the current session
   */
  async function fetchCurrentSession(sessionId: number): Promise<void> {
    error.value = null;
    try {
      currentSession.value = await notebooklmChatService.getSession(sessionId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch session';
      throw err;
    }
  }

  /**
   * チャットセッションのタイトルを更新する
   * Update an existing chat session
   */
  async function updateSession(
    sessionId: number,
    dto: UpdateChatSessionDto,
  ): Promise<void> {
    error.value = null;
    const updated = await notebooklmChatService.updateSession(sessionId, dto);
    if (currentSession.value?.id === sessionId) {
      currentSession.value = updated;
    }
    const index = sessions.value.findIndex((s) => s.id === sessionId);
    if (index >= 0) {
      sessions.value[index] = updated;
    }
  }

  /**
   * チャットセッションのメッセージを取得する
   * Fetch all messages for a chat session
   */
  async function fetchMessages(sessionId: number): Promise<void> {
    loadingMessages.value = true;
    error.value = null;
    try {
      messages.value = await notebooklmChatService.getMessages(sessionId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch messages';
      throw err;
    } finally {
      loadingMessages.value = false;
    }
  }

  /**
   * メッセージを送信し、ジョブ完了までポーリングしてからメッセージを再取得する
   * Send a message, poll for job completion, then refresh messages.
   * The user message is appended optimistically so it appears instantly on the right.
   * / ユーザーメッセージは楽観的に追加され、右側に即座に表示される。
   */
  async function sendMessage(sessionId: number, dto: SendMessageDto): Promise<void> {
    loadingMessages.value = true;
    error.value = null;

    // ユーザーメッセージを即座に追加する（楽観的更新）
    // Optimistically append the user message before the API round-trip so it
    // appears on the right side of the chat panel immediately.
    const optimisticMessage: ChatMessage = {
      id: -(Date.now()),           // 一時的な負のID / temporary negative ID to avoid collisions
      sessionId,
      role: 'user',
      content: dto.content,
      sources: null,
      jobId: null,
      createdAt: new Date().toISOString(),
    };
    messages.value = [...messages.value, optimisticMessage];

    try {
      const result = await notebooklmChatService.sendMessage(sessionId, dto);

      // ジョブ完了まで最大60回ポーリング (1.5秒間隔)
      // Poll up to 60 times (every 1.5 s) until job settles
      const maxAttempts = 60;
      const intervalMs = 1500;
      const terminalStatuses = ['done', 'failed', 'dead_letter'];

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const progress = await notebooklmWorkspaceService.getJobProgress(result.jobId);
        if (terminalStatuses.includes(progress.status)) {
          break;
        }
        if (attempt < maxAttempts) {
          await sleep(intervalMs);
        }
      }

      // ポーリング後にメッセージを再取得する（楽観的メッセージを実データで置き換える）
      // Replace optimistic message with authoritative server data
      messages.value = await notebooklmChatService.getMessages(sessionId);
    } catch (err: any) {
      // エラー時に楽観的メッセージを元に戻す / Roll back optimistic message on failure
      messages.value = messages.value.filter((m) => m.id !== optimisticMessage.id);
      error.value = err.response?.data?.message || 'Failed to send message';
      throw err;
    } finally {
      loadingMessages.value = false;
    }
  }

  /** 現在のセッションをクリアする / Clear current session state */
  function clearCurrentSession(): void {
    currentSession.value = null;
    messages.value = [];
  }

  return {
    sessions,
    currentSession,
    messages,
    currentWorkspaceId,
    pagination,
    loading,
    loadingMessages,
    error,
    fetchSessions,
    createSession,
    fetchCurrentSession,
    updateSession,
    fetchMessages,
    sendMessage,
    clearCurrentSession,
  };
});
