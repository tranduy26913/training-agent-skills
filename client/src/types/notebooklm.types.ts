import type { PaginationParams, SortParams } from './api.types';

export const NOTEBOOKLM_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const NOTEBOOKLM_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/markdown',
  'text/csv',
  'text/plain',
] as const;

export type NotebooklmWorkspaceRole = 'owner' | 'editor' | 'viewer';
export type NotebooklmWorkspaceStatus = 'active' | 'deleted';
export type NotebooklmDocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed' | 'deleted';
export type NotebooklmJobStatus = 'pending' | 'processing' | 'retrying' | 'done' | 'failed' | 'dead_letter';
export type NotebooklmJobStepStatus = 'pending' | 'running' | 'done' | 'failed';
export type NotebooklmJobType = 'INGEST' | 'QUERY' | 'DELETE_DOC' | 'DELETE_WORKSPACE';

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  role: NotebooklmWorkspaceRole;
  documentCount: number;
  status: NotebooklmWorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  role: NotebooklmWorkspaceRole;
  name?: string;
  email?: string;
}

export interface WorkspaceMemberCandidate {
  id: number;
  name: string;
  email: string;
}

export interface AddOrUpdateWorkspaceMemberDto {
  userId: number;
  role: NotebooklmWorkspaceRole;
}

export interface WorkspaceDocument {
  id: number;
  workspaceId: number;
  filename: string;
  mimeType: string;
  size: number;
  status: NotebooklmDocumentStatus;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
  latestJobId?: number;
}

export interface WorkspaceJobStep {
  name: string;
  status: NotebooklmJobStepStatus;
  error?: string;
}

export interface WorkspaceJobProgress {
  jobId: number;
  status: NotebooklmJobStatus;
  steps: WorkspaceJobStep[];
  updatedAt: string;
}

export interface NotebooklmJobMonitorItem {
  id: number;
  type: NotebooklmJobType;
  status: NotebooklmJobStatus;
  retryCount: number;
  workerId: string | null;
  workspaceId: number | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
  stepsSummary?: {
    total: number;
    done: number;
    failed: number;
    running: number;
  };
}

export interface NotebooklmJobStepDetail {
  id: number;
  stepName: string;
  status: NotebooklmJobStepStatus;
  detail: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface NotebooklmJobDetail extends NotebooklmJobMonitorItem {
  payload: Record<string, unknown> | null;
  steps: NotebooklmJobStepDetail[];
}

export interface NotebooklmDlqItem {
  id: number;
  jobId: number;
  reason: string | null;
  payload: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotebooklmOperationsFilters extends PaginationParams, SortParams {
  search?: string;
  type?: NotebooklmJobType | '';
  status?: NotebooklmJobStatus | '';
  workspaceId?: number;
  failedOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotebooklmRetryRequestDto {
  reason: string;
  force?: boolean;
}

export interface NotebooklmDlqNoteDto {
  note: string;
}

export interface NotebooklmDlqPurgeDto {
  ids?: number[];
  olderThanDays?: number;
}

export interface WorkspaceFilters extends PaginationParams, SortParams {
  search?: string;
  role?: NotebooklmWorkspaceRole;
  status?: NotebooklmWorkspaceStatus;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

export type UpdateWorkspaceDto = Partial<CreateWorkspaceDto>;

export interface WorkspaceDocumentUploadResult {
  documentId: number;
  jobId: number;
}

export interface WorkspaceDocumentDeleteResult {
  jobId: number;
}

// チャットセッション / Chat session entity
// [CR-NBLM-LLM-001] LLMプロバイダー型 / LLM provider type for chat sessions
export type ChatLlmProvider = 'ollama' | 'mock' | 'gemini';

export interface ChatSession {
  id: number;
  workspaceId: number;
  userId: number;
  title: string;
  // [CR-NBLM-LLM-001] セッションのLLMプロバイダー / LLM provider for the session
  llmProvider: ChatLlmProvider;
  createdAt: string;
  updatedAt: string;
}

// チャット引用ソース / Source cited in a chat answer
export interface ChatSource {
  document_id: number;
  filename: string;
  snippet: string;
}

// チャットメッセージ / Chat message entity
export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[] | null;
  jobId: number | null;
  createdAt: string;
}

// メッセージ送信結果 / Result after sending a message
export interface SendMessageResult {
  jobId: number;
}

// チャットセッションフィルター / Filters for listing chat sessions
export interface ChatSessionFilters extends PaginationParams {
  // no extra fields needed
}

// チャットセッション作成DTO / DTO for creating a chat session
export interface CreateChatSessionDto {
  title?: string;
  // [CR-NBLM-LLM-001] 作成時のプロバイダー選択 / Provider selection at creation
  llmProvider?: ChatLlmProvider;
}

// チャットセッション更新DTO / DTO for updating a chat session
export interface UpdateChatSessionDto {
  title: string;
  // [CR-NBLM-LLM-001] 更新時のプロバイダー変更 / Provider update
  llmProvider?: ChatLlmProvider;
}

// メッセージ送信DTO / DTO for sending a chat message
export interface SendMessageDto {
  content: string;
  llmProvider?: ChatLlmProvider;
}
