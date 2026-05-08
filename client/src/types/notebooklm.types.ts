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
