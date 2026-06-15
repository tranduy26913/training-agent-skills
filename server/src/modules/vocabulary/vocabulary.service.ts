/**
 * Vocabulary Service
 * Business logic for vocabulary management
 * English and Japanese comments for clarity
 */

import { VocabularyRepository } from './vocabulary.repository';
import { ServiceError } from '../../models/common.model';
import type {
  VocabularyResponse,
  VocabularyFilter,
  PaginationParams,
  VocabularyListResponse,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyAnalytics,
  ResolveReportDto,
  VocabRelationDto,
  VocabChangeLogDto,
  VocabReportDto,
} from '../../models/vocabularies.model';
import { validateCreateVocabularyDto, validateUpdateVocabularyDto } from './vocabulary.validation';

// Re-export ServiceError for controller usage
export { ServiceError };

/**
 * Vocabulary Service Class
 * Handles business logic for vocabulary operations
 */
export class VocabularyService {
  private repository: VocabularyRepository;

  constructor(repository?: VocabularyRepository) {
    this.repository = repository || new VocabularyRepository();
  }

  /**
   * Get vocabularies with filters and pagination
   * フィルターとページネーション付きで語彙一覧を取得
   */
  async getVocabularies(
    filters: VocabularyFilter,
    pagination: PaginationParams
  ): Promise<VocabularyListResponse> {
    return await this.repository.findAllWithFilters(filters, pagination);
  }

  /**
   * Get vocabulary by ID with details
   * ID で語彙を詳細取得
   */
  async getVocabulary(id: number): Promise<{
    vocabulary: VocabularyResponse;
    relations: {
      related: VocabRelationDto[];
      synonyms: VocabRelationDto[];
      antonyms: VocabRelationDto[];
    };
    changeLogs: VocabChangeLogDto[];
    reports: VocabReportDto[];
  }> {
    const result = await this.repository.findByIdWithDetails(id);

    if (!result) {
      // Check if it's a soft-deleted vocabulary
      const vocab = await this.repository.findById(id);
      if (vocab && vocab.status === 'Delete') {
        throw new ServiceError('Vocabulary has been deleted', 404);
      }
      throw new ServiceError('Vocabulary not found', 404);
    }

    return {
      vocabulary: result.vocabulary!,
      relations: result.relations,
      changeLogs: result.changeLogs,
      reports: result.reports,
    };
  }

  /**
   * Create a new vocabulary
   * 新しい語彙を作成
   */
  async createVocabulary(data: CreateVocabularyDto, userId: number): Promise<{
    id: number;
    vocabulary: VocabularyResponse;
  }> {
    // Validate input
    const validatedData = validateCreateVocabularyDto(data);

    // Check for duplicate kanji + meaning_vi
    const isDuplicate = await this.repository.existsDuplicateKanjiMeaning(
      validatedData.kanji,
      validatedData.meaning_vi
    );

    if (isDuplicate) {
      throw new ServiceError('Vocabulary with this kanji and meaning already exists', 409);
    }

    // Create vocabulary
    const vocabId = await this.repository.create(validatedData, userId);

    // Get created vocabulary
    const result = await this.repository.findByIdWithDetails(vocabId);

    if (!result || !result.vocabulary) {
      throw new ServiceError('Failed to retrieve created vocabulary', 500);
    }

    return {
      id: vocabId,
      vocabulary: result.vocabulary,
    };
  }

  /**
   * Update vocabulary
   * 語彙を更新
   */
  async updateVocabulary(
    id: number,
    data: UpdateVocabularyDto,
    userId: number,
    changeReason?: string
  ): Promise<{
    vocabulary: VocabularyResponse;
    version: number;
  }> {
    // Validate input
    const validatedData = validateUpdateVocabularyDto(data);

    // Check if vocabulary exists and is not soft deleted
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    if (existing.status === 'Delete') {
      throw new ServiceError('Vocabulary has been deleted', 404);
    }

    // Check for duplicate kanji + meaning_vi (excluding current vocab)
    if (validatedData.kanji && validatedData.meaning_vi) {
      const isDuplicate = await this.repository.existsDuplicateKanjiMeaning(
        validatedData.kanji,
        validatedData.meaning_vi,
        id
      );

      if (isDuplicate) {
        throw new ServiceError('Vocabulary with this kanji and meaning already exists', 409);
      }
    }

    // Update vocabulary
    await this.repository.update(id, validatedData, userId, changeReason);

    // Get updated vocabulary
    const result = await this.repository.findByIdWithDetails(id);

    if (!result || !result.vocabulary) {
      throw new ServiceError('Failed to retrieve updated vocabulary', 500);
    }

    return {
      vocabulary: result.vocabulary,
      version: result.vocabulary.version,
    };
  }

  /**
   * Delete vocabulary (soft delete)
   * 語彙を削除（ソフト削除）
   */
  async deleteVocabulary(id: number, userId: number): Promise<{
    id: number;
    status: string;
  }> {
    // Check if vocabulary exists
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    // Soft delete
    await this.repository.softDelete(id, userId);

    return {
      id,
      status: 'Delete',
    };
  }

  /**
   * Get relation options for MultiSelect
   * MultiSelect 用の関連付けオプションを取得
   */
  async getRelationOptions(excludeIds?: number[]): Promise<VocabRelationDto[]> {
    return await this.repository.findRelationOptions(excludeIds);
  }

  /**
   * Resolve a vocabulary report
   * 語彙レポートを解決
   */
  async resolveReport(
    vocabId: number,
    reportId: number,
    data: ResolveReportDto,
    adminId: number
  ): Promise<{
    report: VocabReportDto;
  }> {
    // Validate report status
    if (data.status !== 'resolved' && data.status !== 'dismissed') {
      throw new ServiceError('Invalid report status', 400);
    }

    // Check if vocabulary exists
    const vocab = await this.repository.findById(vocabId);
    if (!vocab) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    // Resolve report
    const success = await this.repository.resolveReport(reportId, data.status, adminId);

    if (!success) {
      throw new ServiceError('Report not found', 404);
    }

    // Get updated report
    const result = await this.repository.findByIdWithDetails(vocabId);

    const report = result?.reports.find((r) => r.id === reportId);

    if (!report) {
      throw new ServiceError('Failed to retrieve updated report', 500);
    }

    return {
      report,
    };
  }

  /**
   * Get vocabulary analytics
   * 語彙の分析データを取得
   */
  async getAnalytics(id: number): Promise<VocabularyAnalytics> {
    const analytics = await this.repository.getAnalytics(id);

    if (!analytics) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    return analytics;
  }
}
