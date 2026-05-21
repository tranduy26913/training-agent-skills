// 語彙Piniaストア / Vocabulary Pinia store
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useVocabularies } from '@/pages/vocabularies/composables/useVocabularies';
import type {
  Vocabulary,
  VocabularyDetail,
  VocabularySimple,
  VocabularyAuditLog,
  VocabularyReport,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
} from '@/types/vocabularies.types';
import type { PaginationInfo } from '@/types/api.types';

export const useVocabulariesStore = defineStore('vocabularies', () => {
  const {
    getVocabularies: apiGetVocabularies,
    getVocabulary: apiGetVocabulary,
    getSimpleList: apiGetSimpleList,
    createVocabulary: apiCreateVocabulary,
    updateVocabulary: apiUpdateVocabulary,
    deleteVocabulary: apiDeleteVocabulary,
    getAuditLogs: apiGetAuditLogs,
    resolveReport: apiResolveReport,
    rejectReport: apiRejectReport,
  } = useVocabularies();

  // 状態 / State
  const vocabularies = ref<Vocabulary[]>([]);
  const currentVocabulary = ref<VocabularyDetail | null>(null);
  const simpleList = ref<VocabularySimple[]>([]);
  const auditLogs = ref<VocabularyAuditLog[]>([]);
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const filters = ref<VocabularyFilters>({});
  const loading = shallowRef(false);
  const loadingVocabulary = shallowRef(false);
  const loadingSimpleList = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // ゲッター / Getters
  const totalVocabularies = computed(() => pagination.value.total);
  const hasVocabularies = computed(() => vocabularies.value.length > 0);

  // 語彙一覧取得 / Fetch paginated vocabulary list
  async function fetchVocabularies(newFilters?: VocabularyFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }
    loading.value = true;
    error.value = null;
    try {
      const result = await apiGetVocabularies(filters.value);
      vocabularies.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch vocabularies';
    } finally {
      loading.value = false;
    }
  }

  // 単一語彙取得 / Fetch single vocabulary detail
  async function fetchVocabulary(id: number): Promise<void> {
    loadingVocabulary.value = true;
    error.value = null;
    try {
      currentVocabulary.value = await apiGetVocabulary(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch vocabulary';
    } finally {
      loadingVocabulary.value = false;
    }
  }

  // シンプル一覧取得 / Fetch simple list for MultiSelect
  async function fetchSimpleList(): Promise<void> {
    loadingSimpleList.value = true;
    try {
      simpleList.value = await apiGetSimpleList();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch simple list';
    } finally {
      loadingSimpleList.value = false;
    }
  }

  // 語彙作成 / Create vocabulary
  async function createVocabulary(data: CreateVocabularyDto): Promise<void> {
    await apiCreateVocabulary(data);
  }

  // 語彙更新 / Update vocabulary
  async function updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<void> {
    const updated = await apiUpdateVocabulary(id, data);
    if (currentVocabulary.value?.id === id) {
      currentVocabulary.value = { ...currentVocabulary.value, ...updated };
    }
  }

  // 語彙ソフトデリート / Soft delete vocabulary
  async function deleteVocabulary(id: number): Promise<void> {
    await apiDeleteVocabulary(id);
    await fetchVocabularies();
  }

  // 監査ログ取得 / Fetch audit logs
  async function fetchAuditLogs(vocabId: number): Promise<void> {
    try {
      auditLogs.value = await apiGetAuditLogs(vocabId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch audit logs';
    }
  }

  // レポート解決 / Resolve report
  async function resolveReport(reportId: number): Promise<void> {
    const updated = await apiResolveReport(reportId);
    _updateReportInState(updated);
  }

  // レポート拒否 / Reject report
  async function rejectReport(reportId: number): Promise<void> {
    const updated = await apiRejectReport(reportId);
    _updateReportInState(updated);
  }

  // 現在の語彙をクリア / Clear current vocabulary
  function clearCurrentVocabulary(): void {
    currentVocabulary.value = null;
    auditLogs.value = [];
  }

  // 内部ヘルパー: レポートステータスを状態で更新 / Update report in state
  function _updateReportInState(updated: VocabularyReport): void {
    if (!currentVocabulary.value) return;
    currentVocabulary.value = {
      ...currentVocabulary.value,
      reports: currentVocabulary.value.reports.map((r) =>
        r.id === updated.id ? updated : r,
      ),
    };
  }

  return {
    // State
    vocabularies,
    currentVocabulary,
    simpleList,
    auditLogs,
    pagination,
    filters,
    loading,
    loadingVocabulary,
    loadingSimpleList,
    error,
    // Getters
    totalVocabularies,
    hasVocabularies,
    // Actions
    fetchVocabularies,
    fetchVocabulary,
    fetchSimpleList,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    fetchAuditLogs,
    resolveReport,
    rejectReport,
    clearCurrentVocabulary,
  };
});
