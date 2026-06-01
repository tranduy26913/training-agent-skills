// 学習サービス / FlashCard learning service — business logic layer
import { ServiceError } from '../../models/common.model';
import { logger } from '../../utils/logger.util';
import type {
  LevelStatsDto,
  LearnVocabularyItem,
  ToggleFavoriteResponse,
  UpdateProgressDto,
  LearnVocabFilter,
} from '../../models/learn.model';
import type { PaginatedResult } from '../../models/common.model';
import * as repo from './learn.repository';

/**
 * 学習サービスクラス / FlashCard learning service
 * Orchestrates repository calls and enforces business rules
 */
export class LearnService {
  /**
   * ユーザーのレベル別統計を取得 / Get learning stats for all JLPT levels for a user
   */
  async getLevelStats(userId: number): Promise<LevelStatsDto[]> {
    return repo.getLevelStats(userId);
  }

  /**
   * ユーザー進捗付き語彙一覧取得 / Get paginated vocabularies with user progress
   */
  async getVocabularies(
    userId: number,
    filter: LearnVocabFilter
  ): Promise<PaginatedResult<LearnVocabularyItem>> {
    const { data, total } = await repo.getVocabularies(userId, filter);
    const pages = Math.ceil(total / filter.limit) || 1;

    return {
      data,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total,
        pages,
      },
    };
  }

  /**
   * バッチ進捗更新 / Batch upsert progress and increment learn_count
   * Called at end of a flashcard session with all results
   */
  async batchUpdateProgress(userId: number, updates: UpdateProgressDto[]): Promise<number> {
    if (updates.length === 0) return 0;

    const count = await repo.batchUpsertProgress(userId, updates);
    const vocabularyIds = updates.map((u) => u.vocabulary_id);
    await repo.incrementLearnCount(vocabularyIds);

    logger.info(`[LEARN] user:${userId} batch updated ${count} words`);
    return count;
  }

  /**
   * お気に入りトグル / Toggle favorite for a vocabulary
   * Throws ServiceError(404) if vocabulary does not exist or is not published
   */
  async toggleFavorite(userId: number, vocabularyId: number): Promise<ToggleFavoriteResponse> {
    const isPublished = await repo.checkVocabularyPublished(vocabularyId);
    if (!isPublished) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    const result = await repo.toggleFavorite(userId, vocabularyId);
    logger.debug(`[LEARN] user:${userId} favorite vocab:${vocabularyId} = ${result.is_favorite}`);
    return result;
  }
}
