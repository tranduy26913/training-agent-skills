// 学習モデル定義 / FlashCard learning module request/response models
import type { RowDataPacket } from 'mysql2/promise';
import type { VocabularyLevel } from './vocabularies.model';

// 学習進捗ステータス / User vocabulary learning progress status
export type ProgressStatus = 'new' | 'learning' | 'known';

// 進捗DBrow / User vocabulary progress database row
export interface UserVocabularyProgressRow extends RowDataPacket {
  user_id: number;
  vocabulary_id: number;
  status: ProgressStatus;
  review_count: number;
  last_reviewed: string | null;
  is_favorite: number; // 0 or 1 from MySQL TINYINT
  created_at: string;
  updated_at: string;
}

// ユーザー進捗DTO / User progress data transfer object
export interface UserProgressDto {
  status: ProgressStatus;
  review_count: number;
  last_reviewed: string | null;
  is_favorite: boolean;
}

// 学習語彙アイテム / Vocabulary item with user progress for learning
export interface LearnVocabularyItem {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  meaning_vi: string;
  level: VocabularyLevel;
  tags: string[];
  media_url: string | null;
  note: string | null;
  progress: UserProgressDto | null;
}

// レベル統計DTO / Level progress statistics
export interface LevelStatsDto {
  level: VocabularyLevel;
  total: number;
  known: number;
  learning: number;
  new_count: number;
}

// 進捗更新DTO / Single vocabulary progress update
export interface UpdateProgressDto {
  vocabulary_id: number;
  status: ProgressStatus;
}

// バッチ進捗更新DTO / Batch vocabulary progress update
export interface BatchUpdateProgressDto {
  updates: UpdateProgressDto[];
}

// お気に入りトグルレスポンス / Toggle favorite response
export interface ToggleFavoriteResponse {
  vocabulary_id: number;
  is_favorite: boolean;
}

// 学習フィルター / Vocabulary list filter for learning
export interface LearnVocabFilter {
  progressStatus: 'all' | ProgressStatus;
  page: number;
  limit: number;
}
