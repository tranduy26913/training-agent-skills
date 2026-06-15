/**
 * Vocabulary Controller
 * HTTP request handlers for vocabulary management
 * English and Japanese comments for clarity
 */

import { Response } from 'express';
import { VocabularyService } from './vocabulary.service';
import { sendSuccess, handleError } from '../../utils/response.util';
import type { AuthenticatedRequest } from '../../types/express.d';
import type { VocabularyFilter, PaginationParams, ResolveReportDto } from '../../models/vocabularies.model';
import { validateVocabularyFilter, validateResolveReportDto } from './vocabulary.validation';

const vocabularyService = new VocabularyService();

/**
 * Vocabulary Controller Class
 * Handles HTTP requests for vocabulary operations
 */
export class VocabularyController {
  /**
   * Get all vocabularies with filters and pagination
   * GET /api/vocabularies
   * 語彙一覧を取得
   */
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const filterData = validateVocabularyFilter(req.query);

      const filters: VocabularyFilter = {
        kanji: filterData.kanji,
        level: filterData.level,
        status: filterData.status,
        tag: filterData.tag,
        createdBy: filterData.createdBy,
      };

      const pagination: PaginationParams = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sort: req.query.sort as string | undefined,
        order: (req.query.order as 'asc' | 'desc') || 'desc',
      };

      const result = await vocabularyService.getVocabularies(filters, pagination);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get vocabulary by ID with details
   * GET /api/vocabularies/:id
   * ID で語彙を詳細取得
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const result = await vocabularyService.getVocabulary(id);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Create a new vocabulary
   * POST /api/vocabularies
   * 新しい語彙を作成
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const result = await vocabularyService.createVocabulary(data, userId);
      sendSuccess(res, result, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Update vocabulary
   * PUT /api/vocabularies/:id
   * 語彙を更新
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.userId;
      const data = req.body;
      const changeReason = req.body.changeReason as string | undefined;

      const result = await vocabularyService.updateVocabulary(id, data, userId, changeReason);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Delete vocabulary (soft delete)
   * DELETE /api/vocabularies/:id
   * 語彙を削除
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.userId;

      const result = await vocabularyService.deleteVocabulary(id, userId);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Resolve a vocabulary report
   * PATCH /api/vocabularies/:id/reports/:reportId
   * 語彙レポートを解決
   */
  async resolveReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vocabId = Number(req.params.id);
      const reportId = Number(req.params.reportId);
      const adminId = req.user!.userId;
      const data: ResolveReportDto = req.body;

      // Validate report status
      const validatedData = validateResolveReportDto(data);

      const result = await vocabularyService.resolveReport(vocabId, reportId, validatedData, adminId);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get vocabulary analytics
   * GET /api/vocabularies/:id/analytics
   * 語彙の分析データを取得
   */
  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const result = await vocabularyService.getAnalytics(id);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get relation options for MultiSelect
   * GET /api/vocabularies/relations/options
   * MultiSelect 用の関連付けオプションを取得
   */
  async getRelationOptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const excludeIdsParam = req.query.excludeIds as string | undefined;
      const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').map((id) => Number(id.trim())) : undefined;

      const result = await vocabularyService.getRelationOptions(excludeIds);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }
}
