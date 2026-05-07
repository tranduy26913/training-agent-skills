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
