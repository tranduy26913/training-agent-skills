// 語彙モデル定義 / Vocabulary module models and types
import type { RowDataPacket } from 'mysql2/promise';

// JLPTレベル型 / JLPT level type
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// 語彙ステータス型 / Vocabulary status type
export type VocabularyStatus = 'publish' | 'hide' | 'deleted';

// 関係タイプ型 / Relation type
export type RelationType = 'related' | 'synonym' | 'antonym';

// レポートステータス型 / Report status type
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

// 監査アクション型 / Audit action type
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

// 語彙データ行 / Vocabulary database row
export interface VocabularyRow extends RowDataPacket {
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
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

// 語彙関係データ行 / Vocabulary relation database row
export interface VocabularyRelationRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  related_vocab_id: number;
  relation_type: RelationType;
}

// 語彙レポートデータ行 / Vocabulary report database row
export interface VocabularyReportRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  reporter_id: number;
  reason: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  reporter_name?: string;
  resolved_by_name?: string;
}

// 監査ログデータ行 / Vocabulary audit log database row
export interface VocabularyAuditLogRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  admin_id: number;
  action: AuditAction;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: string;
  admin_name?: string;
}

// アナリティクスデータ行 / Vocabulary analytics database row
export interface VocabularyAnalyticsRow extends RowDataPacket {
  vocab_id: number;
  learn_count: number;
  favorite_count: number;
}

// MultiSelect用シンプル行 / Simple projection row for MultiSelect
export interface VocabularySimpleRow extends RowDataPacket {
  id: number;
  kanji: string | null;
  hiragana: string;
  meaning_vi: string;
}

// 語彙フィルター / Vocabulary list filter parameters
export interface VocabularyFilters {
  search?: string;
  level?: string;
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 語彙作成DTO / Create vocabulary input DTO
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

// 語彙更新DTO / Update vocabulary input DTO
export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;
