/**
 * Vocabulary Repository
 * Database operations for vocabulary management
 * English and Japanese comments for clarity
 */

import { BaseRepository } from '../../database/base.repository';
import { pool } from '../../database/connection';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import {
  VocabularyRow,
  VocabRelationRow,
  VocabChangeLogRow,
  VocabReportRow,
  VocabularyResponse,
  VocabRelationDto,
  VocabChangeLogDto,
  VocabReportDto,
  VocabularyFilter,
  PaginationParams,
  VocabularyListResponse,
  VocabularyStatus,
  VocabRelationType,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabLevel,
} from '../../models/vocabularies.model';

/**
 * Vocabulary Repository Class
 * Handles all database operations for vocabulary management
 */
export class VocabularyRepository extends BaseRepository<VocabularyRow> {
  constructor() {
    super('vocabularies');
  }

  /**
   * Find all vocabularies with dynamic filters and pagination
   * フィルターとページネーション付きで語彙一覧を取得
   */
  async findAllWithFilters(
    filters: VocabularyFilter,
    pagination: PaginationParams
  ): Promise<VocabularyListResponse> {
    const conditions: string[] = ["v.status != 'Delete'"];
    const params: unknown[] = [];

    // Add filter conditions
    if (filters.kanji) {
      conditions.push('v.kanji LIKE ?');
      params.push(`%${filters.kanji}%`);
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

    if (filters.createdBy) {
      conditions.push('v.created_by = ?');
      params.push(filters.createdBy);
    }

    const whereClause = conditions.length > 1 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Sort whitelist to prevent SQL injection
    const ALLOWED_SORT_FIELDS: Record<string, string> = {
      id: 'v.id',
      kanji: 'v.kanji',
      level: 'v.level',
      created_at: 'v.created_at',
      updated_at: 'v.updated_at',
    };
    const sortColumn = ALLOWED_SORT_FIELDS[pagination.sort || 'created_at'] || 'v.created_at';
    const sortDir = pagination.order === 'asc' ? 'ASC' : 'DESC';

    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100); // Max 100
    const offset = (page - 1) * limit;

    // Get vocabularies
    const [rows] = await pool.query<VocabularyRow[]>(
      `SELECT v.* FROM \`vocabularies\` v ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM \`vocabularies\` v ${whereClause}`,
      params
    );

    // Transform to response format with relations
    const items = await Promise.all(rows.map((row) => this.mapToResponse(row)));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find vocabulary by ID with relations, logs, and reports
   * ID で語彙を詳細取得（関連付け、ログ、レポートを含む）
   */
  async findByIdWithDetails(id: number): Promise<{
    vocabulary: VocabularyResponse | null;
    relations: {
      related: VocabRelationDto[];
      synonyms: VocabRelationDto[];
      antonyms: VocabRelationDto[];
    };
    changeLogs: VocabChangeLogDto[];
    reports: VocabReportDto[];
  } | null> {
    // Check if vocabulary exists and is not soft deleted
    const vocabulary = await this.findById(id);
    if (!vocabulary || vocabulary.status === VocabularyStatus.Delete) {
      return null;
    }

    // Get relations
    const [relationRows] = await pool.query<RowDataPacket[]>(
      `SELECT vr.*, v.kanji, v.hiragana, v.romaji, v.level
       FROM \`vocab_relations\` vr
       JOIN \`vocabularies\` v ON vr.target_vocab_id = v.id
       WHERE vr.vocab_id = ?`,
      [id]
    );

    const relations = {
      related: [] as VocabRelationDto[],
      synonyms: [] as VocabRelationDto[],
      antonyms: [] as VocabRelationDto[],
    };

    relationRows.forEach((row) => {
      const dto: VocabRelationDto = {
        id: row.target_vocab_id,
        kanji: row.kanji,
        hiragana: row.hiragana,
        romaji: row.romaji,
        level: row.level,
      };

      if (row.relation_type === VocabRelationType.Related) {
        relations.related.push(dto);
      } else if (row.relation_type === VocabRelationType.Synonym) {
        relations.synonyms.push(dto);
      } else if (row.relation_type === VocabRelationType.Antonym) {
        relations.antonyms.push(dto);
      }
    });

    // Get change logs
    const [logRows] = await pool.query<VocabChangeLogRow[]>(
      `SELECT * FROM \`vocab_change_logs\` WHERE vocab_id = ? ORDER BY created_at DESC`,
      [id]
    );

    const changeLogs = logRows.map((row) => ({
      id: row.id,
      field_name: row.field_name,
      old_value: row.old_value,
      new_value: row.new_value,
      changed_by: row.changed_by,
      change_reason: row.change_reason,
      created_at: row.created_at,
    }));

    // Get reports
    const [reportRows] = await pool.query<VocabReportRow[]>(
      `SELECT * FROM \`vocab_reports\` WHERE vocab_id = ? ORDER BY created_at DESC`,
      [id]
    );

    const reports = reportRows.map((row) => ({
      id: row.id,
      report_text: row.report_text,
      status: row.status,
      reported_by: row.reported_by,
      resolved_by: row.resolved_by,
      resolved_at: row.resolved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      vocabulary: await this.mapToResponse(vocabulary),
      relations,
      changeLogs,
      reports,
    };
  }

  /**
   * Create a new vocabulary with transaction
   * トランザクション付きで新しい語彙を作成
   */
  async create(data: CreateVocabularyDto, userId: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create vocabulary
      const vocabularyData = {
        kanji: data.kanji,
        hiragana: data.hiragana || null,
        romaji: data.romaji || null,
        meaning_vi: data.meaning_vi,
        on_yomi: data.on_yomi || null,
        level: data.level || null,
        media_url: data.media_url || null,
        note: data.note || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: data.status || VocabularyStatus.Publish,
        created_by: userId,
        updated_by: userId,
        version: 1,
      };

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO \`vocabularies\` 
         (\`kanji\`, \`hiragana\`, \`romaji\`, \`meaning_vi\`, \`on_yomi\`, \`level\`, 
          \`media_url\`, \`note\`, \`tags\`, \`status\`, \`created_by\`, \`updated_by\`, \`version\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vocabularyData.kanji,
          vocabularyData.hiragana,
          vocabularyData.romaji,
          vocabularyData.meaning_vi,
          vocabularyData.on_yomi,
          vocabularyData.level,
          vocabularyData.media_url,
          vocabularyData.note,
          vocabularyData.tags,
          vocabularyData.status,
          vocabularyData.created_by,
          vocabularyData.updated_by,
          vocabularyData.version,
        ]
      );

      const vocabId = result.insertId;

      // Create relations if provided
      if (data.relations) {
        await this.createRelations(connection, vocabId, data.relations);
      }

      await connection.commit();
      return vocabId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update vocabulary with transaction and change log
   * トランザクションと変更ログ付きで語彙を更新
   */
  async update(
    id: number,
    data: UpdateVocabularyDto,
    userId: number,
    changeReason?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current vocabulary
      const current = await this.findById(id);
      if (!current) {
        throw new Error('Vocabulary not found');
      }

      // Update vocabulary with version increment
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];

      if (data.kanji !== undefined) {
        updateFields.push('`kanji` = ?');
        updateValues.push(data.kanji);
      }
      if (data.hiragana !== undefined) {
        updateFields.push('`hiragana` = ?');
        updateValues.push(data.hiragana);
      }
      if (data.romaji !== undefined) {
        updateFields.push('`romaji` = ?');
        updateValues.push(data.romaji);
      }
      if (data.meaning_vi !== undefined) {
        updateFields.push('`meaning_vi` = ?');
        updateValues.push(data.meaning_vi);
      }
      if (data.on_yomi !== undefined) {
        updateFields.push('`on_yomi` = ?');
        updateValues.push(data.on_yomi);
      }
      if (data.level !== undefined) {
        updateFields.push('`level` = ?');
        updateValues.push(data.level);
      }
      if (data.media_url !== undefined) {
        updateFields.push('`media_url` = ?');
        updateValues.push(data.media_url);
      }
      if (data.note !== undefined) {
        updateFields.push('`note` = ?');
        updateValues.push(data.note);
      }
      if (data.tags !== undefined) {
        updateFields.push('`tags` = ?');
        updateValues.push(data.tags ? JSON.stringify(data.tags) : null);
      }
      if (data.status !== undefined) {
        updateFields.push('`status` = ?');
        updateValues.push(data.status);
      }

      // Always update updated_by and increment version
      updateFields.push('`updated_by` = ?');
      updateValues.push(userId);
      updateFields.push('`version` = version + 1');

      updateFields.push('`updated_at` = CURRENT_TIMESTAMP');

      const setClause = updateFields.join(', ');
      await connection.query(
        `UPDATE \`vocabularies\` SET ${setClause} WHERE id = ?`,
        [...updateValues, id]
      );

      // Create change logs for changed fields
      await this.createChangeLogs(connection, id, current, data, userId, changeReason);

      // Handle relations replacement
      if (data.relations) {
        // Delete existing relations
        await connection.query('DELETE FROM `vocab_relations` WHERE vocab_id = ?', [id]);
        // Create new relations
        await this.createRelations(connection, id, data.relations);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Soft delete vocabulary
   * 語彙をソフト削除（status を Delete に設定）
   */
  async softDelete(id: number, userId: number): Promise<void> {
    await pool.query(
      `UPDATE \`vocabularies\` SET status = 'Delete', updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId, id]
    );
  }

  /**
   * Find relation options for MultiSelect (exclude specified IDs)
   * MultiSelect 用の関連付けオプションを取得（指定された ID を除外）
   */
  async findRelationOptions(excludeIds: number[] = []): Promise<VocabRelationDto[]> {
    const conditions: string[] = ["v.status != 'Delete'"];
    const params: unknown[] = [];

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      conditions.push(`id NOT IN (${placeholders})`);
      params.push(...excludeIds);
    }

    const whereClause = conditions.join(' AND ');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, kanji, hiragana, romaji, level FROM \`vocabularies\` WHERE ${whereClause} ORDER BY kanji`,
      params
    );

    return rows.map((row) => ({
      id: row.id,
      kanji: row.kanji,
      hiragana: row.hiragana,
      romaji: row.romaji,
      level: row.level,
    }));
  }

  /**
   * Create change log entry
   * 変更ログエントリを作成
   */
  async createChangeLog(
    vocabId: number,
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: number,
    changeReason?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO \`vocab_change_logs\` 
       (\`vocab_id\`, \`field_name\`, \`old_value\`, \`new_value\`, \`changed_by\`, \`change_reason\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vocabId, fieldName, oldValue, newValue, changedBy, changeReason || null]
    );
  }

  /**
   * Resolve a vocabulary report
   * 語彙レポートを解決
   */
  async resolveReport(
    reportId: number,
    status: 'resolved' | 'dismissed',
    adminId: number
  ): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE \`vocab_reports\` 
       SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, adminId, reportId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Check for duplicate kanji + meaning_vi
   * 重複する kanji + meaning_vi をチェック
   */
  async existsDuplicateKanjiMeaning(kanji: string, meaningVi: string, excludeId?: number): Promise<boolean> {
    const conditions = ['kanji = ?', 'meaning_vi = ?', 'status != ?'];
    const params: unknown[] = [kanji, meaningVi, VocabularyStatus.Delete];

    if (excludeId) {
      conditions.push('id != ?');
      params.push(excludeId);
    }

    const whereClause = conditions.join(' AND ');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM \`vocabularies\` WHERE ${whereClause}`,
      params
    );

    return rows[0].count > 0;
  }

  /**
   * Get analytics for a vocabulary
   * 語彙の分析データを取得
   */
  async getAnalytics(id: number): Promise<{
    learnCount: number;
    favoriteCount: number;
    reportCount: number;
    relationCount: number;
  } | null> {
    const vocab = await this.findById(id);
    if (!vocab || vocab.status === VocabularyStatus.Delete) {
      return null;
    }

    // Get report count
    const [[{ reportCount }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as reportCount FROM \`vocab_reports\` WHERE vocab_id = ?`,
      [id]
    );

    // Get relation count
    const [[{ relationCount }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as relationCount FROM \`vocab_relations\` WHERE vocab_id = ?`,
      [id]
    );

    return {
      learnCount: vocab.learn_count,
      favoriteCount: vocab.favorite_count,
      reportCount,
      relationCount,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Map database row to VocabularyResponse
   * データベース行を VocabularyResponse にマッピング
   */
  private async mapToResponse(row: VocabularyRow): Promise<VocabularyResponse> {
    return {
      id: row.id,
      kanji: row.kanji,
      hiragana: row.hiragana,
      romaji: row.romaji,
      meaning_vi: row.meaning_vi,
      on_yomi: row.on_yomi,
      level: row.level,
      media_url: row.media_url,
      note: row.note,
      tags: row.tags,
      status: row.status,
      learn_count: row.learn_count,
      favorite_count: row.favorite_count,
      created_by: row.created_by,
      updated_by: row.updated_by,
      version: row.version,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Create relations for a vocabulary
   * 語彙の関連付けを作成
   */
  private async createRelations(
    connection: any,
    vocabId: number,
    relations: {
      related?: number[];
      synonyms?: number[];
      antonyms?: number[];
    }
  ): Promise<void> {
    const insertRelation = async (targetVocabId: number, relationType: VocabRelationType) => {
      // Prevent self-reference
      if (targetVocabId === vocabId) {
        throw new Error('Cannot create self-reference relation');
      }

      // Check if target vocabulary exists
      const [targetRows] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM \`vocabularies\` WHERE id = ? AND status != ?`,
        [targetVocabId, VocabularyStatus.Delete]
      );

      if (!targetRows[0]) {
        throw new Error(`Target vocabulary ${targetVocabId} not found`);
      }

      await connection.query(
        `INSERT INTO \`vocab_relations\` (\`vocab_id\`, \`target_vocab_id\`, \`relation_type\`)
         VALUES (?, ?, ?)`,
        [vocabId, targetVocabId, relationType]
      );
    };

    if (relations.related) {
      for (const targetId of relations.related) {
        await insertRelation(targetId, VocabRelationType.Related);
      }
    }

    if (relations.synonyms) {
      for (const targetId of relations.synonyms) {
        await insertRelation(targetId, VocabRelationType.Synonym);
      }
    }

    if (relations.antonyms) {
      for (const targetId of relations.antonyms) {
        await insertRelation(targetId, VocabRelationType.Antonym);
      }
    }
  }

  /**
   * Create change logs for changed fields
   * 変更されたフィールドのログを作成
   */
  private async createChangeLogs(
    connection: any,
    vocabId: number,
    oldData: VocabularyRow,
    newData: UpdateVocabularyDto,
    userId: number,
    changeReason?: string
  ): Promise<void> {
    const fieldsToLog: Array<{ field: string; oldVal: any; newVal: any }> = [];

    if (newData.kanji !== undefined && newData.kanji !== oldData.kanji) {
      fieldsToLog.push({ field: 'kanji', oldVal: oldData.kanji, newVal: newData.kanji });
    }
    if (newData.hiragana !== undefined && newData.hiragana !== oldData.hiragana) {
      fieldsToLog.push({ field: 'hiragana', oldVal: oldData.hiragana, newVal: newData.hiragana });
    }
    if (newData.romaji !== undefined && newData.romaji !== oldData.romaji) {
      fieldsToLog.push({ field: 'romaji', oldVal: oldData.romaji, newVal: newData.romaji });
    }
    if (newData.meaning_vi !== undefined && newData.meaning_vi !== oldData.meaning_vi) {
      fieldsToLog.push({ field: 'meaning_vi', oldVal: oldData.meaning_vi, newVal: newData.meaning_vi });
    }
    if (newData.on_yomi !== undefined && newData.on_yomi !== oldData.on_yomi) {
      fieldsToLog.push({ field: 'on_yomi', oldVal: oldData.on_yomi, newVal: newData.on_yomi });
    }
    if (newData.level !== undefined && newData.level !== oldData.level) {
      fieldsToLog.push({ field: 'level', oldVal: oldData.level, newVal: newData.level });
    }
    if (newData.media_url !== undefined && newData.media_url !== oldData.media_url) {
      fieldsToLog.push({ field: 'media_url', oldVal: oldData.media_url, newVal: newData.media_url });
    }
    if (newData.note !== undefined && newData.note !== oldData.note) {
      fieldsToLog.push({ field: 'note', oldVal: oldData.note, newVal: newData.note });
    }
    if (newData.tags !== undefined && JSON.stringify(newData.tags) !== JSON.stringify(oldData.tags)) {
      fieldsToLog.push({ field: 'tags', oldVal: JSON.stringify(oldData.tags), newVal: JSON.stringify(newData.tags) });
    }
    if (newData.status !== undefined && newData.status !== oldData.status) {
      fieldsToLog.push({ field: 'status', oldVal: oldData.status, newVal: newData.status });
    }

    for (const { field, oldVal, newVal } of fieldsToLog) {
      await connection.query(
        `INSERT INTO \`vocab_change_logs\` 
         (\`vocab_id\`, \`field_name\`, \`old_value\`, \`new_value\`, \`changed_by\`, \`change_reason\`)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [vocabId, field, oldVal, newVal, userId, changeReason || null]
      );
    }
  }
}
