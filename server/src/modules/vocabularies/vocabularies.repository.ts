// 語彙リポジトリ / Vocabulary repository — parameterized SQL queries
import { pool } from '../../database/connection';
import type {
  VocabularyRow,
  VocabularyDetail,
  VocabSummary,
  VocabularyFilters,
  VocabularyChangeLogRow,
  VocabularyReportRow,
  RelationshipType,
} from '../../models/vocabularies.model';
import type { CreateVocabularyInput } from './vocabularies.validation';

// ページネーション付き語彙一覧取得 / Find vocabularies with filters and pagination
export async function findVocabularies(
  filters: VocabularyFilters,
): Promise<{ data: VocabularyRow[]; total: number }> {
  const {
    search,
    level,
    status,
    tag,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  const pageSize = Math.min(Number(limit), 100);
  const offset = (Number(page) - 1) * pageSize;

  // 許可されたソートフィールド / Allowed sort fields (whitelist to prevent injection)
  const allowedSort = ['created_at', 'updated_at', 'meaning_vi', 'level'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = ['v.status != "delete"'];
  const params: any[] = [];

  if (search) {
    conditions.push('MATCH(v.meaning_vi, v.hiragana, v.romaji, v.kanji) AGAINST(? IN BOOLEAN MODE)');
    params.push(`${search}*`);
  }
  if (level) {
    conditions.push('v.level = ?');
    params.push(level);
  }
  if (status) {
    conditions.push('v.status = ?');
    params.push(status);
  }
  if (tag) {
    conditions.push('EXISTS (SELECT 1 FROM vocabulary_tags vt JOIN tags t ON vt.tag_id = t.id WHERE vt.vocabulary_id = v.id AND t.name = ?)');
    params.push(tag);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM vocabularies v ${where}`;
  const [countRows] = await pool.execute<any[]>(countSql, params);
  const total: number = countRows[0].total;

  const dataSql = `
    SELECT
      v.*,
      IFNULL(
        JSON_ARRAYAGG(DISTINCT t.name ORDER BY t.name),
        JSON_ARRAY()
      ) as tags
    FROM vocabularies v
    LEFT JOIN vocabulary_tags vt ON vt.vocabulary_id = v.id
    LEFT JOIN tags t ON t.id = vt.tag_id
    ${where}
    GROUP BY v.id
    ORDER BY v.${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...params, pageSize, offset];
  const [rows] = await pool.execute<VocabularyRow[]>(dataSql, dataParams);

  // JSON_ARRAYAGG文字列をパース / Parse tags JSON from DB
  const data = rows.map((row: any) => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) as string[] : ((row.tags as string[]) ?? []),
  }));

  return { data, total };
}

// IDで語彙詳細取得 / Find vocabulary detail by ID with relations
export async function findVocabularyById(id: number): Promise<VocabularyDetail | null> {
  const [rows] = await pool.execute<VocabularyRow[]>(
    'SELECT v.*, u1.name as created_by_name, u2.name as updated_by_name FROM vocabularies v LEFT JOIN users u1 ON u1.id = v.created_by LEFT JOIN users u2 ON u2.id = v.updated_by WHERE v.id = ?',
    [id],
  );

  if (rows.length === 0) return null;
  const row = rows[0];

  // タグ取得 / Fetch tags
  const [tagRows] = await pool.execute<any[]>(
    'SELECT t.name FROM tags t JOIN vocabulary_tags vt ON vt.tag_id = t.id WHERE vt.vocabulary_id = ? ORDER BY t.name',
    [id],
  );
  const tags = tagRows.map((r: any) => r.name as string);

  // 関係語取得ヘルパー / Fetch related vocabs by type
  const fetchRelated = async (type: RelationshipType): Promise<VocabSummary[]> => {
    const [relRows] = await pool.execute<any[]>(
      'SELECT v2.id, v2.kanji, v2.hiragana, v2.meaning_vi FROM vocabulary_relationships vr JOIN vocabularies v2 ON v2.id = vr.related_id WHERE vr.vocabulary_id = ? AND vr.type = ?',
      [id, type],
    );
    return relRows;
  };

  const [related_words, synonyms, antonyms] = await Promise.all([
    fetchRelated('related'),
    fetchRelated('synonym'),
    fetchRelated('antonym'),
  ]);

  return {
    ...(row as any),
    tags,
    related_words,
    synonyms,
    antonyms,
    created_by_name: (row as any).created_by_name,
    updated_by_name: (row as any).updated_by_name ?? null,
  };
}

// 語彙作成 / Insert a new vocabulary row
export async function insertVocabulary(
  data: CreateVocabularyInput,
  adminId: number,
): Promise<number> {
  const [result] = await pool.execute<any>(
    'INSERT INTO vocabularies (meaning_vi, hiragana, romaji, kanji, sino_vietnamese, level, media_url, note, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.meaning_vi,
      data.hiragana ?? null,
      data.romaji ?? null,
      data.kanji ?? null,
      data.sino_vietnamese ?? null,
      data.level,
      data.media_url || null,
      data.note ?? null,
      data.status,
      adminId,
      adminId,
    ],
  );
  return result.insertId;
}

// 語彙更新 / Update vocabulary scalar fields
export async function updateVocabularyRow(
  id: number,
  data: CreateVocabularyInput,
  adminId: number,
): Promise<void> {
  await pool.execute(
    'UPDATE vocabularies SET meaning_vi=?, hiragana=?, romaji=?, kanji=?, sino_vietnamese=?, level=?, media_url=?, note=?, status=?, updated_by=?, version=version+1 WHERE id=?',
    [
      data.meaning_vi,
      data.hiragana ?? null,
      data.romaji ?? null,
      data.kanji ?? null,
      data.sino_vietnamese ?? null,
      data.level,
      data.media_url || null,
      data.note ?? null,
      data.status,
      adminId,
      id,
    ],
  );
}

