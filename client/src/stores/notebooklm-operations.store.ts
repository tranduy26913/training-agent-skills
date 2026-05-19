import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { notebooklmOperationsService } from '@/services/notebooklm-operations.service';
import type { PaginationInfo } from '@/types/api.types';
import type {
  NotebooklmDlqItem,
  NotebooklmDlqNoteDto,
  NotebooklmDlqPurgeDto,
  NotebooklmJobDetail,
  NotebooklmJobMonitorItem,
  NotebooklmOperationsFilters,
  NotebooklmRetryRequestDto,
} from '@/types/notebooklm.types';

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 25,
  total: 0,
  pages: 0,
};

export const useNotebooklmOperationsStore = defineStore('notebooklmOperations', () => {
  const items = ref<NotebooklmJobMonitorItem[]>([]);
  const currentItem = ref<NotebooklmJobDetail | null>(null);
  const dlqItems = ref<NotebooklmDlqItem[]>([]);
  const currentDlqItem = ref<NotebooklmDlqItem | null>(null);
  const pagination = ref<PaginationInfo>({ ...DEFAULT_PAGINATION });
  const filters = ref<NotebooklmOperationsFilters>({ page: 1, limit: 25 });

  const loading = shallowRef(false);
  const loadingCurrent = shallowRef(false);
  const loadingDlq = shallowRef(false);
  const error = shallowRef<string | null>(null);

  const hasItems = computed(() => items.value.length > 0);

  async function fetchItems(newFilters?: NotebooklmOperationsFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await notebooklmOperationsService.getJobs(filters.value);
      items.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch operations jobs';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchItem(id: number): Promise<void> {
    loadingCurrent.value = true;
    error.value = null;
    try {
      currentItem.value = await notebooklmOperationsService.getJob(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch job detail';
      throw err;
    } finally {
      loadingCurrent.value = false;
    }
  }

  async function createItem(jobId: number, data: NotebooklmRetryRequestDto): Promise<NotebooklmJobMonitorItem> {
    error.value = null;
    const retried = await notebooklmOperationsService.retryJob(jobId, data);

    const index = items.value.findIndex((item) => item.id === jobId);
    if (index >= 0) {
      items.value[index] = retried;
    }
    if (currentItem.value?.id === jobId) {
      await fetchItem(jobId);
    }

    return retried;
  }

  async function updateItem(id: number, data: NotebooklmDlqNoteDto): Promise<void> {
    error.value = null;
    const updated = await notebooklmOperationsService.updateDlqItem(id, data);
    currentDlqItem.value = updated;

    const index = dlqItems.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      dlqItems.value[index] = updated;
    }
  }

  async function deleteItem(payload: NotebooklmDlqPurgeDto): Promise<void> {
    error.value = null;
    await notebooklmOperationsService.purgeDlq(payload);
    await fetchDlqItems();
  }

  async function fetchDlqItems(): Promise<void> {
    loadingDlq.value = true;
    error.value = null;
    try {
      dlqItems.value = await notebooklmOperationsService.getDlqItems();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch DLQ items';
      throw err;
    } finally {
      loadingDlq.value = false;
    }
  }

  async function fetchDlqItem(id: number): Promise<void> {
    loadingDlq.value = true;
    error.value = null;
    try {
      currentDlqItem.value = await notebooklmOperationsService.getDlqItem(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch DLQ item';
      throw err;
    } finally {
      loadingDlq.value = false;
    }
  }

  function clearCurrentItem(): void {
    currentItem.value = null;
    currentDlqItem.value = null;
  }

  return {
    items,
    currentItem,
    dlqItems,
    currentDlqItem,
    pagination,
    filters,
    loading,
    loadingCurrent,
    loadingDlq,
    error,
    hasItems,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    fetchDlqItems,
    fetchDlqItem,
    clearCurrentItem,
  };
});
