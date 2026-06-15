// 語彙 API サービス / Vocabularies API service extending base client
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type {
  VocabularyResponse,
  VocabularyDetail,
  VocabRelationDto,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  AnalyticsData,
} from '@/types/vocabularies.types';

// 語彙 API クライアント / Vocabularies API client with domain-specific methods
class VocabulariesApiClient extends BaseApiClient<VocabularyResponse, CreateVocabularyDto, UpdateVocabularyDto> {
  constructor() {
    super('/vocabularies');
  }

  // フィルター付き語彙一覧取得 / Get vocabularies with filters
  async getVocabularies(filters?: VocabularyFilters) {
    return this.getList(filters as Record<string, unknown>);
  }

  // 語彙詳細取得（関連データ付き） / Get vocabulary detail with relations and audit data
  async getVocabularyDetail(id: number): Promise<VocabularyDetail> {
    const response: AxiosResponse<VocabularyDetail> = await apiClient.get(
      `${this.basePath}/${id}`,
    );
    return response.data;
  }

  // 語彙関係オプション取得 / Get vocabulary options for relation MultiSelect
  async getRelationOptions(excludeIds?: number[]): Promise<VocabRelationDto[]> {
    // Load from main endpoint with limit=1000 as per spec
    const params = excludeIds?.length ? `?excludeIds=${excludeIds.join(',')}` : '';
    const response: AxiosResponse<VocabRelationDto[]> = await apiClient.get(
      `${this.basePath}${params}`,
      { params: { limit: 1000 } },
    );
    return response.data.map((item) => ({
      id: item.id,
      kanji: item.kanji,
      hiragana: item.hiragana,
      level: item.level,
    }));
  }

  // 分析データ取得 / Get analytics data for a vocabulary
  async getAnalytics(id: number): Promise<AnalyticsData> {
    const response: AxiosResponse<AnalyticsData> = await apiClient.get(
      `${this.basePath}/${id}/analytics`,
    );
    return response.data;
  }

  // レポート解決 / Resolve a vocabulary report
  async resolveReport(vocabId: number, reportId: number, status: 'resolved' | 'dismissed'): Promise<void> {
    await apiClient.patch(
      `${this.basePath}/${vocabId}/reports/${reportId}`,
      { status },
    );
  }
}

// シングルトンインスタンス / Singleton instance
export const vocabulariesApiService = new VocabulariesApiClient();
