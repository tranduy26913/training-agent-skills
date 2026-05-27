// 語彙サービス / Vocabulary business logic service
import { ServiceError } from '../../models/common.model';
import { logger } from '../../utils/logger.util';
import type { VocabularyDetail, VocabSummary, VocabularyChangeLogRow, VocabularyReportRow, VocabularyFilters } from '../../models/vocabularies.model';
import type { PaginatedResult } from '../../models/common.model';
import type { CreateVocabularyInput } from './vocabularies.validation';
import * as repo from './vocabularies.repository';

// スカラーフィールド差分生成 / Scalar fields to track in change log
const TRACKED_FIELDS: (keyof CreateVocabularyInput)[] = [
  'meaning_vi', 'hiragana', 'romaji', 'kanji', 'sino_vietnamese',
  'level', 'media_url', 'note', 'status',
];

// 自己参照チェック / Validate no self-reference in relationship IDs
function checkSelfReference(selfId: number | null, dto: CreateVocabularyInput): void {
  if (!selfId) return;
  const allRelated = [
    ...(dto.related_ids ?? []),
    ...(dto.synonym_ids ?? []),
    ...(dto.antonym_ids ?? []),
  ];
  if (allRelated.includes(selfId)) {
    throw new ServiceError('A vocabulary cannot reference itself', 400);
  }
}

// 語彙サービス / Vocabulary service class
export class VocabulariesService {
  // 語彙一覧取得 / Get paginated list
  async getList(filters: VocabularyFilters): Promise<PaginatedResult<any>> {
    const { data, total } = await repo.findVocabularies(filters);
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // 語彙詳細取得 / Get one vocabulary by id
  async getById(id: number): Promise<VocabularyDetail> {
    const vocab = await repo.findVocabularyById(id);
    if (!vocab) throw new ServiceError('Vocabulary not found', 404);
    return vocab;
  }

  // 語彙作成 / Create vocabulary with tags and relationships
  async create(dto: CreateVocabularyInput, adminId: number): Promise<VocabularyDetail> {
    // 自己参照は作成後のIDでしか検証できないため、ここでは基本バリデーションのみ
    // Self-reference check is done via service after insert (for create, id is new)
    const id = await repo.insertVocabulary(dto, adminId);

    // 作成後に自己参照チェック / Check self-reference after getting new id
    checkSelfReference(id, dto);

    await repo.syncVocabularyTags(id, dto.tags ?? []);
    await repo.syncRelationships(id, 'related', dto.related_ids ?? []);
    await repo.syncRelationships(id, 'synonym', dto.synonym_ids ?? []);
    await repo.syncRelationships(id, 'antonym', dto.antonym_ids ?? []);

    logger.info({ action: 'VOCAB_CREATE', vocabId: id, adminId });
    const detail = await repo.findVocabularyById(id);
    return detail!;
  }

  // 語彙更新 / Update vocabulary with diff-based change log
  async update(id: number, dto: CreateVocabularyInput, adminId: number): Promise<VocabularyDetail> {
    const existing = await repo.findVocabularyById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);

    // 自己参照チェック / Self-reference check
    checkSelfReference(id, dto);

    // 変更フィールドをチェックしてログ挿入 / Diff and insert change logs
    const changedFields: string[] = [];
    for (const field of TRACKED_FIELDS) {
      const oldVal = String(existing[field as keyof typeof existing] ?? '');
      const newVal = String(dto[field] ?? '');
      if (oldVal !== newVal) {
        await repo.insertChangeLog(id, adminId, field, oldVal || null, newVal || null);
        changedFields.push(field);
      }
    }

    await repo.updateVocabularyRow(id, dto, adminId);
    await repo.syncVocabularyTags(id, dto.tags ?? []);
    await repo.syncRelationships(id, 'related', dto.related_ids ?? []);
    await repo.syncRelationships(id, 'synonym', dto.synonym_ids ?? []);
    await repo.syncRelationships(id, 'antonym', dto.antonym_ids ?? []);

    logger.info({ action: 'VOCAB_UPDATE', vocabId: id, adminId, changedFields });
    const detail = await repo.findVocabularyById(id);
    return detail!;
  }

  // 語彙軟削除 / Soft delete vocabulary
  async delete(id: number, adminId: number): Promise<void> {
    const existing = await repo.findVocabularyById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);
    await repo.softDeleteVocabulary(id);
    logger.info({ action: 'VOCAB_DELETE', vocabId: id, adminId });
  }

  // 変更ログ一覧 / Get change logs for a vocabulary
  async getChangeLogs(id: number): Promise<VocabularyChangeLogRow[]> {
    const existing = await repo.findVocabularyById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);
    return repo.findChangeLogs(id);
  }

  // レポート一覧 / Get reports for a vocabulary
  async getReports(id: number, status?: string): Promise<VocabularyReportRow[]> {
    const existing = await repo.findVocabularyById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);
    return repo.findReports(id, status);
  }

  // レポートステータス更新 / Update report status
  async updateReportStatus(
    vocabId: number,
    reportId: number,
    status: 'resolved' | 'pending',
    adminId: number,
  ): Promise<VocabularyReportRow> {
    const existing = await repo.findReportById(reportId);
    if (!existing || existing.vocabulary_id !== vocabId) {
      throw new ServiceError('Report not found', 404);
    }
    const updated = await repo.updateReportStatus(reportId, status, status === 'resolved' ? adminId : null);
    if (!updated) throw new ServiceError('Report not found', 404);
    logger.info({ action: 'REPORT_RESOLVE', vocabId, reportId, adminId });
    return updated;
  }

  // タグ提案 / Suggest tags by prefix
  async suggestTags(q: string): Promise<string[]> {
    return repo.suggestTags(q);
  }

  // 語彙検索（MultiSelect用）/ Search vocabularies for relationship selects
  async searchVocabularies(q: string, excludeId?: number): Promise<VocabSummary[]> {
    const excludeIds = excludeId ? [excludeId] : [];
    return repo.searchVocabularies(q, excludeIds);
  }
}
