// 語彙API操作コンポーザブル / Vocabulary API composable wrapper
import { vocabulariesApiService } from '@/services/vocabularies.service';
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

// 型の再エクスポート / Re-export types for component usage
export type {
  Vocabulary,
  VocabularyDetail,
  VocabularySimple,
  VocabularyAuditLog,
  VocabularyReport,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyFilters,
};
export type { PaginationInfo } from '@/types/api.types';

// 語彙API呼び出し / Thin API wrappers for vocabulary endpoints
export function useVocabularies() {
  // 語彙一覧取得 / Get filtered vocabulary list
  async function getVocabularies(filters?: VocabularyFilters): Promise<PaginatedData<Vocabulary>> {
    return vocabulariesApiService.getVocabularies(filters);
  }

  // 語彙取得 / Get single vocabulary detail
  async function getVocabulary(id: number): Promise<VocabularyDetail> {
    return vocabulariesApiService.getVocabularyDetail(id);
  }

  // シンプル一覧取得 / Get lightweight vocabulary list
  async function getSimpleList(): Promise<VocabularySimple[]> {
    return vocabulariesApiService.getSimpleList();
  }

  // 語彙作成 / Create vocabulary
  async function createVocabulary(data: CreateVocabularyDto): Promise<Vocabulary> {
    return vocabulariesApiService.create(data);
  }

  // 語彙更新 / Update vocabulary
  async function updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<Vocabulary> {
    return vocabulariesApiService.update(id, data);
  }

  // 語彙ソフトデリート / Soft delete vocabulary
  async function deleteVocabulary(id: number): Promise<void> {
    return vocabulariesApiService.deleteVocabulary(id);
  }

  // 監査ログ取得 / Get audit logs
  async function getAuditLogs(vocabId: number): Promise<VocabularyAuditLog[]> {
    return vocabulariesApiService.getAuditLogs(vocabId);
  }

  // レポート解決 / Resolve report
  async function resolveReport(reportId: number): Promise<VocabularyReport> {
    return vocabulariesApiService.resolveReport(reportId);
  }

  // レポート拒否 / Reject report
  async function rejectReport(reportId: number): Promise<VocabularyReport> {
    return vocabulariesApiService.rejectReport(reportId);
  }

  return {
    getVocabularies,
    getVocabulary,
    getSimpleList,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    getAuditLogs,
    resolveReport,
    rejectReport,
  };
}
