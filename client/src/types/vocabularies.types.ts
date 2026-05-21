// 語彙型定義 / Vocabulary module type definitions
import type { PaginationParams, SortParams, AuditAction, ChangedFields } from './api.types';

// 語彙レベル / JLPT vocabulary levels
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// 語彙ステータス / Vocabulary status
export type VocabularyStatus = 'publish' | 'hide' | 'deleted';

// 関係タイプ / Relation types
export type RelationType = 'related' | 'synonym' | 'antonym';

// レポートステータス / Report status
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

// 語彙エンティティ / Vocabulary entity
export interface Vocabulary {
  id: number;
  meaning_vi: string;
  hiragana: string;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  image_url: string | null;
  note: string | null;
  tags: string[] | null;
  status: VocabularyStatus;
  version: number;
  created_by: number | null;
  updated_by: number | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// 語彙シンプル型 (MultiSelect用) / Simple vocabulary for MultiSelect
export interface VocabularySimple {
  id: number;
  kanji: string | null;
  hiragana: string;
  meaning_vi: string;
}

// 関係エントリー / Vocabulary relation entry
export interface VocabularyRelation {
  id: number;
  vocab_id: number;
  related_vocab_id: number;
  relation_type: RelationType;
}

// 関係グループ / Grouped vocabulary relations
export interface VocabularyRelations {
  related: VocabularySimple[];
  synonym: VocabularySimple[];
  antonym: VocabularySimple[];
}

// レポート / Vocabulary user report
export interface VocabularyReport {
  id: number;
  vocab_id: number;
  user_id: number;
  content: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

// 監査ログ / Vocabulary audit log entry
export interface VocabularyAuditLog {
  id: number;
  vocab_id: number;
  admin_id: number;
  admin_name: string | null;
  action: AuditAction;
  changed_fields: ChangedFields;
  timestamp: string;
}

// アナリティクス / Vocabulary analytics
export interface VocabularyAnalytics {
  vocab_id: number;
  learn_count: number;
  favorite_count: number;
}

// 語彙詳細 / Vocabulary detail with relations, reports, analytics
export interface VocabularyDetail extends Vocabulary {
  relations: VocabularyRelations;
  reports: VocabularyReport[];
  analytics: VocabularyAnalytics | null;
}

// 語彙作成DTO / Create vocabulary DTO
export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: VocabularyLevel;
  image_url?: string;
  note?: string;
  tags?: string[];
  status: VocabularyStatus;
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

// 語彙更新DTO / Update vocabulary DTO (all optional)
export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;

// 語彙フィルター / Vocabulary list filters
export interface VocabularyFilters extends PaginationParams, SortParams {
  search?: string;
  level?: string;
  status?: string;
  tag?: string;
}
