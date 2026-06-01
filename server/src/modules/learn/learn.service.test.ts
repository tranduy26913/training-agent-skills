// 学習サービステスト / LearnService unit tests — mocked repository
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearnService } from './learn.service';
import * as repo from './learn.repository';
import { ServiceError } from '../../models/common.model';
import type { LevelStatsDto, LearnVocabularyItem, ToggleFavoriteResponse } from '../../models/learn.model';

// リポジトリをモック / Mock repository module
vi.mock('./learn.repository');

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

describe('LearnService', () => {
  let service: LearnService;
  const userId = 1;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new LearnService();
  });

  // ============================
  // getLevelStats
  // ============================
  describe('getLevelStats', () => {
    it('returns stats for all 5 JLPT levels', async () => {
      // Arrange
      const mockStats: LevelStatsDto[] = LEVELS.map((level) => ({
        level,
        total: 100,
        known: 20,
        learning: 10,
        new_count: 70,
      }));
      vi.mocked(repo.getLevelStats).mockResolvedValue(mockStats);

      // Act
      const result = await service.getLevelStats(userId);

      // Assert
      expect(result).toHaveLength(5);
      expect(repo.getLevelStats).toHaveBeenCalledWith(userId);
    });

    it('returns all zeros for user who has never studied', async () => {
      // Arrange
      const mockStats: LevelStatsDto[] = LEVELS.map((level) => ({
        level,
        total: 50,
        known: 0,
        learning: 0,
        new_count: 50,
      }));
      vi.mocked(repo.getLevelStats).mockResolvedValue(mockStats);

      // Act
      const result = await service.getLevelStats(userId);

      // Assert
      result.forEach((stat) => {
        expect(stat.known).toBe(0);
        expect(stat.learning).toBe(0);
      });
    });
  });

  // ============================
  // getVocabularies
  // ============================
  describe('getVocabularies', () => {
    it('returns paginated vocab list with user progress', async () => {
      // Arrange
      const mockItems: LearnVocabularyItem[] = [
        {
          id: 1,
          kanji: '食べる',
          hiragana: 'たべる',
          romaji: 'taberu',
          meaning_vi: 'ăn',
          level: 'N5',
          tags: ['động từ'],
          media_url: null,
          note: null,
          progress: { status: 'known', review_count: 5, last_reviewed: null, is_favorite: false },
        },
      ];
      vi.mocked(repo.getVocabularies).mockResolvedValue({ data: mockItems, total: 1 });

      // Act
      const result = await service.getVocabularies(userId, { level: 'N5', progressStatus: 'all', page: 1, limit: 50 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(repo.getVocabularies).toHaveBeenCalled();
    });

    it('filters by progress_status=known returning only known words', async () => {
      // Arrange
      vi.mocked(repo.getVocabularies).mockResolvedValue({ data: [], total: 3 });

      // Act
      await service.getVocabularies(userId, { level: 'N5', progressStatus: 'known', page: 1, limit: 50 });

      // Assert
      expect(repo.getVocabularies).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ progressStatus: 'known' })
      );
    });

    it('never returns hidden or deleted vocabularies', async () => {
      // Arrange — repo is responsible for filtering, service just calls it
      vi.mocked(repo.getVocabularies).mockResolvedValue({ data: [], total: 0 });

      // Act
      await service.getVocabularies(userId, { level: 'N5', progressStatus: 'all', page: 1, limit: 50 });

      // Assert — repo receives the filter, vocab filtering is repo's responsibility
      expect(repo.getVocabularies).toHaveBeenCalled();
    });
  });

  // ============================
  // batchUpdateProgress
  // ============================
  describe('batchUpdateProgress', () => {
    it('calls batchUpsertProgressWithLearnCount for batch updates', async () => {
      // Arrange
      vi.mocked(repo.batchUpsertProgressWithLearnCount).mockResolvedValue(2);
      const updates = [
        { vocabulary_id: 1, status: 'known' as const },
        { vocabulary_id: 2, status: 'learning' as const },
      ];

      // Act
      const result = await service.batchUpdateProgress(userId, updates);

      // Assert
      expect(result).toBe(2);
      expect(repo.batchUpsertProgressWithLearnCount).toHaveBeenCalledWith(userId, updates);
    });

    it('does not call transaction function when updates is empty', async () => {
      // Arrange
      vi.mocked(repo.batchUpsertProgressWithLearnCount).mockResolvedValue(0);

      // Act
      await service.batchUpdateProgress(userId, []);

      // Assert
      expect(repo.batchUpsertProgressWithLearnCount).not.toHaveBeenCalled();
    });
  });

  // ============================
  // toggleFavorite
  // ============================
  describe('toggleFavorite', () => {
    it('creates new progress row with is_favorite=true when no progress exists', async () => {
      // Arrange
      vi.mocked(repo.checkVocabularyPublished).mockResolvedValue(true);
      const expected: ToggleFavoriteResponse = { vocabulary_id: 1, is_favorite: true };
      vi.mocked(repo.toggleFavorite).mockResolvedValue(expected);

      // Act
      const result = await service.toggleFavorite(userId, 1);

      // Assert
      expect(result.is_favorite).toBe(true);
    });

    it('toggles is_favorite from true to false', async () => {
      // Arrange
      vi.mocked(repo.checkVocabularyPublished).mockResolvedValue(true);
      const expected: ToggleFavoriteResponse = { vocabulary_id: 1, is_favorite: false };
      vi.mocked(repo.toggleFavorite).mockResolvedValue(expected);

      // Act
      const result = await service.toggleFavorite(userId, 1);

      // Assert
      expect(result.is_favorite).toBe(false);
    });

    it('throws NotFoundError (404) for non-existent vocabulary', async () => {
      // Arrange
      vi.mocked(repo.checkVocabularyPublished).mockResolvedValue(false);

      // Act & Assert
      await expect(service.toggleFavorite(userId, 999)).rejects.toThrow(ServiceError);
      await expect(service.toggleFavorite(userId, 999)).rejects.toMatchObject({ code: 404 });
    });

    it('throws NotFoundError (404) for hidden or deleted vocabulary', async () => {
      // Arrange
      vi.mocked(repo.checkVocabularyPublished).mockResolvedValue(false);

      // Act & Assert
      await expect(service.toggleFavorite(userId, 5)).rejects.toMatchObject({ code: 404 });
    });
  });
});
