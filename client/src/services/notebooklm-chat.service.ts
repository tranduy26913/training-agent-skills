/**
 * NotebookLM Chat Service
 * チャットセッションおよびメッセージのAPIサービス
 */
import type { AxiosResponse } from 'axios';
import apiClient from './api.service';
import type { PaginatedData } from '@/types/api.types';
import type {
  ChatSession,
  ChatMessage,
  ChatSource,
  SendMessageResult,
  ChatSessionFilters,
  CreateChatSessionDto,
  UpdateChatSessionDto,
  SendMessageDto,
} from '@/types/notebooklm.types';

// APIモデル / Raw API model shapes (snake_case)
interface ChatSessionApiModel {
  id: number;
  workspace_id: number;
  user_id: number;
  title: string;
  // [CR-NBLM-LLM-001] LLMプロバイダーのAPI側フィールド / LLM provider field from API
  llm_provider: 'ollama' | 'mock' | 'gemini';
  created_at: string;
  updated_at: string;
}

interface ChatSourceApiModel {
  document_id: number;
  filename: string;
  snippet: string;
}

interface ChatMessageApiModel {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSourceApiModel[] | null;
  job_id: number | null;
  created_at: string;
}

// チャットセッションのマッパー / Map API model → domain model
function mapChatSession(item: ChatSessionApiModel): ChatSession {
  return {
    id: item.id,
    workspaceId: item.workspace_id,
    userId: item.user_id,
    title: item.title,
    // [CR-NBLM-LLM-001] プロバイダーをマッピング / Map llm_provider to camelCase
    llmProvider: item.llm_provider ?? 'ollama',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

// チャットソースのマッパー / Map API source → domain source
function mapChatSource(item: ChatSourceApiModel): ChatSource {
  return {
    document_id: item.document_id,
    filename: item.filename,
    snippet: item.snippet,
  };
}

// チャットメッセージのマッパー / Map API message → domain message
function mapChatMessage(item: ChatMessageApiModel): ChatMessage {
  return {
    id: item.id,
    sessionId: item.session_id,
    role: item.role,
    content: item.content,
    sources: item.sources ? item.sources.map(mapChatSource) : null,
    jobId: item.job_id,
    createdAt: item.created_at,
  };
}

class NotebooklmChatService {
  private readonly basePath = '/notebooklm';

  /**
   * ワークスペースのチャットセッション一覧を取得する
   * Get all chat sessions for a workspace
   */
  async getSessions(
    workspaceId: number,
    filters?: ChatSessionFilters,
  ): Promise<PaginatedData<ChatSession>> {
    const query = this.buildQueryString(filters as Record<string, unknown> | undefined);
    const response: AxiosResponse<PaginatedData<ChatSessionApiModel>> = await apiClient.get(
      `${this.basePath}/workspaces/${workspaceId}/sessions${query}`,
    );
    return {
      data: response.data.data.map(mapChatSession),
      pagination: response.data.pagination,
    };
  }

  /**
   * 新しいチャットセッションを作成する
   * Create a new chat session in a workspace
   */
  async createSession(
    workspaceId: number,
    dto: CreateChatSessionDto,
  ): Promise<ChatSession> {
    const response: AxiosResponse<{ data: ChatSessionApiModel }> = await apiClient.post(
      `${this.basePath}/workspaces/${workspaceId}/sessions`,
      dto,
    );
    return mapChatSession(response.data.data);
  }

  /**
   * チャットセッション1件を取得する
   * Get a single chat session by ID
   */
  async getSession(sessionId: number): Promise<ChatSession> {
    const response: AxiosResponse<{ data: ChatSessionApiModel }> = await apiClient.get(
      `${this.basePath}/sessions/${sessionId}`,
    );
    return mapChatSession(response.data.data);
  }

  /**
   * チャットセッションを更新する
   * Update an existing chat session
   */
  async updateSession(sessionId: number, dto: UpdateChatSessionDto): Promise<ChatSession> {
    const response: AxiosResponse<{ data: ChatSessionApiModel }> = await apiClient.patch(
      `${this.basePath}/sessions/${sessionId}`,
      dto,
    );
    return mapChatSession(response.data.data);
  }

  /**
   * チャットセッションのメッセージ一覧を取得する
   * Fetch all messages for a chat session
   */
  async getMessages(sessionId: number): Promise<ChatMessage[]> {
    const response: AxiosResponse<{ data: ChatMessageApiModel[] }> = await apiClient.get(
      `${this.basePath}/sessions/${sessionId}/messages`,
    );
    return response.data.data.map(mapChatMessage);
  }

  /**
   * チャットセッションにメッセージを送信する
   * Send a message to a chat session and return the job ID
   */
  async sendMessage(sessionId: number, dto: SendMessageDto): Promise<SendMessageResult> {
    const response: AxiosResponse<{ data: SendMessageResult }> = await apiClient.post(
      `${this.basePath}/sessions/${sessionId}/messages`,
      dto,
    );
    return response.data.data;
  }

  /** クエリ文字列を構築する / Build URL query string from params */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

export const notebooklmChatService = new NotebooklmChatService();
