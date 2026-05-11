import type { AxiosResponse } from 'axios';
import apiClient from './api.service';
import type { PaginatedData } from '@/types/api.types';
import type {
  Workspace,
  WorkspaceFilters,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceDocument,
  WorkspaceJobProgress,
  WorkspaceDocumentUploadResult,
  WorkspaceDocumentDeleteResult,
  WorkspaceMember,
  WorkspaceMemberCandidate,
  AddOrUpdateWorkspaceMemberDto,
} from '@/types/notebooklm.types';

interface ApiEnvelope<T> {
  data: T;
}

interface WorkspaceApiModel {
  id: number;
  name: string;
  description: string | null;
  role?: 'owner' | 'editor' | 'viewer';
  document_count?: number;
  created_at: string;
  updated_at: string;
}

interface DocumentApiModel {
  id: number;
  workspace_id: number;
  uploaded_by: number;
  filename: string;
  mime_type: string;
  file_size: number;
  status: WorkspaceDocument['status'];
  created_at: string;
  updated_at: string;
  latest_job_id?: number | null;
}

interface JobStepApiModel {
  step_name: string;
  status: WorkspaceJobProgress['steps'][number]['status'];
  detail?: string | null;
}

interface JobProgressApiModel {
  id: number;
  status: WorkspaceJobProgress['status'];
  steps: JobStepApiModel[];
  updated_at: string;
}

interface WorkspaceMemberApiModel {
  id: number;
  user_id: number;
  role: WorkspaceMember['role'];
  name?: string;
  email?: string;
}

interface WorkspaceMemberCandidateApiModel {
  id: number;
  name: string;
  email: string;
}

function mapWorkspace(item: WorkspaceApiModel): Workspace {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    role: item.role ?? 'viewer',
    documentCount: item.document_count ?? 0,
    status: 'active',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapDocument(item: DocumentApiModel): WorkspaceDocument {
  return {
    id: item.id,
    workspaceId: item.workspace_id,
    uploadedBy: item.uploaded_by,
    filename: item.filename,
    mimeType: item.mime_type,
    size: item.file_size,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    latestJobId: item.latest_job_id ?? undefined,
  };
}

function mapJobProgress(item: JobProgressApiModel): WorkspaceJobProgress {
  return {
    jobId: item.id,
    status: item.status,
    updatedAt: item.updated_at,
    steps: item.steps.map((step) => ({
      name: step.step_name,
      status: step.status,
      error: step.detail ?? undefined,
    })),
  };
}

function mapWorkspaceMember(item: WorkspaceMemberApiModel): WorkspaceMember {
  return {
    id: item.id,
    userId: item.user_id,
    role: item.role,
    name: item.name,
    email: item.email,
  };
}

function mapWorkspaceMemberCandidate(item: WorkspaceMemberCandidateApiModel): WorkspaceMemberCandidate {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
  };
}

async function toBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  let binary = '';
  const chunkSize = 0x8000;
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += chunkSize) {
    const slice = view.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

class NotebooklmWorkspaceService {
  private readonly basePath = '/notebooklm/workspaces';

  async getWorkspaces(filters?: WorkspaceFilters): Promise<PaginatedData<Workspace>> {
    const query = this.buildQueryString(filters as Record<string, unknown> | undefined);
    const response: AxiosResponse<PaginatedData<WorkspaceApiModel>> = await apiClient.get(`${this.basePath}${query}`);
    return {
      data: response.data.data.map(mapWorkspace),
      pagination: response.data.pagination,
    };
  }

  async getWorkspace(id: number): Promise<Workspace> {
    const response: AxiosResponse<WorkspaceApiModel> = await apiClient.get(`${this.basePath}/${id}`);
    return mapWorkspace(response.data);
  }

  async createWorkspace(payload: CreateWorkspaceDto): Promise<Workspace> {
    const response: AxiosResponse<WorkspaceApiModel> = await apiClient.post(this.basePath, payload);
    return mapWorkspace(response.data);
  }

  async updateWorkspace(id: number, payload: UpdateWorkspaceDto): Promise<Workspace> {
    const response: AxiosResponse<WorkspaceApiModel> = await apiClient.put(`${this.basePath}/${id}`, payload);
    return mapWorkspace(response.data);
  }

  async deleteWorkspace(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async getWorkspaceDocuments(workspaceId: number): Promise<WorkspaceDocument[]> {
    const response: AxiosResponse<DocumentApiModel[]> = await apiClient.get(
      `${this.basePath}/${workspaceId}/documents`,
    );
    return response.data.map(mapDocument);
  }

  async uploadDocument(workspaceId: number, file: File): Promise<WorkspaceDocumentUploadResult> {
    const response: AxiosResponse<WorkspaceDocumentUploadResult> = await apiClient.post(`${this.basePath}/${workspaceId}/documents`, {
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileDataBase64: await toBase64(file),
    });

    return response.data;
  }

  async deleteDocument(workspaceId: number, documentId: number): Promise<WorkspaceDocumentDeleteResult> {
    const response: AxiosResponse<WorkspaceDocumentDeleteResult> = await apiClient.delete(
      `${this.basePath}/${workspaceId}/documents/${documentId}`,
    );
    return response.data;
  }

  async getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    const response: AxiosResponse<WorkspaceMemberApiModel[]> = await apiClient.get(`${this.basePath}/${workspaceId}/members`);
    return response.data.map(mapWorkspaceMember);
  }

  async searchWorkspaceCandidateUsers(
    workspaceId: number,
    q: string,
    page = 1,
    limit = 10,
  ): Promise<WorkspaceMemberCandidate[]> {
    const response: AxiosResponse<WorkspaceMemberCandidateApiModel[] | ApiEnvelope<WorkspaceMemberCandidateApiModel[]>> = await apiClient.get(
      '/notebooklm/users/search',
      {
        params: { workspaceId, q, page, limit },
      },
    );

    const rawItems = Array.isArray(response.data) ? response.data : response.data.data;
    return rawItems.map(mapWorkspaceMemberCandidate);
  }

  async addOrUpdateWorkspaceMember(
    workspaceId: number,
    userId: number,
    role: WorkspaceMember['role'],
  ): Promise<WorkspaceMember> {
    const payload: AddOrUpdateWorkspaceMemberDto = { userId, role };
    const response: AxiosResponse<WorkspaceMemberApiModel> = await apiClient.post(
      `${this.basePath}/${workspaceId}/members`,
      payload,
    );
    return mapWorkspaceMember(response.data);
  }

  async getJobProgress(jobId: number): Promise<WorkspaceJobProgress> {
    const response: AxiosResponse<JobProgressApiModel> = await apiClient.get(`/notebooklm/jobs/${jobId}`);
    return mapJobProgress(response.data);
  }

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

export const notebooklmWorkspaceService = new NotebooklmWorkspaceService();
