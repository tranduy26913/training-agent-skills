/**
 * Vocabulary Management - TypeScript Types
 * Types and interfaces for vocabulary management system
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Vocabulary status enum
 * @enum {string}
 */
export enum VocabularyStatus {
  Publish = 'Publish',
  Hide = 'Hide',
  Delete = 'Delete'
}

/**
 * JLPT level enum
 * @enum {string}
 */
export enum VocabLevel {
  N5 = 'N5',
  N4 = 'N4',
  N3 = 'N3',
  N2 = 'N2',
  N1 = 'N1'
}

/**
 * Vocabulary relation type enum
 * @enum {string}
 */
export enum VocabRelationType {
  Related = 'related',
  Synonym = 'synonym',
  Antonym = 'antonym'
}

/**
 * Vocabulary report status enum
 * @enum {string}
 */
export enum VocabReportStatus {
  Pending = 'pending',
  Resolved = 'resolved',
  Dismissed = 'dismissed'
}

// ============================================================================
// Database Row Types (matching database schema)
// ============================================================================

/**
 * Vocabulary table row
 * Represents a complete row from the vocabularies table
 */
export interface VocabularyRow {
  id: number;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaning_vi: string;
  on_yomi: string | null;
  level: VocabLevel | null;
  media_url: string | null;
  note: string | null;
  tags: string[] | null;
  status: VocabularyStatus;
  learn_count: number;
  favorite_count: number;
  created_by: number | null;
  updated_by: number | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Vocabulary relation table row
 * Represents a relationship between two vocabulary items
 */
export interface VocabRelationRow {
  id: number;
  vocab_id: number;
  target_vocab_id: number;
  relation_type: VocabRelationType;
  created_at: Date;
}

/**
 * Vocabulary change log table row
 * Tracks changes made to vocabulary items
 */
export interface VocabChangeLogRow {
  id: number;
  vocab_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: number;
  change_reason: string | null;
  created_at: Date;
}

/**
 * Vocabulary report table row
 * User reports for vocabulary items
 */
export interface VocabReportRow {
  id: number;
  vocab_id: number;
  report_text: string;
  status: VocabReportStatus;
  reported_by: number;
  resolved_by: number | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// DTO Types (Data Transfer Objects)
// ============================================================================

/**
 * DTO for creating a new vocabulary item
 * Used in POST /api/vocabularies
 */
export interface CreateVocabularyDto {
  kanji: string;
  hiragana?: string;
  romaji?: string;
  meaning_vi: string;
  on_yomi?: string;
  level?: VocabLevel;
  media_url?: string;
  note?: string;
  tags?: string[];
  status?: VocabularyStatus;
  relations?: {
    related?: number[];
    synonyms?: number[];
    antonyms?: number[];
  };
}

/**
 * DTO for updating an existing vocabulary item
 * All fields are optional (partial update)
 * Used in PUT /api/vocabularies/:id
 */
export interface UpdateVocabularyDto {
  kanji?: string;
  hiragana?: string;
  romaji?: string;
  meaning_vi?: string;
  on_yomi?: string;
  level?: VocabLevel;
  media_url?: string;
  note?: string;
  tags?: string[];
  status?: VocabularyStatus;
  relations?: {
    related?: number[];
    synonyms?: number[];
    antonyms?: number[];
  };
}

/**
 * Vocabulary relation DTO
 * Used in responses to display related vocabulary
 */
export interface VocabRelationDto {
  id: number;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  level: VocabLevel | null;
}

/**
 * Vocabulary change log DTO
 * Used in responses to display change history
 */
export interface VocabChangeLogDto {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: number;
  change_reason: string | null;
  created_at: Date;
}

/**
 * Vocabulary report DTO
 * Used in responses to display reports
 */
export interface VocabReportDto {
  id: number;
  report_text: string;
  status: VocabReportStatus;
  reported_by: number;
  resolved_by: number | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Complete vocabulary response
 * Includes vocabulary data with all relations
 */
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
  tags: string[] | null;
  status: VocabularyStatus;
  learn_count: number;
  favorite_count: number;
  created_by: number | null;
  updated_by: number | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  relations?: {
    related: VocabRelationDto[];
    synonyms: VocabRelationDto[];
    antonyms: VocabRelationDto[];
  };
}

// ============================================================================
// Filter Types (for query parameters)
// ============================================================================

/**
 * Filter options for vocabulary list queries
 * Used in GET /api/vocabularies
 */
export interface VocabularyFilter {
  kanji?: string;
  level?: VocabLevel;
  status?: VocabularyStatus;
  tag?: string;
  createdBy?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Pagination response
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * List response with pagination
 */
export interface VocabularyListResponse {
  items: VocabularyResponse[];
  pagination: PaginationResponse;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Vocabulary analytics data
 */
export interface VocabularyAnalytics {
  learnCount: number;
  favoriteCount: number;
  reportCount: number;
  relationCount: number;
}

// ============================================================================
// Report Resolution DTO
// ============================================================================

/**
 * DTO for resolving a vocabulary report
 * Used in PATCH /api/vocabularies/:id/reports/:reportId
 */
export interface ResolveReportDto {
  status: 'resolved' | 'dismissed';
}
