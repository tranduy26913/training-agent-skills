// 語彙APIサービス / Vocabulary API service extending base client
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type {
  VocabularyRow,
  VocabularyDetail,
  VocabSummary,
  VocabularyChangeLog,
  VocabularyReport,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyFilters,
  ReportStatus,
} from '@/types/vocabularies.types';
import type { PaginatedData } from '@/types/api.types';

// 語彙APIクライアント / Vocabulary API client
class VocabulariesApiClient extends BaseApiClient<VocabularyDetail, CreateVocabularyDto, UpdateVocabularyDto> {
  constructor() {
    super('/vocabularies');
  }

  // フィルター付き語彙一覧取得 / Get vocabularies with filters
  async getVocabularies(filters?: VocabularyFilters): Promise<PaginatedData<VocabularyRow>> {
    return this.getList(filters as Record<string, unknown>);
  }

  // 語彙詳細取得 / Get vocabulary detail by ID
  async getVocabulary(id: number): Promise<VocabularyDetail> {
    return this.getById(id);
  }

  // 語彙作成 / Create vocabulary
  async createVocabulary(dto: CreateVocabularyDto): Promise<VocabularyDetail> {
    return this.create(dto);
  }

  // 語彙更新 / Update vocabulary
  async updateVocabulary(id: number, dto: UpdateVocabularyDto): Promise<VocabularyDetail> {
    return this.update(id, dto);
  }

  // 語彙軟削除 / Soft delete vocabulary
  async deleteVocabulary(id: number): Promise<void> {
    return this.delete(id);
  }

  // 変更ログ一覧取得 / Get change logs for a vocabulary
  async getChangeLogs(id: number): Promise<VocabularyChangeLog[]> {
    const response: AxiosResponse<{ data: VocabularyChangeLog[] }> = await apiClient.get(
      `${this.basePath}/${id}/change-logs`,
    );
    return response.data.data;
  }

  // レポート一覧取得 / Get reports for a vocabulary
  async getReports(id: number): Promise<VocabularyReport[]> {
    const response: AxiosResponse<{ data: VocabularyReport[] }> = await apiClient.get(
      `${this.basePath}/${id}/reports`,
    );
    return response.data.data;
  }

  // レポートステータス更新 / Update report status
  async updateReportStatus(vocabId: number, reportId: number, status: ReportStatus): Promise<VocabularyReport> {
    const response: AxiosResponse<VocabularyReport> = await apiClient.patch(
      `${this.basePath}/${vocabId}/reports/${reportId}`,
      { status },
    );
    return response.data;
  }

  // タグ提案 / Suggest tags by prefix
  async suggestTags(q: string): Promise<string[]> {
    const response: AxiosResponse<{ data: string[] }> = await apiClient.get(
      `/tags/suggest?q=${encodeURIComponent(q)}`,
    );
    return response.data.data;
  }

  // 語彙検索（MultiSelect用）/ Search vocabularies for relationship selects
  async searchVocabularies(q: string, excludeId?: number): Promise<VocabSummary[]> {
    const params = new URLSearchParams({ q });
    if (excludeId !== undefined) params.set('exclude', String(excludeId));
    const response: AxiosResponse<{ data: VocabSummary[] }> = await apiClient.get(
      `${this.basePath}/search?${params.toString()}`,
    );
    return response.data.data;
  }
}

// シングルトンインスタンス / Singleton instance
export const vocabulariesApiService = new VocabulariesApiClient();
