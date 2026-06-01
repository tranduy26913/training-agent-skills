// 学習APIサービス / FlashCard learning API service
import apiClient from './api.service';
import type { AxiosResponse } from 'axios';
import type {
  LevelStatsDto,
  LearnVocabularyItem,
  ProgressUpdateItem,
  ToggleFavoriteResponse,
  LearnVocabFilter,
} from '@/types/learn.types';
import type { PaginatedData } from '@/types/api.types';

/**
 * 学習APIクライアント / FlashCard learning API client
 * Communicates with /api/learn/* endpoints
 */
class LearnApiClient {
  private readonly basePath = '/learn';

  /** レベル統計取得 / Get per-level progress statistics */
  async getLevelStats(): Promise<LevelStatsDto[]> {
    const response: AxiosResponse<{ data: LevelStatsDto[] }> = await apiClient.get(
      `${this.basePath}/stats`,
    );
    return response.data.data;
  }

  /** 語彙一覧取得 / Get paginated vocabularies with user progress */
  async getVocabularies(filter: LearnVocabFilter): Promise<PaginatedData<LearnVocabularyItem>> {
    const params: Record<string, unknown> = {
      level: filter.level,
      progress_status: filter.progress_status ?? 'all',
      page: filter.page ?? 1,
      limit: filter.limit ?? 50,
    };
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    const response: AxiosResponse<PaginatedData<LearnVocabularyItem>> = await apiClient.get(
      `${this.basePath}/vocabularies?${query}`,
    );
    return response.data;
  }

  /** バッチ進捗更新 / Batch update progress at end of session */
  async batchUpdateProgress(updates: ProgressUpdateItem[]): Promise<number> {
    const response: AxiosResponse<{ updated: number }> = await apiClient.post(
      `${this.basePath}/progress/batch`,
      { updates },
    );
    return response.data.updated;
  }

  /** お気に入りトグル / Toggle favorite for a vocabulary */
  async toggleFavorite(vocabularyId: number): Promise<ToggleFavoriteResponse> {
    const response: AxiosResponse<ToggleFavoriteResponse> = await apiClient.post(
      `${this.basePath}/favorite/${vocabularyId}`,
    );
    return response.data;
  }
}

export const learnService = new LearnApiClient();
