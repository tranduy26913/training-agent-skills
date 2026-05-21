// 語彙サービス / Vocabulary business logic service
import { VocabulariesRepository } from './vocabularies.repository';
import { ServiceError } from '../../models/common.model';
import type {
  VocabularyRow,
  VocabularySimpleRow,
  VocabularyFilters,
  CreateVocabularyDto,
  UpdateVocabularyDto,
} from '../../models/vocabularies.model';
import type { PaginatedResult, ChangedFields } from '../../models/common.model';

// ServiceErrorを再エクスポート / Re-export ServiceError for controller usage
export { ServiceError };

// 語彙詳細レスポンス型 / Vocabulary detail response type
export interface VocabularyDetail extends VocabularyRow {
  relations: {
    related: VocabularySimpleRow[];
    synonym: VocabularySimpleRow[];
    antonym: VocabularySimpleRow[];
  };
  reports: import('../../models/vocabularies.model').VocabularyReportRow[];
  analytics: { learn_count: number; favorite_count: number };
}

/**
 * 語彙サービスクラス / Vocabulary service class
 * Handles all vocabulary management business logic
 */
export class VocabulariesService {
  private repository: VocabulariesRepository;

  constructor(repository?: VocabulariesRepository) {
    this.repository = repository || new VocabulariesRepository();
  }

  /**
   * 語彙一覧取得 / Get paginated vocabulary list with filters
   */
  async list(filters: VocabularyFilters): Promise<PaginatedResult<VocabularyRow>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const { data, total } = await this.repository.findAllWithFilters(filters);
    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * 語彙詳細取得 / Get vocabulary detail by ID including relations, reports, analytics
   */
  async getDetail(id: number): Promise<VocabularyDetail> {
    const vocab = await this.repository.findById(id);
    if (!vocab) throw new ServiceError('Vocabulary not found', 404);

    const [relations, reports, analytics] = await Promise.all([
      this.repository.findRelations(id),
      this.repository.findReports(id),
      this.repository.findAnalytics(id),
    ]);

    return { ...vocab, relations, reports, analytics };
  }

  /**
   * シンプル一覧取得 / Get lightweight vocabulary list for MultiSelect
   */
  async getSimpleList(): Promise<VocabularySimpleRow[]> {
    return this.repository.findAllSimple();
  }

  /**
   * 語彙作成 / Create a new vocabulary with relations
   */
  async create(dto: CreateVocabularyDto, adminId: number): Promise<VocabularyRow> {
    return this.repository.create(dto, adminId);
  }

  /**
   * 語彙更新 / Update vocabulary and compute changed fields for audit log
   */
  async update(id: number, dto: UpdateVocabularyDto, adminId: number): Promise<VocabularyRow> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);

    const changedFields = this._buildChangedFields(existing, dto);
    return this.repository.update(id, dto, adminId, changedFields);
  }

  /**
   * 語彙ソフトデリート / Soft delete a vocabulary
   */
  async softDelete(id: number, adminId: number): Promise<{ id: number }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ServiceError('Vocabulary not found', 404);

    await this.repository.softDelete(id, adminId);
    return { id };
  }

  /**
   * 監査ログ取得 / Get audit logs for a vocabulary
   */
  async getAuditLogs(
    vocabId: number,
  ): Promise<import('../../models/vocabularies.model').VocabularyAuditLogRow[]> {
    return this.repository.findAuditLogs(vocabId);
  }

  /**
   * レポート解決 / Resolve a pending vocabulary report
   */
  async resolveReport(
    reportId: number,
    adminId: number,
  ): Promise<import('../../models/vocabularies.model').VocabularyReportRow | null> {
    const report = await this.repository.findReport(reportId);
    if (!report) throw new ServiceError('Report not found', 404);
    if (report.status !== 'pending') {
      throw new ServiceError('Report already resolved', 409);
    }
    await this.repository.updateReport(reportId, 'resolved', adminId);
    return this.repository.findReport(reportId);
  }

  /**
   * レポート拒否 / Reject a pending vocabulary report
   */
  async rejectReport(
    reportId: number,
    adminId: number,
  ): Promise<import('../../models/vocabularies.model').VocabularyReportRow | null> {
    const report = await this.repository.findReport(reportId);
    if (!report) throw new ServiceError('Report not found', 404);
    if (report.status !== 'pending') {
      throw new ServiceError('Report already resolved', 409);
    }
    await this.repository.updateReport(reportId, 'rejected', adminId);
    return this.repository.findReport(reportId);
  }

  /**
   * 変更フィールド差分構築 / Build changed fields diff for audit log
   */
  _buildChangedFields(old: VocabularyRow, dto: UpdateVocabularyDto): ChangedFields {
    const fields: (keyof UpdateVocabularyDto)[] = [
      'meaning_vi',
      'hiragana',
      'romaji',
      'kanji',
      'sino_vietnamese',
      'level',
      'image_url',
      'note',
      'tags',
      'status',
    ];

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const field of fields) {
      if (dto[field] === undefined) continue;
      const oldVal = old[field as keyof VocabularyRow];
      const newVal = dto[field];
      // JSONフィールド比較 / Compare JSON fields as strings
      const oldStr = oldVal !== null ? JSON.stringify(oldVal) : null;
      const newStr = newVal !== null ? JSON.stringify(newVal) : null;
      if (oldStr !== newStr) {
        changes[field] = { old: oldVal, new: newVal };
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }
}
