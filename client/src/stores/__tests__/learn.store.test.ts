// 学習ストアテスト / LearnStore unit tests with mocked learnService
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLearnStore } from '../learn.store';
import type { LevelStatsDto, LearnVocabularyItem, ProgressUpdateItem } from '@/types/learn.types';
import type { PaginatedData } from '@/types/api.types';

// サービスモック / Hoist service mocks before vi.mock
const serviceMocks = vi.hoisted(() => ({
  getLevelStats: vi.fn(),
  getVocabularies: vi.fn(),
  batchUpdateProgress: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock('@/services/learn.service', () => ({
  learnService: serviceMocks,
}));

// サンプルデータ / Sample fixtures
const sampleStats: LevelStatsDto[] = [
  { level: 'N5', total: 120, known: 45, learning: 20, new_count: 55 },
  { level: 'N4', total: 80, known: 10, learning: 5, new_count: 65 },
];

const sampleVocab: LearnVocabularyItem = {
  id: 1, kanji: '食べる', hiragana: 'たべる', romaji: 'taberu',
  meaning_vi: 'ăn', level: 'N5', tags: [], media_url: null, note: null,
  progress: { status: 'new', review_count: 0, last_reviewed: null, is_favorite: false },
};

const samplePaginatedVocabs: PaginatedData<LearnVocabularyItem> = {
  data: [sampleVocab],
  pagination: { page: 1, limit: 50, total: 1, pages: 1 },
};

describe('useLearnStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ==============================
  // fetchLevelStats
  // ==============================
  describe('fetchLevelStats', () => {
    it('loads level stats into state on success', async () => {
      // Arrange
      serviceMocks.getLevelStats.mockResolvedValue(sampleStats);

      // Act
      const store = useLearnStore();
      await store.fetchLevelStats();

      // Assert
      expect(store.levelStats).toHaveLength(2);
      expect(store.levelStats[0].level).toBe('N5');
      expect(store.loadingStats).toBe(false);
      expect(store.error).toBeNull();
    });

    it('sets error on failure', async () => {
      // Arrange
      serviceMocks.getLevelStats.mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });

      // Act
      const store = useLearnStore();
      await store.fetchLevelStats();

      // Assert
      expect(store.levelStats).toHaveLength(0);
      expect(store.error).toBe('Unauthorized');
    });
  });

  // ==============================
  // fetchVocabularies
  // ==============================
  describe('fetchVocabularies', () => {
    it('loads vocabularies and pagination into state on success', async () => {
      // Arrange
      serviceMocks.getVocabularies.mockResolvedValue(samplePaginatedVocabs);

      // Act
      const store = useLearnStore();
      await store.fetchVocabularies({ level: 'N5' });

      // Assert
      expect(store.vocabularies).toHaveLength(1);
      expect(store.pagination.total).toBe(1);
      expect(store.loading).toBe(false);
    });

    it('sets error and empty list on failure', async () => {
      // Arrange
      serviceMocks.getVocabularies.mockRejectedValue(new Error('Network error'));

      // Act
      const store = useLearnStore();
      await store.fetchVocabularies({ level: 'N5' });

      // Assert
      expect(store.vocabularies).toHaveLength(0);
      expect(store.error).toBeTruthy();
    });
  });

  // ==============================
  // batchUpdateProgress
  // ==============================
  describe('batchUpdateProgress', () => {
    it('returns updated count on success', async () => {
      // Arrange
      const updates: ProgressUpdateItem[] = [{ vocabulary_id: 1, status: 'known' }];
      serviceMocks.batchUpdateProgress.mockResolvedValue(1);

      // Act
      const store = useLearnStore();
      const count = await store.batchUpdateProgress(updates);

      // Assert
      expect(count).toBe(1);
    });

    it('returns 0 and sets error on failure', async () => {
      // Arrange
      serviceMocks.batchUpdateProgress.mockRejectedValue({ response: { data: { message: 'Server error' } } });

      // Act
      const store = useLearnStore();
      const count = await store.batchUpdateProgress([{ vocabulary_id: 1, status: 'known' }]);

      // Assert
      expect(count).toBe(0);
      expect(store.error).toBe('Server error');
    });
  });

  // ==============================
  // toggleFavorite
  // ==============================
  describe('toggleFavorite', () => {
    it('returns result and updates vocabulary progress in store', async () => {
      // Arrange
      serviceMocks.getVocabularies.mockResolvedValue(samplePaginatedVocabs);
      serviceMocks.toggleFavorite.mockResolvedValue({ vocabulary_id: 1, is_favorite: true });

      const store = useLearnStore();
      await store.fetchVocabularies({ level: 'N5' });

      // Act
      const result = await store.toggleFavorite(1);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.is_favorite).toBe(true);
      // Store の語彙の is_favorite が更新されていることを確認 / Verify store vocab updated
      expect(store.vocabularies[0].progress?.is_favorite).toBe(true);
    });

    it('returns null and sets error on failure', async () => {
      // Arrange
      serviceMocks.toggleFavorite.mockRejectedValue({ response: { data: { message: 'Not found' } } });

      // Act
      const store = useLearnStore();
      const result = await store.toggleFavorite(999);

      // Assert
      expect(result).toBeNull();
      expect(store.error).toBe('Not found');
    });
  });

  // ==============================
  // $reset
  // ==============================
  describe('$reset', () => {
    it('resets all state to initial values', async () => {
      // Arrange
      serviceMocks.getLevelStats.mockResolvedValue(sampleStats);
      const store = useLearnStore();
      await store.fetchLevelStats();
      expect(store.levelStats).toHaveLength(2);

      // Act
      store.$reset();

      // Assert
      expect(store.levelStats).toHaveLength(0);
      expect(store.vocabularies).toHaveLength(0);
      expect(store.error).toBeNull();
    });
  });
});
