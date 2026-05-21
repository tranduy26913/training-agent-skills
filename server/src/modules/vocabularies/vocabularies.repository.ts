// 語彙リポジトリ / Vocabulary database access layer
import { BaseRepository } from '../../database/base.repository';
import { pool } from '../../database/connection';
import { withTransaction } from '../../database/transaction';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
  VocabularyRow,
  VocabularySimpleRow,
  VocabularyRelationRow,
  VocabularyReportRow,
  VocabularyAuditLogRow,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  RelationType,
  ReportStatus,
} from '../../models/vocabularies.model';
import type { ChangedFields } from '../../models/common.model';

// ソート列のホワイトリスト / Whitelist allowed sort columns to prevent SQL injection
const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: 'v.id',
  meaning_vi: 'v.meaning_vi',
  hiragana: 'v.hiragana',
  level: 'v.level',
  status: 'v.status',
  created_at: 'v.created_at',
  updated_at: 'v.updated_at',
};

/**
 * 語彙リポジトリクラス / Vocabulary repository — all DB operations
 * Handles CRUD, relations, audit logs, and reports for vocabulary management
 */
export class VocabulariesRepository extends BaseRepository<VocabularyRow> {
  constructor() {
    super('vocabularies');
  }

  /**
   * フィルター付き語彙一覧取得 / Find vocabularies with dynamic filters and pagination
   */
  async findAllWithFilters(
    filters: VocabularyFilters,
  ): Promise<{ data: VocabularyRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search) {
      conditions.push(
        '(v.meaning_vi LIKE ? OR v.kanji LIKE ? OR v.hiragana LIKE ? OR v.romaji LIKE ?)',
      );
      const like = `%${filters.search}%`;
      params.push(like, like, like, like);
    }

    if (filters.level) {
      conditions.push('v.level = ?');
      params.push(filters.level);
    }

    if (filters.status) {
      conditions.push('v.status = ?');
      params.push(filters.status);
    }

    if (filters.tag) {
      conditions.push('JSON_CONTAINS(v.tags, ?)');
      params.push(JSON.stringify(filters.tag));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const sortColumn = ALLOWED_SORT_FIELDS[filters.sortBy || ''] || 'v.created_at';
    const sortDir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [rows] = await pool.query<VocabularyRow[]>(
      `SELECT v.* FROM \`vocabularies\` v ${whereClause}
       ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM \`vocabularies\` v ${whereClause}`,
      params,
    );

    return { data: rows, total: total as number };
  }

  /**
   * IDで語彙詳細取得（関係・レポート・アナリティクス含む） /
   * Find vocabulary detail by ID including relations, reports, analytics
   */
  async findById(id: number): Promise<VocabularyRow | null> {
    const [rows] = await pool.query<VocabularyRow[]>(
      `SELECT v.*,
              uc.name AS created_by_name,
              uu.name AS updated_by_name
       FROM \`vocabularies\` v
       JOIN \`users\` uc ON v.created_by = uc.id
       JOIN \`users\` uu ON v.updated_by = uu.id
       WHERE v.id = ? LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * MultiSelect用シンプル一覧取得 / Get lightweight vocabulary list for MultiSelect
   */
  async findAllSimple(): Promise<VocabularySimpleRow[]> {
    const [rows] = await pool.query<VocabularySimpleRow[]>(
      `SELECT id, kanji, hiragana, meaning_vi
       FROM \`vocabularies\`
       WHERE status != 'deleted'
       ORDER BY hiragana ASC`,
    );
    return rows;
  }

  /**
   * 語彙の関係一覧取得 / Get all relations for a vocabulary grouped by type
   */
  async findRelations(vocabId: number): Promise<{
    related: VocabularySimpleRow[];
    synonym: VocabularySimpleRow[];
    antonym: VocabularySimpleRow[];
  }> {
    const [rows] = await pool.query<(VocabularyRelationRow & VocabularySimpleRow)[]>(
      `SELECT vr.relation_type, v.id, v.kanji, v.hiragana, v.meaning_vi
       FROM \`vocabulary_relations\` vr
       JOIN \`vocabularies\` v ON vr.related_vocab_id = v.id
       WHERE vr.vocab_id = ?`,
      [vocabId],
    );

    const result = { related: [] as VocabularySimpleRow[], synonym: [] as VocabularySimpleRow[], antonym: [] as VocabularySimpleRow[] };
    for (const row of rows) {
      const entry = { id: row.id, kanji: row.kanji, hiragana: row.hiragana, meaning_vi: row.meaning_vi } as VocabularySimpleRow;
      if (row.relation_type === 'related') result.related.push(entry);
      else if (row.relation_type === 'synonym') result.synonym.push(entry);
      else if (row.relation_type === 'antonym') result.antonym.push(entry);
    }
    return result;
  }

