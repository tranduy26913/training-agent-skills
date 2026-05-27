// 語彙ストア / Vocabulary Pinia store
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useVocabularies } from '@/pages/vocabularies/composables/useVocabularies';
import type {
  VocabularyRow,
  VocabularyDetail,
  VocabularyChangeLog,
  VocabularyReport,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  ReportStatus,
} from '@/types/vocabularies.types';
import type { PaginationInfo } from '@/types/api.types';

export const useVocabulariesStore = defineStore('vocabularies', () => {
  const composable = useVocabularies();

  // 状態 / State
  const items = ref<VocabularyRow[]>([]);
  const currentVocabulary = ref<VocabularyDetail | null>(null);
  const changeLogs = ref<VocabularyChangeLog[]>([]);
  const reports = ref<VocabularyReport[]>([]);
  const filters = ref<VocabularyFilters>({});
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const loading = shallowRef(false);
  const loadingDetail = shallowRef(false);
  const loadingLogs = shallowRef(false);
  const loadingReports = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // 語彙一覧取得 / Fetch vocabulary list with optional filter merge
  async function fetchVocabularies(newFilters?: Partial<VocabularyFilters>): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }
    loading.value = true;
    error.value = null;
    try {
      const result = await composable.fetchList(filters.value);
      items.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch vocabularies';
    } finally {
      loading.value = false;
    }
  }

  // 語彙詳細取得 / Fetch vocabulary detail by ID
  async function fetchVocabulary(id: number): Promise<void> {
    loadingDetail.value = true;
    error.value = null;
    try {
      currentVocabulary.value = await composable.fetchDetail(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch vocabulary';
    } finally {
      loadingDetail.value = false;
    }
  }

  // 語彙作成 / Create vocabulary (throws on error for caller to handle)
  async function createVocabulary(dto: CreateVocabularyDto): Promise<void> {
    await composable.createVocabulary(dto);
  }

  // 語彙更新 / Update vocabulary (throws on error for caller to handle)
  async function updateVocabulary(id: number, dto: UpdateVocabularyDto): Promise<void> {
    await composable.updateVocabulary(id, dto);
  }

  // 語彙削除 / Delete vocabulary and refresh list
  async function deleteVocabulary(id: number): Promise<void> {
    await composable.deleteVocabulary(id);
    await fetchVocabularies();
  }

  // 変更ログ取得 / Fetch change logs for current vocabulary
  async function fetchChangeLogs(id: number): Promise<void> {
    loadingLogs.value = true;
    try {
      changeLogs.value = await composable.fetchChangeLogs(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch change logs';
    } finally {
      loadingLogs.value = false;
    }
  }

  // レポート一覧取得 / Fetch reports for current vocabulary
  async function fetchReports(id: number): Promise<void> {
    loadingReports.value = true;
    try {
      reports.value = await composable.fetchReports(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch reports';
    } finally {
      loadingReports.value = false;
    }
  }

  // レポートステータス更新 / Update report status in-place
  async function updateReportStatus(
    vocabId: number,
    reportId: number,
    status: ReportStatus,
  ): Promise<void> {
    const updated = await composable.updateReportStatus(vocabId, reportId, status);
    const idx = reports.value.findIndex((r) => r.id === reportId);
    if (idx !== -1) {
      reports.value[idx] = updated;
    }
  }

  // 現在の語彙をクリア / Clear current vocabulary detail
  function clearCurrent(): void {
    currentVocabulary.value = null;
    changeLogs.value = [];
    reports.value = [];
  }

  return {
    items,
    currentVocabulary,
    changeLogs,
    reports,
    filters,
    pagination,
    loading,
    loadingDetail,
    loadingLogs,
    loadingReports,
    error,
    fetchVocabularies,
    fetchVocabulary,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    fetchChangeLogs,
    fetchReports,
    updateReportStatus,
    clearCurrent,
  };
});
