// 語彙 API 操作コンポーザブル / Vocabularies API composable wrapper
import { ref, reactive } from 'vue';
import { vocabulariesApiService } from '@/services/vocabularies.service';
import type {
  VocabularyResponse,
  VocabularyDetail,
  VocabRelationDto,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  AnalyticsData,
} from '@/types/vocabularies.types';
import type { PaginatedData } from '@/types/api.types';

// 型の再エクスポート / Re-export types for component usage
export type {
  VocabularyResponse,
  VocabularyDetail,
  VocabRelationDto,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  AnalyticsData,
};
export type { PaginationInfo } from '@/types/api.types';

// 語彙 API 呼び出し / Thin API wrappers for vocabulary endpoints
export function useVocabularies() {
  // リアクティブステート / Reactive state
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 語彙一覧取得 / Get filtered vocabulary list
  async function getVocabularies(filters?: VocabularyFilters): Promise<PaginatedData<VocabularyResponse>> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.getVocabularies(filters);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch vocabularies';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 語彙詳細取得 / Get single vocabulary with relations and audit data
  async function getVocabulary(id: number): Promise<VocabularyDetail> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.getVocabularyDetail(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch vocabulary';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 語彙作成 / Create vocabulary
  async function createVocabulary(data: CreateVocabularyDto): Promise<VocabularyResponse> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.create(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create vocabulary';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 語彙更新 / Update vocabulary
  async function updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<VocabularyResponse> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.update(id, data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update vocabulary';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 語彙削除 / Delete vocabulary
  async function deleteVocabulary(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.delete(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete vocabulary';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 語彙関係オプション取得 / Get vocabulary options for MultiSelect
  async function getRelationOptions(excludeIds?: number[]): Promise<VocabRelationDto[]> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.getRelationOptions(excludeIds);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch relation options';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 分析データ取得 / Get analytics data
  async function getAnalytics(id: number): Promise<AnalyticsData> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.getAnalytics(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch analytics';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // レポート解決 / Resolve a vocabulary report
  async function resolveReport(vocabId: number, reportId: number, status: 'resolved' | 'dismissed'): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      return await vocabulariesApiService.resolveReport(vocabId, reportId, status);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to resolve report';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    getVocabularies,
    getVocabulary,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    getRelationOptions,
    getAnalytics,
    resolveReport,
  };
}
