// 学習ストア / FlashCard learning Pinia store
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { learnService } from '@/services/learn.service';
import type {
  LevelStatsDto,
  LearnVocabularyItem,
  ProgressUpdateItem,
  ToggleFavoriteResponse,
  LearnVocabFilter,
} from '@/types/learn.types';
import type { PaginationInfo } from '@/types/api.types';

export const useLearnStore = defineStore('learn', () => {
  // --- 状態 / State ---
  const levelStats = ref<LevelStatsDto[]>([]);
  const vocabularies = ref<LearnVocabularyItem[]>([]);
  const pagination = ref<PaginationInfo>({ page: 1, limit: 50, total: 0, pages: 0 });
  const loading = shallowRef(false);
  const loadingStats = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // --- アクション / Actions ---

  /** レベル統計取得 / Fetch per-level progress stats */
  async function fetchLevelStats(): Promise<void> {
    loadingStats.value = true;
    error.value = null;
    try {
      levelStats.value = await learnService.getLevelStats();
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to fetch level stats';
    } finally {
      loadingStats.value = false;
    }
  }

  /** 語彙一覧取得 / Fetch paginated vocabularies for a level */
  async function fetchVocabularies(filter: LearnVocabFilter): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const result = await learnService.getVocabularies(filter);
      vocabularies.value = result.data;
      pagination.value = result.pagination;
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to fetch vocabularies';
    } finally {
      loading.value = false;
    }
  }

  /** バッチ進捗更新 / Batch update progress after a session */
  async function batchUpdateProgress(updates: ProgressUpdateItem[]): Promise<number> {
    try {
      return await learnService.batchUpdateProgress(updates);
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update progress';
      return 0;
    }
  }

  /** お気に入りトグル / Toggle favorite on a vocabulary card */
  async function toggleFavorite(vocabularyId: number): Promise<ToggleFavoriteResponse | null> {
    try {
      const result = await learnService.toggleFavorite(vocabularyId);
      // 語彙一覧のis_favoriteを即時更新 / Optimistically update list item
      const item = vocabularies.value.find((v) => v.id === vocabularyId);
      if (item?.progress) {
        item.progress.is_favorite = result.is_favorite;
      }
      return result;
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to toggle favorite';
      return null;
    }
  }

  /** 状態リセット / Reset store state */
  function $reset(): void {
    levelStats.value = [];
    vocabularies.value = [];
    pagination.value = { page: 1, limit: 50, total: 0, pages: 0 };
    loading.value = false;
    loadingStats.value = false;
    error.value = null;
  }

  return {
    // State
    levelStats,
    vocabularies,
    pagination,
    loading,
    loadingStats,
    error,
    // Actions
    fetchLevelStats,
    fetchVocabularies,
    batchUpdateProgress,
    toggleFavorite,
    $reset,
  };
});
