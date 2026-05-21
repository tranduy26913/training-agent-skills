// 語彙APIサービス / Vocabulary API service
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type {
  Vocabulary,
  VocabularyDetail,
  VocabularySimple,
  VocabularyAuditLog,
  VocabularyReport,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyFilters,
} from '@/types/vocabularies.types';
import type { PaginatedData } from '@/types/api.types';

// 語彙APIクライアント / Vocabulary API client
class VocabulariesApiClient extends BaseApiClient<Vocabulary, CreateVocabularyDto, UpdateVocabularyDto> {
  constructor() {
    super('/vocabularies');
  }

  // フィルター付き語彙一覧取得 / Get vocabularies with filters
  async getVocabularies(filters?: VocabularyFilters): Promise<PaginatedData<Vocabulary>> {
    return this.getList(filters as Record<string, unknown>);
  }

  // 語彙詳細取得 / Get vocabulary detail with relations
  async getVocabularyDetail(id: number): Promise<VocabularyDetail> {
    const response: AxiosResponse<VocabularyDetail> = await apiClient.get(
      `${this.basePath}/${id}`,
    );
    return response.data;
  }

  // シンプル一覧取得 (MultiSelect用) / Get simple list for MultiSelect
  async getSimpleList(): Promise<VocabularySimple[]> {
    const response: AxiosResponse<VocabularySimple[]> = await apiClient.get(
      `${this.basePath}/list/simple`,
    );
    return response.data;
  }

  // 語彙ソフトデリート / Soft delete vocabulary
  async deleteVocabulary(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // 監査ログ取得 / Get audit logs for vocabulary
  async getAuditLogs(vocabId: number): Promise<VocabularyAuditLog[]> {
    const response: AxiosResponse<VocabularyAuditLog[]> = await apiClient.get(
      `${this.basePath}/${vocabId}/audit-logs`,
    );
    return response.data;
  }

  // レポート解決 / Resolve a report
  async resolveReport(reportId: number): Promise<VocabularyReport> {
    const response: AxiosResponse<VocabularyReport> = await apiClient.patch(
      `${this.basePath}/reports/${reportId}/resolve`,
    );
    return response.data;
  }

  // レポート拒否 / Reject a report
  async rejectReport(reportId: number): Promise<VocabularyReport> {
    const response: AxiosResponse<VocabularyReport> = await apiClient.patch(
      `${this.basePath}/reports/${reportId}/reject`,
    );
    return response.data;
  }
}

// シングルトンインスタンス / Singleton instance
export const vocabulariesApiService = new VocabulariesApiClient();
