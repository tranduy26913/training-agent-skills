import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useVocabularies } from '../useVocabularies';
import { vocabulariesApiService } from '@/services/vocabularies.service';
import type { VocabularyResponse, VocabularyDetail, VocabRelationDto, AnalyticsData } from '@/types/vocabularies.types';

// Mock the API service
vi.mock('@/services/vocabularies.service', () => ({
  vocabulariesApiService: {
    getVocabularies: vi.fn(),
    getVocabularyDetail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getRelationOptions: vi.fn(),
    getAnalytics: vi.fn(),
    resolveReport: vi.fn(),
  },
}));

describe('useVocabularies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // COMP-UT-001: fetchVocabularies success
  it('fetches vocabularies successfully', async () => {
    const mockResponse = {
      data: [
        { id: 1, kanji: '食べる', meaning_vi: 'Ăn' } as VocabularyResponse,
      ],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    };

    (vocabulariesApiService.getVocabularies as any).mockResolvedValue(mockResponse);

    const { getVocabularies } = useVocabularies();
    const result = await getVocabularies();

    expect(vocabulariesApiService.getVocabularies).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockResponse);
  });

  // COMP-UT-002: fetchVocabularies with filters
  it('fetches vocabularies with filters', async () => {
    const mockResponse = {
      data: [
        { id: 1, kanji: '食べる', meaning_vi: 'Ăn', level: 'N4' } as VocabularyResponse,
      ],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    };

    (vocabulariesApiService.getVocabularies as any).mockResolvedValue(mockResponse);

    const { getVocabularies } = useVocabularies();
    const result = await getVocabularies({ level: 'N4', status: 'Publish' });

    expect(vocabulariesApiService.getVocabularies).toHaveBeenCalledWith({ level: 'N4', status: 'Publish' });
    expect(result).toEqual(mockResponse);
  });

  // COMP-UT-003: fetchVocabulary success
  it('fetches single vocabulary detail successfully', async () => {
    const mockDetail: VocabularyDetail = {
      id: 1,
      kanji: '食べる',
      hiragana: 'たべる',
      romaji: 'taberu',
      meaning_vi: 'Ăn',
      level: 'N4',
      status: 'Publish',
      on_yomi: null,
      media_url: null,
      note: null,
      tags: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
      created_by: 1,
      updated_by: 1,
      version: 1,
      related_vocab: [],
      synonym_vocab: [],
      antonym_vocab: [],
      change_logs: [],
      reports: [],
    };

    (vocabulariesApiService.getVocabularyDetail as any).mockResolvedValue(mockDetail);

    const { getVocabulary } = useVocabularies();
    const result = await getVocabulary(1);

    expect(vocabulariesApiService.getVocabularyDetail).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockDetail);
  });

  // COMP-UT-004: createVocabulary success
  it('creates vocabulary successfully', async () => {
    const mockCreate = {
      id: 1,
      kanji: '新しい',
      meaning_vi: 'Mới',
      status: 'Publish',
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    } as VocabularyResponse;

    const dto = {
      kanji: '新しい',
      meaning_vi: 'Mới',
    };

    (vocabulariesApiService.create as any).mockResolvedValue(mockCreate);

    const { createVocabulary } = useVocabularies();
    const result = await createVocabulary(dto);

    expect(vocabulariesApiService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockCreate);
  });

  // COMP-UT-005: updateVocabulary success
  it('updates vocabulary successfully', async () => {
    const mockUpdate = {
      id: 1,
      kanji: '更新',
      meaning_vi: 'Cập nhật',
      status: 'Publish',
      version: 2,
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-02T00:00:00.000Z',
    } as VocabularyResponse;

    const dto = {
      kanji: '更新',
      meaning_vi: 'Cập nhật',
    };

    (vocabulariesApiService.update as any).mockResolvedValue(mockUpdate);

    const { updateVocabulary } = useVocabularies();
    const result = await updateVocabulary(1, dto);

    expect(vocabulariesApiService.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockUpdate);
  });

  // COMP-UT-006: deleteVocabulary success
  it('deletes vocabulary successfully', async () => {
    (vocabulariesApiService.delete as any).mockResolvedValue(undefined);

    const { deleteVocabulary } = useVocabularies();
    await deleteVocabulary(1);

    expect(vocabulariesApiService.delete).toHaveBeenCalledWith(1);
  });

  // COMP-UT-007: fetchRelationOptions success
  it('fetches relation options successfully', async () => {
    const mockOptions: VocabRelationDto[] = [
      { id: 1, kanji: '食べる', hiragana: 'たべる', level: 'N4' },
      { id: 2, kanji: '飲む', hiragana: 'のむ', level: 'N4' },
    ];

    (vocabulariesApiService.getRelationOptions as any).mockResolvedValue(mockOptions);

    const { getRelationOptions } = useVocabularies();
    const result = await getRelationOptions();

    expect(vocabulariesApiService.getRelationOptions).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockOptions);
  });

  it('fetches relation options with excludeIds', async () => {
    const mockOptions: VocabRelationDto[] = [
      { id: 2, kanji: '飲む', hiragana: 'のむ', level: 'N4' },
    ];

    (vocabulariesApiService.getRelationOptions as any).mockResolvedValue(mockOptions);

    const { getRelationOptions } = useVocabularies();
    await getRelationOptions([1]);

    expect(vocabulariesApiService.getRelationOptions).toHaveBeenCalledWith([1]);
  });

  // COMP-UT-008: fetchAnalytics success
  it('fetches analytics data successfully', async () => {
    const mockAnalytics: AnalyticsData = {
      learn_count: 150,
      favorite_count: 25,
      report_count: 3,
      relation_count: 8,
    };

    (vocabulariesApiService.getAnalytics as any).mockResolvedValue(mockAnalytics);

    const { getAnalytics } = useVocabularies();
    const result = await getAnalytics(1);

    expect(vocabulariesApiService.getAnalytics).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockAnalytics);
  });

  // Resolve report
  it('resolves report successfully', async () => {
    (vocabulariesApiService.resolveReport as any).mockResolvedValue(undefined);

    const { resolveReport } = useVocabularies();
    await resolveReport(1, 5, 'resolved');

    expect(vocabulariesApiService.resolveReport).toHaveBeenCalledWith(1, 5, 'resolved');
  });

  it('dismisses report successfully', async () => {
    (vocabulariesApiService.resolveReport as any).mockResolvedValue(undefined);

    const { resolveReport } = useVocabularies();
    await resolveReport(1, 5, 'dismissed');

    expect(vocabulariesApiService.resolveReport).toHaveBeenCalledWith(1, 5, 'dismissed');
  });

  // Loading state
  it('sets loading state during API call', async () => {
    let resolveFunc: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolveFunc = resolve;
    });

    (vocabulariesApiService.getVocabularies as any).mockImplementation(() => promise);

    const { getVocabularies, loading } = useVocabularies();
    
    // Start the call
    const callPromise = getVocabularies();
    
    // Loading should be true during the call
    expect(loading.value).toBe(true);
    
    // Resolve the promise
    resolveFunc!({ data: [], page: 1, limit: 20, total: 0, total_pages: 0 });
    await callPromise;
    
    // Loading should be false after completion
    expect(loading.value).toBe(false);
  });

  // Error handling
  it('clears error state when API call fails', async () => {
    const error = new Error('API Error');
    (vocabulariesApiService.getVocabularies as any).mockRejectedValue(error);

    const { getVocabularies, error: errorState } = useVocabularies();

    try {
      await getVocabularies();
    } catch (e) {
      // Expected to throw
    }

    // Error state should be set
    expect(errorState.value).toBeTruthy();
  });

  it('throws error when API call fails', async () => {
    const error = new Error('Network Error');
    (vocabulariesApiService.getVocabularies as any).mockRejectedValue(error);

    const { getVocabularies } = useVocabularies();

    await expect(getVocabularies()).rejects.toThrow('Network Error');
  });

  // Error state reset
  it('clears error state on successful call', async () => {
    const mockResponse = { data: [], page: 1, limit: 20, total: 0, total_pages: 0 };
    (vocabulariesApiService.getVocabularies as any).mockResolvedValue(mockResponse);

    const { getVocabularies, error } = useVocabularies();
    await getVocabularies();

    expect(error.value).toBeNull();
  });
});
