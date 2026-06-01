// 学習コントローラー / FlashCard learning controller
import { Response } from 'express';
import { LearnService } from './learn.service';
import { sendSuccess, handleError } from '../../utils/response.util';
import type { AuthenticatedRequest } from '../../types/express.d';
import type { GetVocabulariesQuery } from './learn.validation';
import type { LearnVocabFilter } from '../../models/learn.model';

/**
 * 学習コントローラークラス / FlashCard learning controller
 * Handles HTTP requests for the /api/learn/* endpoints
 */
export class LearnController {
  private service: LearnService;

  constructor(service?: LearnService) {
    this.service = service ?? new LearnService();
  }

  /**
   * レベル統計取得 / Get level statistics for current user
   * GET /api/learn/stats
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await this.service.getLevelStats(userId);
      sendSuccess(res, { data: stats });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * 語彙一覧取得 / Get paginated vocabularies with user progress
   * GET /api/learn/vocabularies?level=N5&progress_status=all&page=1&limit=50
   */
  async getVocabularies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const query = req.query as unknown as GetVocabulariesQuery;

      const filter: LearnVocabFilter = {
        level: query.level,
        progressStatus: query.progress_status ?? 'all',
        page: query.page ?? 1,
        limit: query.limit ?? 50,
      };

      const result = await this.service.getVocabularies(userId, filter);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * バッチ進捗更新 / Batch update progress at end of flashcard session
   * POST /api/learn/progress/batch
   */
  async batchUpdateProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { updates } = req.body;
      const count = await this.service.batchUpdateProgress(userId, updates);
      sendSuccess(res, { updated: count });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * お気に入りトグル / Toggle favorite for a vocabulary
   * POST /api/learn/favorite/:vocabularyId
   */
  async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const vocabularyId = Number(req.params.vocabularyId);
      const result = await this.service.toggleFavorite(userId, vocabularyId);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }
}
