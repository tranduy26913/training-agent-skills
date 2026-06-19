import type { AxiosResponse } from 'axios';
import apiClient from './api.service';
import type { PaginatedData } from '@/types/api.types';
import type {
  NotebooklmDlqItem,
  NotebooklmDlqNoteDto,
  NotebooklmDlqPurgeDto,
  NotebooklmJobDetail,
  NotebooklmJobMonitorItem,
  NotebooklmOperationsFilters,
  NotebooklmRetryRequestDto,
} from '@/types/notebooklm.types';

interface JobMonitorApiModel {
  id: number;
  type: NotebooklmJobMonitorItem['type'];
  status: NotebooklmJobMonitorItem['status'];
  retry_count: number;
  worker_id: string | null;
  workspace_id: number | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
  steps_summary?: {
    total: number;
    done: number;
    failed: number;
    running: number;
  };
}

interface JobStepApiModel {
  id: number;
  step_name: string;
  status: NotebooklmJobDetail['steps'][number]['status'];
  detail: string | null;
  started_at: string | null;
  finished_at: string | null;
}

interface JobDetailApiModel extends JobMonitorApiModel {
  payload: Record<string, unknown> | null;
  steps: JobStepApiModel[];
}

interface DlqItemApiModel {
  id: number;
  original_job_id?: number;
  job_id?: number;
  failure_reason?: string | null;
  reason?: string | null;
  payload: Record<string, unknown> | null;
  note: string | null;
  moved_at?: string;
  created_at?: string;
  updated_at?: string;
}

function buildQueryString(params?: Record<string, unknown>): string {
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

function mapJobItem(item: JobMonitorApiModel): NotebooklmJobMonitorItem {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    retryCount: item.retry_count,
    workerId: item.worker_id,
    workspaceId: item.workspace_id,
    correlationId: item.correlation_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    stepsSummary: item.steps_summary,
  };
}

function mapJobDetail(item: JobDetailApiModel): NotebooklmJobDetail {
  return {
    ...mapJobItem(item),
    payload: item.payload,
    steps: item.steps.map((step) => ({
      id: step.id,
      stepName: step.step_name,
      status: step.status,
      detail: step.detail,
      startedAt: step.started_at,
      finishedAt: step.finished_at,
    })),
  };
}

function mapDlqItem(item: DlqItemApiModel): NotebooklmDlqItem {
  return {
    id: item.id,
    jobId: item.original_job_id ?? item.job_id ?? 0,
    reason: item.failure_reason ?? item.reason ?? null,
    payload: item.payload,
    note: item.note,
    createdAt: item.moved_at ?? item.created_at ?? '',
    updatedAt: item.updated_at ?? item.moved_at ?? item.created_at ?? '',
  };
}

class NotebooklmOperationsService {
  private readonly basePath = '/admin/notebooklm';

  async getJobs(filters?: NotebooklmOperationsFilters): Promise<PaginatedData<NotebooklmJobMonitorItem>> {
    const query = buildQueryString(filters as Record<string, unknown> | undefined);
    const response: AxiosResponse<PaginatedData<JobMonitorApiModel>> = await apiClient.get(`${this.basePath}/jobs${query}`);

    return {
      data: response.data.data.map(mapJobItem),
      pagination: response.data.pagination,
    };
  }

  async getJob(id: number): Promise<NotebooklmJobDetail> {
    const response: AxiosResponse<{ data: JobDetailApiModel } | JobDetailApiModel> = await apiClient.get(
      `${this.basePath}/jobs/${id}`,
    );
    const payload = 'data' in response.data ? response.data.data : response.data;
    return mapJobDetail(payload);
  }

  async retryJob(id: number, payload: NotebooklmRetryRequestDto): Promise<NotebooklmJobMonitorItem> {
    const response: AxiosResponse<{ data: JobMonitorApiModel } | JobMonitorApiModel> = await apiClient.post(
      `${this.basePath}/jobs/${id}/retry`,
      payload,
    );
    const data = 'data' in response.data ? response.data.data : response.data;
    return mapJobItem(data);
  }

  async getDlqItems(): Promise<NotebooklmDlqItem[]> {
    const response: AxiosResponse<{ data: DlqItemApiModel[] } | DlqItemApiModel[]> = await apiClient.get(
      `${this.basePath}/dlq`,
    );
    const data = Array.isArray(response.data) ? response.data : response.data.data;
    return data.map(mapDlqItem);
  }

  async getDlqItem(id: number): Promise<NotebooklmDlqItem> {
    const response: AxiosResponse<{ data: DlqItemApiModel } | DlqItemApiModel> = await apiClient.get(
      `${this.basePath}/dlq/${id}`,
    );
    const data = 'data' in response.data ? response.data.data : response.data;
    return mapDlqItem(data);
  }

  async updateDlqItem(id: number, payload: NotebooklmDlqNoteDto): Promise<NotebooklmDlqItem> {
    const response: AxiosResponse<{ data: DlqItemApiModel } | DlqItemApiModel> = await apiClient.patch(
      `${this.basePath}/dlq/${id}`,
      payload,
    );
    const data = 'data' in response.data ? response.data.data : response.data;
    return mapDlqItem(data);
  }

  async purgeDlq(payload: NotebooklmDlqPurgeDto): Promise<void> {
    await apiClient.delete(`${this.basePath}/dlq`, { data: payload });
  }
}

export const notebooklmOperationsService = new NotebooklmOperationsService();
