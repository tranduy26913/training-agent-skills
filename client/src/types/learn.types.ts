// 学習機能 TypeScript型定義 / FlashCard learning feature type definitions

/** 学習進捗ステータス / Vocabulary learning progress status */
export type ProgressStatus = 'new' | 'learning' | 'known';

/** カードのフリップ方向 / FlashCard flip direction */
export type FlipDirection = 'kanji_to_meaning' | 'meaning_to_kanji';

/** JLPT語彙レベル / JLPT vocabulary level */
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

/** ユーザー進捗DTO / User vocabulary progress DTO from backend */
export interface UserProgressDto {
  status: ProgressStatus;
  review_count: number;
  last_reviewed: string | null;
  is_favorite: boolean;
}

/** 学習語彙アイテム / Vocabulary item with user progress included */
export interface LearnVocabularyItem {
  id: number;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meaning_vi: string;
  level: JlptLevel;
  tags: string[];
  media_url: string | null;
  note: string | null;
  progress: UserProgressDto | null;
}

/** レベル統計DTO / Per-level stats returned by backend */
export interface LevelStatsDto {
  level: JlptLevel;
  total: number;
  known: number;
  learning: number;
  new_count: number;
}

/** 進捗更新アイテム / Single progress update item */
export interface ProgressUpdateItem {
  vocabulary_id: number;
  status: ProgressStatus;
}

/** カード表示設定 / FlashCard display configuration */
export interface CardConfig {
  flipDirection: FlipDirection;
  frontFields: {
    kanji: boolean;
    hiragana: boolean;
    romaji: boolean;
    meaning_vi: boolean;
  };
  backFields: {
    kanji: boolean;
    hiragana: boolean;
    romaji: boolean;
    meaning_vi: boolean;
  };
}

/** セッション結果サマリー / Session result summary */
export interface SessionResults {
  knownCount: number;
  unknownCount: number;
  newFavoriteCount: number;
}

/** お気に入りトグルレスポンス / Toggle favorite response */
export interface ToggleFavoriteResponse {
  vocabulary_id: number;
  is_favorite: boolean;
}

/** 語彙一覧フィルター / Query filter for GET /api/learn/vocabularies */
export interface LearnVocabFilter {
  level: JlptLevel;
  progress_status?: 'all' | ProgressStatus;
  page?: number;
  limit?: number;
}

/** レベル統計APIレスポンス / API response for GET /api/learn/stats */
export interface LevelStatsResponse {
  data: LevelStatsDto[];
}
