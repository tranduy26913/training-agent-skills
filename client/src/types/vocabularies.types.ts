// 語彙管理モジュール型定義 / Vocabularies module type definitions
import type { PaginationParams, SortParams } from './api.types';

// 語彙ステータス / Vocabulary status enum
export type VocabularyStatus = 'Publish' | 'Hide' | 'Delete';

// JLPT レベル / JLPT level enum
export type VocabLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// 語彙関係タイプ / Vocabulary relation type enum
export type VocabRelationType = 'related' | 'synonym' | 'antonym';

// 語彙レポートステータス / Vocabulary report status enum
export type VocabReportStatus = 'pending' | 'resolved' | 'dismissed';

// 語彙レスポンス / Vocabulary response from API
export interface VocabularyResponse {
  id: number;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaning_vi: string;
  on_yomi: string | null;
  level: VocabLevel | null;
  media_url: string | null;
  note: string | null;
  tags: string[];
  status: VocabularyStatus;
  created_at: string;
  updated_at: string;
}

// 語彙詳細（関連データ付き） / Vocabulary detail with relations and audit data
export interface VocabularyDetail extends VocabularyResponse {
  related_vocab: VocabRelationDto[];
  synonym_vocab: VocabRelationDto[];
  antonym_vocab: VocabRelationDto[];
  change_logs: VocabChangeLogDto[];
  reports: VocabReportDto[];
  created_by: number;
  updated_by: number;
  version: number;
}

// 語彙関係 DTO / Vocabulary relation DTO for MultiSelect
export interface VocabRelationDto {
  id: number;
  kanji: string;
  hiragana?: string | null;
  level?: VocabLevel | null;
}

// 語彙変更ログ DTO / Vocabulary change log DTO
export interface VocabChangeLogDto {
  id: number;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: number;
  change_reason?: string | null;
  created_at: string;
}

// 語彙レポート DTO / Vocabulary report DTO
export interface VocabReportDto {
  id: number;
  report_text: string;
  status: VocabReportStatus;
  reported_by: number;
  resolved_by?: number | null;
  created_at: string;
}

// 語彙作成 DTO / Create vocabulary DTO
export interface CreateVocabularyDto {
  kanji: string;
  hiragana?: string | null;
  romaji?: string | null;
  meaning_vi: string;
  on_yomi?: string | null;
  level?: VocabLevel | null;
  media_url?: string | null;
  note?: string | null;
  tags?: string[];
  status?: VocabularyStatus;
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

// 語彙更新 DTO / Update vocabulary DTO
export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;

// 語彙フィルター / Vocabulary list filter parameters
export interface VocabularyFilters extends PaginationParams, SortParams {
  kanji?: string;
  level?: VocabLevel | null;
  status?: VocabularyStatus;
  tag?: string;
  created_by?: number;
}

// 分析データ / Analytics data
export interface AnalyticsData {
  learn_count: number;
  favorite_count: number;
  report_count: number;
  relation_count: number;
}

// ページネーション情報 / Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
