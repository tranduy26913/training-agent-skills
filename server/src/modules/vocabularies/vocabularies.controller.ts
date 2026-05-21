// 語彙コントローラー / Vocabulary controller - handles all HTTP request/response
import { Response } from 'express';
import { VocabulariesService } from './vocabularies.service';
import { sendSuccess, handleError } from '../../utils/response.util';
import type { AuthenticatedRequest } from '../../types/express.d';

/**
 * 語彙コントローラークラス / Vocabulary controller class
 * Delegates all business logic to VocabulariesService
 */
export class VocabulariesController {
  private service: VocabulariesService;

  constructor(service?: VocabulariesService) {
    this.service = service || new VocabulariesService();
  }

  /**
   * 語彙一覧取得 / Get paginated vocabulary list
   * GET /api/vocabularies
   */
  async getVocabularies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        level: req.query.level as string | undefined,
        status: req.query.status as string | undefined,
        tag: req.query.tag as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };
      const result = await this.service.list(filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * シンプル一覧取得 / Get lightweight vocabulary list for MultiSelect
   * GET /api/vocabularies/list/simple
   */
  async getSimpleList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.service.getSimpleList();
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 語彙詳細取得 / Get vocabulary detail by ID
   * GET /api/vocabularies/:id
   */
  async getVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const vocab = await this.service.getDetail(id);
      sendSuccess(res, vocab);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 語彙作成 / Create a new vocabulary
   * POST /api/vocabularies
   */
  async createVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const vocab = await this.service.create(req.body, adminId);
      sendSuccess(res, vocab, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 語彙更新 / Update vocabulary
   * PUT /api/vocabularies/:id
   */
  async updateVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminId = req.user!.userId;
      const vocab = await this.service.update(id, req.body, adminId);
      sendSuccess(res, vocab);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 語彙ソフトデリート / Soft delete vocabulary
   * DELETE /api/vocabularies/:id
   */
  async deleteVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminId = req.user!.userId;
      const result = await this.service.softDelete(id, adminId);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 監査ログ取得 / Get audit logs for a vocabulary
   * GET /api/vocabularies/:id/audit-logs
   */
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const logs = await this.service.getAuditLogs(id);
      sendSuccess(res, logs);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * レポート解決 / Resolve a vocabulary report
   * PATCH /api/vocabularies/reports/:reportId/resolve
   */
  async resolveReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reportId = Number(req.params.reportId);
      const adminId = req.user!.userId;
      const report = await this.service.resolveReport(reportId, adminId);
      sendSuccess(res, report);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * レポート拒否 / Reject a vocabulary report
   * PATCH /api/vocabularies/reports/:reportId/reject
   */
  async rejectReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reportId = Number(req.params.reportId);
      const adminId = req.user!.userId;
      const report = await this.service.rejectReport(reportId, adminId);
      sendSuccess(res, report);
    } catch (error) {
      handleError(res, error);
    }
  }
}
