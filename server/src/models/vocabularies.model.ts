// 語彙モデル定義 / Vocabulary module request/response models
import type { RowDataPacket } from 'mysql2/promise';
import type { PaginationParams, SortParams } from './common.model';

// JLPT語彙レベル / JLPT vocabulary level
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// 語彙ステータス / Vocabulary publish status
export type VocabularyStatus = 'publish' | 'hide' | 'delete';

// 関係タイプ / Vocabulary relationship type
export type RelationshipType = 'related' | 'synonym' | 'antonym';

// レポートステータス / Report status
export type ReportStatus = 'pending' | 'resolved';

// 語彙DBrow / Vocabulary database row
export interface VocabularyRow extends RowDataPacket {
  id: number;
  meaning_vi: string;
  hiragana: string | null;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  media_url: string | null;
  note: string | null;
  status: VocabularyStatus;
  learn_count: number;
  favorite_count: number;
  version: number;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

// MultiSelect用サマリ / Lightweight summary for MultiSelect options
export interface VocabSummary {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  meaning_vi: string;
}

// 語彙詳細（JOINデータ含む） / Vocabulary detail including joined data
export interface VocabularyDetail extends Omit<VocabularyRow, keyof RowDataPacket> {
  tags: string[];
  related_words: VocabSummary[];
  synonyms: VocabSummary[];
  antonyms: VocabSummary[];
  created_by_name: string;
  updated_by_name: string | null;
}

// 語彙作成DTO / Create vocabulary DTO
export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana?: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: VocabularyLevel;
  media_url?: string;
  note?: string;
  status: VocabularyStatus;
  tags?: string[];
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

// 語彙更新DTO / Update vocabulary DTO
export type UpdateVocabularyDto = CreateVocabularyDto;

// 語彙フィルター / Vocabulary list filter parameters
export interface VocabularyFilters extends PaginationParams, SortParams {
  search?: string;
  level?: VocabularyLevel;
  status?: VocabularyStatus;
  tag?: string;
}

// 変更ログrow / Change log database row
export interface VocabularyChangeLogRow extends RowDataPacket {
  id: number;
  vocabulary_id: number;
  changed_by: number;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: Date;
}

// レポートrow / Report database row
export interface VocabularyReportRow extends RowDataPacket {
  id: number;
  vocabulary_id: number;
  reported_by: number;
  reported_by_name: string;
  reason: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_by_name: string | null;
  resolved_at: Date | null;
  created_at: Date;
}