  /**
   * レポート一覧取得 / Get reports for a vocabulary
   */
  async findReports(vocabId: number): Promise<VocabularyReportRow[]> {
    const [rows] = await pool.query<VocabularyReportRow[]>(
      `SELECT vr.*,
              ur.name AS reporter_name,
              ua.name AS resolved_by_name
       FROM \`vocabulary_reports\` vr
       JOIN \`users\` ur ON vr.reporter_id = ur.id
       LEFT JOIN \`users\` ua ON vr.resolved_by = ua.id
       WHERE vr.vocab_id = ?
       ORDER BY vr.created_at DESC`,
      [vocabId],
    );
    return rows;
  }

  /**
   * 語彙レポート単件取得 / Find a single report by ID
   */
  async findReport(reportId: number): Promise<VocabularyReportRow | null> {
    const [rows] = await pool.query<VocabularyReportRow[]>(
      `SELECT * FROM \`vocabulary_reports\` WHERE id = ? LIMIT 1`,
      [reportId],
    );
    return rows[0] || null;
  }

  /**
   * レポートステータス更新 / Update report status (resolve or reject)
   */
  async updateReport(reportId: number, status: ReportStatus, adminId: number): Promise<void> {
    await pool.query(
      `UPDATE \`vocabulary_reports\`
       SET status = ?, resolved_by = ?, resolved_at = NOW()
       WHERE id = ?`,
      [status, adminId, reportId],
    );
  }

  /**
   * 監査ログ取得 / Get audit logs for a vocabulary with admin names
   */
  async findAuditLogs(vocabId: number): Promise<VocabularyAuditLogRow[]> {
    const [rows] = await pool.query<VocabularyAuditLogRow[]>(
      `SELECT val.*, u.name AS admin_name
       FROM \`vocabulary_audit_logs\` val
       JOIN \`users\` u ON val.admin_id = u.id
       WHERE val.vocab_id = ?
       ORDER BY val.timestamp DESC`,
      [vocabId],
    );
    return rows;
  }

