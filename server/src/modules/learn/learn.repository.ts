// 学習リポジトリ / FlashCard learning repository — parameterized SQL queries
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { pool } from '../../database/connection';
import type {
  LevelStatsDto,
  LearnVocabularyItem,
  ToggleFavoriteResponse,
  UpdateProgressDto,
} from '../../models/learn.model';
import type { VocabularyLevel } from '../../models/vocabularies.model';

// ==============================================================
// Level statistics query
// ==============================================================

/**
 * ユーザーのJLPTレベル別学習統計を取得 / Get user learning statistics per JLPT level
 */
export async function getLevelStats(userId: number): Promise<LevelStatsDto[]> {
  const levels: VocabularyLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       v.level,
       COUNT(DISTINCT v.id)                                                       AS total,
       SUM(CASE WHEN uvp.status = 'known'    THEN 1 ELSE 0 END)                  AS known,
       SUM(CASE WHEN uvp.status = 'learning' THEN 1 ELSE 0 END)                  AS learning
     FROM vocabularies v
     LEFT JOIN user_vocabulary_progress uvp
            ON uvp.vocabulary_id = v.id AND uvp.user_id = ?
     WHERE v.status = 'publish'
     GROUP BY v.level`,
    [userId]
  );

  // ゼロ埋めで全5レベルを返す / Return all 5 levels, filling missing with zeros
  return levels.map((level) => {
    const row = rows.find((r) => r.level === level);
    const total = row ? Number(row.total) : 0;
    const known = row ? Number(row.known) : 0;
    const learning = row ? Number(row.learning) : 0;
    return { level, total, known, learning, new_count: total - known - learning };
  });
}

// ==============================================================
// Vocabulary list with progress
// ==============================================================

/**
 * ユーザー進捗付き語彙一覧取得 / Get paginated vocabularies with user progress
 */
export async function getVocabularies(
  userId: number,
  filter: { level: VocabularyLevel; progressStatus: string; page: number; limit: number }
): Promise<{ data: LearnVocabularyItem[]; total: number }> {
  const { level, progressStatus, page, limit } = filter;
  const pageSize = Math.min(limit, 200);
  const offset = (page - 1) * pageSize;

  // 進捗フィルター条件 / Build progress status filter condition
  let progressCondition = '';
  const params: (string | number)[] = [userId, level];

  if (progressStatus === 'new') {
    progressCondition = 'AND (uvp.status = \'new\' OR uvp.status IS NULL)';
  } else if (progressStatus === 'learning' || progressStatus === 'known') {
    progressCondition = 'AND uvp.status = ?';
    params.push(progressStatus);
  }

  const countParams = [...params];
  const countSql = `
    SELECT COUNT(DISTINCT v.id) AS total
    FROM vocabularies v
    LEFT JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = ?
    WHERE v.status = 'publish' AND v.level = ? ${progressCondition}`;

  const dataSql = `
    SELECT
      v.id, v.kanji, v.hiragana, v.romaji, v.meaning_vi, v.level, v.media_url, v.note,
      uvp.status       AS progress_status,
      uvp.review_count AS progress_review_count,
      uvp.last_reviewed AS progress_last_reviewed,
      uvp.is_favorite  AS progress_is_favorite,
      GROUP_CONCAT(DISTINCT t.name SEPARATOR ',') AS tag_names
    FROM vocabularies v
    LEFT JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = ?
    LEFT JOIN vocabulary_tags vt ON vt.vocabulary_id = v.id
    LEFT JOIN tags t ON t.id = vt.tag_id
    WHERE v.status = 'publish' AND v.level = ? ${progressCondition}
    GROUP BY v.id
    ORDER BY v.id ASC
    LIMIT ? OFFSET ?`;

  const [countRows] = await pool.query<RowDataPacket[]>(countSql, countParams);
  const [dataRows] = await pool.query<RowDataPacket[]>(dataSql, [...params, pageSize, offset]);

  const total = Number(countRows[0]?.total ?? 0);
  const data: LearnVocabularyItem[] = dataRows.map((row) => ({
    id: row.id,
    kanji: row.kanji,
    hiragana: row.hiragana,
    romaji: row.romaji,
    meaning_vi: row.meaning_vi,
    level: row.level,
    tags: row.tag_names ? row.tag_names.split(',') : [],
    media_url: row.media_url,
    note: row.note,
    progress: row.progress_status
      ? {
          status: row.progress_status,
          review_count: row.progress_review_count,
          last_reviewed: row.progress_last_reviewed,
          is_favorite: Boolean(row.progress_is_favorite),
        }
      : null,
  }));

  return { data, total };
}

// ==============================================================
// Batch upsert progress
// ==============================================================

/**
 * バッチ進捗アップサートとlearn_count加算をトランザクションで実行
 * Batch upsert progress AND increment learn_count atomically in one transaction
 */
export async function batchUpsertProgressWithLearnCount(
  userId: number,
  updates: UpdateProgressDto[]
): Promise<number> {
  if (updates.length === 0) return 0;

  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // バルクINSERT / Bulk upsert progress records
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const values = updates.map((u) => [userId, u.vocabulary_id, u.status, 1, now]);

    await conn.query(
      `INSERT INTO user_vocabulary_progress
         (user_id, vocabulary_id, status, review_count, last_reviewed)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         status        = VALUES(status),
         review_count  = review_count + 1,
         last_reviewed = VALUES(last_reviewed),
         updated_at    = NOW()`,
      [values]
    );

    // learn_countを一括加算 / Increment learn_count for all vocabularies in batch
    const vocabularyIds = updates.map((u) => u.vocabulary_id);
    await conn.query(
      `UPDATE vocabularies SET learn_count = learn_count + 1 WHERE id IN (?)`,
      [vocabularyIds]
    );

    await conn.commit();
    return updates.length;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ==============================================================
// Toggle favorite
// ==============================================================

/**
 * 語彙が公開済みか確認 / Check if a vocabulary is published (accessible to users)
 */
export async function checkVocabularyPublished(vocabularyId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM vocabularies WHERE id = ? AND status = 'publish' LIMIT 1`,
    [vocabularyId]
  );
  return rows.length > 0;
}

/**
 * お気に入りのトグル / Toggle is_favorite for a user–vocabulary pair (upsert)
 */
export async function toggleFavorite(
  userId: number,
  vocabularyId: number
): Promise<ToggleFavoriteResponse> {
  // 現在の状態取得 / Get current is_favorite value
  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT is_favorite FROM user_vocabulary_progress WHERE user_id = ? AND vocabulary_id = ?`,
    [userId, vocabularyId]
  );

  const currentFavorite = existing.length > 0 ? Boolean(existing[0].is_favorite) : false;
  const newFavorite = !currentFavorite;

  await pool.query(
    `INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, status, is_favorite)
     VALUES (?, ?, 'new', ?)
     ON DUPLICATE KEY UPDATE
       is_favorite = ?,
       updated_at  = NOW()`,
    [userId, vocabularyId, newFavorite ? 1 : 0, newFavorite ? 1 : 0]
  );

  return { vocabulary_id: vocabularyId, is_favorite: newFavorite };
}
