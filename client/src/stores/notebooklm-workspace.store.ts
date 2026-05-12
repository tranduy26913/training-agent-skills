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
  WorkspaceMember,
  WorkspaceMemberCandidate,
  NotebooklmWorkspaceRole,
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
  const members = ref<WorkspaceMember[]>([]);
  const memberCandidates = ref<WorkspaceMemberCandidate[]>([]);
  const pagination = ref<PaginationInfo>({ ...DEFAULT_PAGINATION });
  const filters = ref<WorkspaceFilters>({});
  const jobProgressById = ref<Record<number, WorkspaceJobProgress>>({});

  const loading = shallowRef(false);
  const loadingCurrent = shallowRef(false);
  const loadingDocuments = shallowRef(false);
  const loadingMembers = shallowRef(false);
  const searchingMembers = shallowRef(false);
  const error = shallowRef<string | null>(null);

  const hasItems = computed(() => items.value.length > 0);
  const canEditCurrentWorkspace = computed(
    () => currentItem.value?.role === 'owner' || currentItem.value?.role === 'editor',
  );
  const canManageCurrentWorkspaceMembers = computed(() => currentItem.value?.role === 'owner');

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

  async function fetchMembers(workspaceId: number): Promise<void> {
    loadingMembers.value = true;
    error.value = null;
    try {
      members.value = await notebooklmWorkspaceService.getWorkspaceMembers(workspaceId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch workspace members';
      throw err;
    } finally {
      loadingMembers.value = false;
    }
  }

  async function searchCandidateUsers(
    workspaceId: number,
    query: string,
    page = 1,
    limit = 10,
  ): Promise<void> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      memberCandidates.value = [];
      return;
    }

    searchingMembers.value = true;
    error.value = null;
    try {
      memberCandidates.value = await notebooklmWorkspaceService.searchWorkspaceCandidateUsers(
        workspaceId,
        normalizedQuery,
        page,
        limit,
      );
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to search workspace users';
      throw err;
    } finally {
      searchingMembers.value = false;
    }
  }

  async function addOrUpdateMember(
    workspaceId: number,
    userId: number,
    role: NotebooklmWorkspaceRole,
  ): Promise<WorkspaceMember> {
    error.value = null;
    const member = await notebooklmWorkspaceService.addOrUpdateWorkspaceMember(workspaceId, userId, role);
    const index = members.value.findIndex((currentMember) => currentMember.userId === member.userId);
    if (index >= 0) {
      members.value[index] = member;
    } else {
      members.value = [...members.value, member];
    }
    return member;
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

  /**
   * ドキュメントファイルをダウンロードする / Trigger browser download for a document file
   */
  async function downloadDocument(workspaceId: number, documentId: number, filename: string): Promise<void> {
    const { blob, filename: serverFilename } = await notebooklmWorkspaceService.downloadDocument(workspaceId, documentId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = serverFilename || filename;
    anchor.click();
    URL.revokeObjectURL(url);
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
    members.value = [];
    memberCandidates.value = [];
  }

  return {
    items,
    currentItem,
    documents,
    members,
    memberCandidates,
    pagination,
    filters,
    jobProgressById,
    loading,
    loadingCurrent,
    loadingDocuments,
    loadingMembers,
    searchingMembers,
    error,
    hasItems,
    canEditCurrentWorkspace,
    canManageCurrentWorkspaceMembers,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    fetchDocuments,
    fetchMembers,
    searchCandidateUsers,
    addOrUpdateMember,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    pollJobUntilSettled,
    clearCurrentItem,
  };
});
