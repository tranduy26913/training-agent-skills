import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { notebooklmWorkspaceService } from '@/services/notebooklm-workspace.service';
import type { PaginationInfo } from '@/types/api.types';
import type {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  Workspace,
  WorkspaceDocument,
  WorkspaceFilters,
  WorkspaceJobProgress,
} from '@/types/notebooklm.types';
import {
  NOTEBOOKLM_ALLOWED_MIME_TYPES,
  NOTEBOOKLM_MAX_FILE_SIZE_BYTES,
} from '@/types/notebooklm.types';

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
};

interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const useNotebooklmWorkspaceStore = defineStore('notebooklmWorkspace', () => {
  const items = ref<Workspace[]>([]);
  const currentItem = ref<Workspace | null>(null);
  const documents = ref<WorkspaceDocument[]>([]);
  const pagination = ref<PaginationInfo>({ ...DEFAULT_PAGINATION });
  const filters = ref<WorkspaceFilters>({});
  const jobProgressById = ref<Record<number, WorkspaceJobProgress>>({});

  const loading = shallowRef(false);
  const loadingCurrent = shallowRef(false);
  const loadingDocuments = shallowRef(false);
  const error = shallowRef<string | null>(null);

  const hasItems = computed(() => items.value.length > 0);
  const canEditCurrentWorkspace = computed(
    () => currentItem.value?.role === 'owner' || currentItem.value?.role === 'editor',
  );

  async function fetchItems(newFilters?: WorkspaceFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await notebooklmWorkspaceService.getWorkspaces(filters.value);
      items.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch workspaces';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchItem(id: number): Promise<void> {
    loadingCurrent.value = true;
    error.value = null;
    try {
      currentItem.value = await notebooklmWorkspaceService.getWorkspace(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch workspace';
      throw err;
    } finally {
      loadingCurrent.value = false;
    }
  }

  async function createItem(data: CreateWorkspaceDto): Promise<Workspace> {
    error.value = null;
    const created = await notebooklmWorkspaceService.createWorkspace(data);
    return created;
  }

  async function updateItem(id: number, data: UpdateWorkspaceDto): Promise<void> {
    error.value = null;
    const updated = await notebooklmWorkspaceService.updateWorkspace(id, data);
    if (currentItem.value?.id === id) {
      currentItem.value = updated;
    }

    const index = items.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      items.value[index] = updated;
    }
  }

  async function deleteItem(id: number): Promise<void> {
    error.value = null;
    await notebooklmWorkspaceService.deleteWorkspace(id);
    await fetchItems();
  }

  async function fetchDocuments(workspaceId: number): Promise<void> {
    loadingDocuments.value = true;
    error.value = null;
    try {
      documents.value = await notebooklmWorkspaceService.getWorkspaceDocuments(workspaceId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch workspace documents';
      throw err;
    } finally {
      loadingDocuments.value = false;
    }
  }

  function validateUpload(file: File): void {
    if (!NOTEBOOKLM_ALLOWED_MIME_TYPES.includes(file.type as (typeof NOTEBOOKLM_ALLOWED_MIME_TYPES)[number])) {
      throw new Error('Unsupported file type');
    }

    if (file.size > NOTEBOOKLM_MAX_FILE_SIZE_BYTES) {
      throw new Error('File size must be 100MB or less');
    }
  }

  function ensureUploadPermission(workspaceId: number): void {
    const workspaceRole =
      currentItem.value?.id === workspaceId
        ? currentItem.value.role
        : items.value.find((item) => item.id === workspaceId)?.role;

    if (workspaceRole === 'viewer') {
      throw new Error('You do not have permission to upload documents');
    }
  }

  async function uploadDocument(workspaceId: number, file: File): Promise<{ documentId: number; jobId: number }> {
    validateUpload(file);
    ensureUploadPermission(workspaceId);

    const result = await notebooklmWorkspaceService.uploadDocument(workspaceId, file);
    await fetchDocuments(workspaceId);
    return result;
  }

  async function deleteDocument(workspaceId: number, documentId: number): Promise<{ jobId: number }> {
    ensureUploadPermission(workspaceId);
    const result = await notebooklmWorkspaceService.deleteDocument(workspaceId, documentId);
    await fetchDocuments(workspaceId);
    return result;
  }

  async function pollJobUntilSettled(jobId: number, options?: PollOptions): Promise<WorkspaceJobProgress> {
    const intervalMs = options?.intervalMs ?? 1500;
    const maxAttempts = options?.maxAttempts ?? 40;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const progress = await notebooklmWorkspaceService.getJobProgress(jobId);
      jobProgressById.value[jobId] = progress;

      if (['done', 'failed', 'dead_letter'].includes(progress.status)) {
        return progress;
      }

      await sleep(intervalMs);
    }

    throw new Error('Timed out while waiting for job progress');
  }

  function clearCurrentItem(): void {
    currentItem.value = null;
    documents.value = [];
  }

  return {
    items,
    currentItem,
    documents,
    pagination,
    filters,
    jobProgressById,
    loading,
    loadingCurrent,
    loadingDocuments,
    error,
    hasItems,
    canEditCurrentWorkspace,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    pollJobUntilSettled,
    clearCurrentItem,
  };
});