  /**
   * 語彙作成（トランザクション） / Create vocabulary with relations and audit log in transaction
   */
  async create(dto: CreateVocabularyDto, adminId: number): Promise<VocabularyRow> {
    return withTransaction(async (conn) => {
      // 語彙挿入 / Insert vocabulary
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO \`vocabularies\`
         (meaning_vi, hiragana, romaji, kanji, sino_vietnamese, level,
          image_url, note, tags, status, version, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          dto.meaning_vi,
          dto.hiragana,
          dto.romaji ?? null,
          dto.kanji ?? null,
          dto.sino_vietnamese ?? null,
          dto.level,
          dto.image_url ?? null,
          dto.note ?? null,
          dto.tags ? JSON.stringify(dto.tags) : null,
          dto.status,
          adminId,
          adminId,
        ],
      );
      const vocabId = result.insertId;

      // アナリティクス行挿入 / Insert analytics row
      await conn.execute(
        `INSERT INTO \`vocabulary_analytics\` (vocab_id, learn_count, favorite_count) VALUES (?, 0, 0)`,
        [vocabId],
      );

      // 2方向関係挿入 / Insert bidirectional relations
      await this._insertRelationPairs(conn, vocabId, dto.related_ids || [], 'related');
      await this._insertRelationPairs(conn, vocabId, dto.synonym_ids || [], 'synonym');
      await this._insertRelationPairs(conn, vocabId, dto.antonym_ids || [], 'antonym');

      // 監査ログ挿入 / Insert audit log
      await conn.execute(
        `INSERT INTO \`vocabulary_audit_logs\` (vocab_id, admin_id, action, changed_fields)
         VALUES (?, ?, 'CREATE', NULL)`,
        [vocabId, adminId],
      );

      const [rows] = await conn.query<VocabularyRow[]>(
        `SELECT * FROM \`vocabularies\` WHERE id = ? LIMIT 1`,
        [vocabId],
      );
      return rows[0];
    });
  }

  /**
   * 語彙更新（トランザクション） / Update vocabulary with version bump, relations, and audit log
   */
  async update(
    id: number,
    dto: UpdateVocabularyDto,
    adminId: number,
    changedFields: ChangedFields,
  ): Promise<VocabularyRow> {
    return withTransaction(async (conn) => {
      // 語彙更新（バージョン加算） / Update vocabulary (increment version)
      await conn.execute(
        `UPDATE \`vocabularies\`
         SET meaning_vi = COALESCE(?, meaning_vi),
             hiragana   = COALESCE(?, hiragana),
             romaji     = ?,
             kanji      = ?,
             sino_vietnamese = ?,
             level      = COALESCE(?, level),
             image_url  = ?,
             note       = ?,
             tags       = ?,
             status     = COALESCE(?, status),
             version    = version + 1,
             updated_by = ?
         WHERE id = ?`,
        [
          dto.meaning_vi ?? null,
          dto.hiragana ?? null,
          dto.romaji !== undefined ? (dto.romaji ?? null) : undefined,
          dto.kanji !== undefined ? (dto.kanji ?? null) : undefined,
          dto.sino_vietnamese !== undefined ? (dto.sino_vietnamese ?? null) : undefined,
          dto.level ?? null,
          dto.image_url !== undefined ? (dto.image_url ?? null) : undefined,
          dto.note !== undefined ? (dto.note ?? null) : undefined,
          dto.tags !== undefined ? JSON.stringify(dto.tags) : undefined,
          dto.status ?? null,
          adminId,
          id,
        ],
      );

      // 関係更新（全削除＋再挿入） / Replace relations: delete all then re-insert
      const hasRelationUpdate =
        dto.related_ids !== undefined ||
        dto.synonym_ids !== undefined ||
        dto.antonym_ids !== undefined;

      if (hasRelationUpdate) {
        await conn.execute(
          `DELETE FROM \`vocabulary_relations\` WHERE vocab_id = ? OR related_vocab_id = ?`,
          [id, id],
        );
        await this._insertRelationPairs(conn, id, dto.related_ids || [], 'related');
        await this._insertRelationPairs(conn, id, dto.synonym_ids || [], 'synonym');
        await this._insertRelationPairs(conn, id, dto.antonym_ids || [], 'antonym');
      }

      // 監査ログ挿入 / Insert audit log with changed fields
      await conn.execute(
        `INSERT INTO \`vocabulary_audit_logs\` (vocab_id, admin_id, action, changed_fields)
         VALUES (?, ?, 'UPDATE', ?)`,
        [id, adminId, changedFields ? JSON.stringify(changedFields) : null],
      );

      const [rows] = await conn.query<VocabularyRow[]>(
        `SELECT * FROM \`vocabularies\` WHERE id = ? LIMIT 1`,
        [id],
      );
      return rows[0];
    });
  }

  /**
   * 語彙ソフトデリート / Soft delete: set status='deleted', version+1, audit log
   */
  async softDelete(id: number, adminId: number): Promise<void> {
    return withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE \`vocabularies\`
         SET status = 'deleted', version = version + 1, updated_by = ?
         WHERE id = ?`,
        [adminId, id],
      );
      await conn.execute(
        `INSERT INTO \`vocabulary_audit_logs\` (vocab_id, admin_id, action, changed_fields)
         VALUES (?, ?, 'DELETE', NULL)`,
        [id, adminId],
      );
    });
  }

  /**
   * アナリティクス取得 / Get analytics for a vocabulary
   */
  async findAnalytics(vocabId: number): Promise<{ learn_count: number; favorite_count: number }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT learn_count, favorite_count FROM \`vocabulary_analytics\` WHERE vocab_id = ? LIMIT 1`,
      [vocabId],
    );
    return rows[0] ? { learn_count: rows[0].learn_count, favorite_count: rows[0].favorite_count } : { learn_count: 0, favorite_count: 0 };
  }

  /**
   * 2方向関係挿入ヘルパー / Insert bidirectional relation pairs
   */
  async insertRelationPair(
    vocabId: number,
    relatedId: number,
    relationType: RelationType,
  ): Promise<void> {
    await pool.query(
      `INSERT IGNORE INTO \`vocabulary_relations\` (vocab_id, related_vocab_id, relation_type)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [vocabId, relatedId, relationType, relatedId, vocabId, relationType],
    );
  }

  /**
   * 接続内での2方向関係挿入 / Insert bidirectional pairs within a transaction connection
   */
  private async _insertRelationPairs(
    conn: import('mysql2/promise').PoolConnection,
    vocabId: number,
    relatedIds: number[],
    relationType: RelationType,
  ): Promise<void> {
    for (const relatedId of relatedIds) {
      await conn.execute(
        `INSERT IGNORE INTO \`vocabulary_relations\` (vocab_id, related_vocab_id, relation_type)
         VALUES (?, ?, ?), (?, ?, ?)`,
        [vocabId, relatedId, relationType, relatedId, vocabId, relationType],
      );
    }
  }
}
