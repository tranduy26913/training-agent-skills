// 語彙コンポーザブル / useVocabularies composable — wraps API service
import { vocabulariesApiService } from '@/services/vocabularies.service';
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

// 語彙コンポーザブル / Composable for vocabulary API operations
export function useVocabularies() {
  // 語彙一覧取得 / Fetch paginated vocabulary list
  async function fetchList(filters: VocabularyFilters): Promise<PaginatedData<VocabularyRow>> {
    return vocabulariesApiService.getVocabularies(filters);
  }

  // 語彙詳細取得 / Fetch vocabulary detail by ID
  async function fetchDetail(id: number): Promise<VocabularyDetail> {
    return vocabulariesApiService.getVocabulary(id);
  }

  // 語彙作成 / Create vocabulary
  async function createVocabulary(dto: CreateVocabularyDto): Promise<VocabularyDetail> {
    return vocabulariesApiService.createVocabulary(dto);
  }

  // 語彙更新 / Update vocabulary
  async function updateVocabulary(id: number, dto: UpdateVocabularyDto): Promise<VocabularyDetail> {
    return vocabulariesApiService.updateVocabulary(id, dto);
  }

  // 語彙軟削除 / Delete vocabulary (soft delete)
  async function deleteVocabulary(id: number): Promise<void> {
    return vocabulariesApiService.deleteVocabulary(id);
  }

  // 変更ログ取得 / Fetch change logs for a vocabulary
  async function fetchChangeLogs(id: number): Promise<VocabularyChangeLog[]> {
    return vocabulariesApiService.getChangeLogs(id);
  }

  // レポート一覧取得 / Fetch reports for a vocabulary
  async function fetchReports(id: number): Promise<VocabularyReport[]> {
    return vocabulariesApiService.getReports(id);
  }

  // レポートステータス更新 / Update report status
  async function updateReportStatus(
    vocabId: number,
    reportId: number,
    status: ReportStatus,
  ): Promise<VocabularyReport> {
    return vocabulariesApiService.updateReportStatus(vocabId, reportId, status);
  }

  // タグ提案 / Suggest tags by prefix
  async function suggestTags(q: string): Promise<string[]> {
    return vocabulariesApiService.suggestTags(q);
  }

  // 語彙検索（MultiSelect用）/ Search vocabularies for relationship selects
  async function searchVocabularies(q: string, excludeId?: number): Promise<VocabSummary[]> {
    return vocabulariesApiService.searchVocabularies(q, excludeId);
  }

  return {
    fetchList,
    fetchDetail,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    fetchChangeLogs,
    fetchReports,
    updateReportStatus,
    suggestTags,
    searchVocabularies,
    search: searchVocabularies,
  };
}
