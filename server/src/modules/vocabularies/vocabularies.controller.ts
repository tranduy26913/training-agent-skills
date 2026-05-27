// 語彙コントローラー / Vocabulary controller
import { Response } from 'express';
import { VocabulariesService } from './vocabularies.service';
import { sendSuccess, handleError } from '../../utils/response.util';
import type { AuthenticatedRequest } from '../../types/express.d';

// 語彙コントローラークラス / Vocabulary controller class
export class VocabulariesController {
  private service: VocabulariesService;

  constructor(service?: VocabulariesService) {
    this.service = service ?? new VocabulariesService();
  }

  // 語彙一覧取得 / Get paginated vocabulary list
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
      const result = await this.service.getList(filters as any);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 語彙詳細取得 / Get vocabulary detail by ID
  async getVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const vocab = await this.service.getById(id);
      sendSuccess(res, vocab);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 語彙作成 / Create a new vocabulary
  async createVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const vocab = await this.service.create(req.body, adminId);
      sendSuccess(res, vocab, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 語彙更新 / Update an existing vocabulary
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

  // 語彙軟削除 / Soft delete a vocabulary
  async deleteVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminId = req.user!.userId;
      await this.service.delete(id, adminId);
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  }

  // 変更ログ一覧取得 / Get change logs for a vocabulary
  async getChangeLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const logs = await this.service.getChangeLogs(id);
      sendSuccess(res, { data: logs });
    } catch (error) {
      handleError(res, error);
    }
  }

  // レポート一覧取得 / Get reports for a vocabulary
  async getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.query.status as string | undefined;
      const reports = await this.service.getReports(id, status);
      sendSuccess(res, { data: reports });
    } catch (error) {
      handleError(res, error);
    }
  }

  // レポートステータス更新 / Update report status
  async updateReportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vocabId = Number(req.params.id);
      const reportId = Number(req.params.reportId);
      const adminId = req.user!.userId;
      const { status } = req.body as { status: 'resolved' | 'pending' };
      const updated = await this.service.updateReportStatus(vocabId, reportId, status, adminId);
      sendSuccess(res, updated);
    } catch (error) {
      handleError(res, error);
    }
  }

  // タグ提案 / Suggest tags by prefix (public endpoint)
  async suggestTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      if (!q) {
        sendSuccess(res, { data: [] });
        return;
      }
      const tags = await this.service.suggestTags(q);
      sendSuccess(res, { data: tags });
    } catch (error) {
      handleError(res, error);
    }
  }

  // 語彙検索 / Search vocabularies for relationship selects
  async searchVocabularies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const excludeId = req.query.exclude ? Number(req.query.exclude) : undefined;
      if (!q) {
        sendSuccess(res, { data: [] });
        return;
      }
      const results = await this.service.searchVocabularies(q, excludeId);
      sendSuccess(res, { data: results });
    } catch (error) {
      handleError(res, error);
    }
  }
}
