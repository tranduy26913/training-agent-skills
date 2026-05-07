import type { RowDataPacket } from 'mysql2/promise';
import type { PaginationParams } from './common.model';

export type NotebookLmMemberRole = 'owner' | 'editor' | 'viewer';
export type NotebookLmDocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed' | 'deleted';
export type NotebookLmJobType = 'INGEST' | 'QUERY' | 'DELETE_DOC' | 'DELETE_WORKSPACE';
export type NotebookLmJobStatus = 'pending' | 'processing' | 'retrying' | 'done' | 'failed' | 'dead_letter';
export type NotebookLmJobStepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface NotebookLmWorkspaceRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
  role?: NotebookLmMemberRole;
  document_count?: number;
}

export interface NotebookLmWorkspaceMemberRow extends RowDataPacket {
  id: number;
  workspace_id: number;
  user_id: number;
  role: NotebookLmMemberRole;
  created_at: Date;
  user_name?: string;
  user_email?: string;
}

export interface NotebookLmDocumentRow extends RowDataPacket {
  id: number;
  workspace_id: number;
  uploaded_by: number;
  filename: string;
  mime_type: string;
  file_size: number;
  file_data?: Buffer | null;
  status: NotebookLmDocumentStatus;
  created_at: Date;
  updated_at: Date;
}

export interface NotebookLmJobRow extends RowDataPacket {
  id: number;
  type: NotebookLmJobType;
  status: NotebookLmJobStatus;
  payload: unknown;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotebookLmJobStepRow extends RowDataPacket {
  id: number;
  job_id: number;
  step_name: string;
  status: NotebookLmJobStepStatus;
  progress_pct: number;
  detail: string | null;
  started_at: Date | null;
  finished_at: Date | null;
}

export interface NotebookLmJobDetails extends NotebookLmJobRow {
  steps: NotebookLmJobStepRow[];
}

export interface NotebookLmWorkspaceFilters extends PaginationParams {
  search?: string;
  role?: NotebookLmMemberRole;
}

export interface CreateNotebookLmWorkspaceInput {
  name: string;
  description?: string | null;
}

export interface UpdateNotebookLmWorkspaceInput {
  name: string;
  description?: string | null;
}

export interface AddNotebookLmMemberInput {
  userId: number;
  role: NotebookLmMemberRole;
}

export interface UploadNotebookLmDocumentInput {
  filename: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
}