// 語彙軟削除 / Soft delete a vocabulary
export async function softDeleteVocabulary(id: number): Promise<void> {
  await pool.execute("UPDATE vocabularies SET status='delete' WHERE id=?", [id]);
}

// タグアップサート / Upsert tag by name, return tag id
export async function upsertTag(name: string): Promise<number> {
  await pool.execute('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
  const [rows] = await pool.execute<any[]>('SELECT id FROM tags WHERE name=?', [name]);
  return rows[0].id;
}

// 語彙タグ同期 / Sync vocabulary_tags (delete old, insert new)
export async function syncVocabularyTags(vocabId: number, tagNames: string[]): Promise<void> {
  await pool.execute('DELETE FROM vocabulary_tags WHERE vocabulary_id=?', [vocabId]);
  for (const name of tagNames) {
    const tagId = await upsertTag(name);
    await pool.execute(
      'INSERT IGNORE INTO vocabulary_tags (vocabulary_id, tag_id) VALUES (?, ?)',
      [vocabId, tagId],
    );
  }
}

// 語彙関係同期 / Sync vocabulary_relationships (delete old, insert new)
export async function syncRelationships(
  vocabId: number,
  type: RelationshipType,
  relatedIds: number[],
): Promise<void> {
  await pool.execute('DELETE FROM vocabulary_relationships WHERE vocabulary_id=? AND type=?', [vocabId, type]);
  for (const relId of relatedIds) {
    await pool.execute(
      'INSERT IGNORE INTO vocabulary_relationships (vocabulary_id, related_id, type) VALUES (?, ?, ?)',
      [vocabId, relId, type],
    );
  }
}

// 変更ログ挿入 / Insert a change log entry
export async function insertChangeLog(
  vocabId: number,
  changedBy: number,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
): Promise<void> {
  await pool.execute(
    'INSERT INTO vocabulary_change_logs (vocabulary_id, changed_by, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
    [vocabId, changedBy, fieldName, oldValue, newValue],
  );
}

// 変更ログ一覧取得 / Get change logs for a vocabulary
export async function findChangeLogs(vocabId: number): Promise<VocabularyChangeLogRow[]> {
  const [rows] = await pool.execute<VocabularyChangeLogRow[]>(
    'SELECT cl.*, u.name as changed_by_name FROM vocabulary_change_logs cl JOIN users u ON u.id = cl.changed_by WHERE cl.vocabulary_id = ? ORDER BY cl.changed_at DESC',
    [vocabId],
  );
  return rows;
}

// レポート一覧取得 / Get reports for a vocabulary
export async function findReports(
  vocabId: number,
  status?: string,
): Promise<VocabularyReportRow[]> {
  const params: unknown[] = [vocabId];
  let sql = `
    SELECT r.*, u1.name as reported_by_name, u2.name as resolved_by_name
    FROM vocabulary_reports r
    JOIN users u1 ON u1.id = r.reported_by
    LEFT JOIN users u2 ON u2.id = r.resolved_by
    WHERE r.vocabulary_id = ?
  `;
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';
  const [rows] = await pool.execute<VocabularyReportRow[]>(sql, params as any[]);
  return rows;
}

// レポートステータス更新 / Update report status
export async function updateReportStatus(
  reportId: number,
  status: 'resolved' | 'pending',
  resolvedBy: number | null,
): Promise<VocabularyReportRow | null> {
  if (status === 'resolved') {
    await pool.execute(
      "UPDATE vocabulary_reports SET status='resolved', resolved_by=?, resolved_at=NOW() WHERE id=?",
      [resolvedBy, reportId],
    );
  } else {
    await pool.execute(
      "UPDATE vocabulary_reports SET status='pending', resolved_by=NULL, resolved_at=NULL WHERE id=?",
      [reportId],
    );
  }
  const [rows] = await pool.execute<VocabularyReportRow[]>(
    'SELECT r.*, u1.name as reported_by_name, u2.name as resolved_by_name FROM vocabulary_reports r JOIN users u1 ON u1.id = r.reported_by LEFT JOIN users u2 ON u2.id = r.resolved_by WHERE r.id = ?',
    [reportId],
  );
  return rows[0] ?? null;
}

// レポート一件取得 / Find a single report by ID
export async function findReportById(reportId: number): Promise<VocabularyReportRow | null> {
  const [rows] = await pool.execute<VocabularyReportRow[]>(
    'SELECT r.*, u1.name as reported_by_name, u2.name as resolved_by_name FROM vocabulary_reports r JOIN users u1 ON u1.id = r.reported_by LEFT JOIN users u2 ON u2.id = r.resolved_by WHERE r.id = ?',
    [reportId],
  );
  return rows[0] ?? null;
}

// タグ提案 / Suggest tags by prefix (max 20)
export async function suggestTags(q: string): Promise<string[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT 20',
    [`${q}%`],
  );
  return rows.map((r: any) => r.name as string);
}

// 語彙検索（MultiSelect用）/ Search vocabularies for relationship selects (max 30)
export async function searchVocabularies(
  q: string,
  excludeIds: number[],
): Promise<VocabSummary[]> {
  const placeholders = excludeIds.length ? excludeIds.map(() => '?').join(',') : 'NULL';
  const params: any[] = [`${q}*`, ...excludeIds];
  const sql = `
    SELECT id, kanji, hiragana, meaning_vi
    FROM vocabularies
    WHERE MATCH(meaning_vi, hiragana, romaji, kanji) AGAINST(? IN BOOLEAN MODE)
      AND id NOT IN (${excludeIds.length ? placeholders : 'NULL'})
      AND status != 'delete'
    LIMIT 30
  `;
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows;
}
