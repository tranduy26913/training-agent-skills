/**
 * useVocabularies composable unit tests
 * useVocabulariesコンポーザブルのユニットテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVocabularies } from '../useVocabularies';

// 語彙サービスのモック / Mock vocabularies service
vi.mock('@/services/vocabularies.service', () => ({
  vocabulariesApiService: {
    getVocabularies: vi.fn(),
    getById: vi.fn(),
    getVocabularyDetail: vi.fn(),
    getSimpleList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteVocabulary: vi.fn(),
    getAuditLogs: vi.fn(),
    resolveReport: vi.fn(),
    rejectReport: vi.fn(),
  },
}));

import { vocabulariesApiService } from '@/services/vocabularies.service';

const mockService = vi.mocked(vocabulariesApiService);

describe('useVocabularies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CU-1: getVocabularies gọi đúng endpoint
  it('CU-1: getVocabularies calls service with filters', async () => {
    // getVocabulariesがフィルター付きでサービスを呼ぶ
    const paginatedResult = { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    mockService.getVocabularies.mockResolvedValueOnce(paginatedResult);

    const { getVocabularies } = useVocabularies();
    const result = await getVocabularies({ page: 1, search: 'test' });

    expect(mockService.getVocabularies).toHaveBeenCalledWith({ page: 1, search: 'test' });
    expect(result).toEqual(paginatedResult);
  });

  // CU-2: getSimpleList gọi đúng endpoint
  it('CU-2: getSimpleList calls service', async () => {
    // getSimpleListがサービスを呼ぶ
    const simpleList = [{ id: 1, kanji: '日本語', hiragana: 'にほんご', meaning_vi: 'Tiếng Nhật' }];
    mockService.getSimpleList.mockResolvedValueOnce(simpleList);

    const { getSimpleList } = useVocabularies();
    const result = await getSimpleList();

    expect(mockService.getSimpleList).toHaveBeenCalledTimes(1);
    expect(result).toEqual(simpleList);
  });

  // CU-3: createVocabulary post đúng payload
  it('CU-3: createVocabulary calls service with correct DTO', async () => {
    // createVocabularyが正しいDTOでサービスを呼ぶ
    const dto = { meaning_vi: 'テスト', hiragana: 'てすと', level: 'N5' as const, status: 'publish' as const };
    const created = { id: 1, ...dto, version: 1, created_at: '2026-01-01', updated_at: '2026-01-01' };
    mockService.create.mockResolvedValueOnce(created);

    const { createVocabulary } = useVocabularies();
    const result = await createVocabulary(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe(1);
  });

  // CU-4: resolveReport gọi đúng endpoint
  it('CU-4: resolveReport calls service with correct reportId', async () => {
    // resolveReportが正しいreportIdでサービスを呼ぶ
    const resolved = { id: 3, vocab_id: 1, status: 'resolved' as const };
    mockService.resolveReport.mockResolvedValueOnce(resolved);

    const { resolveReport } = useVocabularies();
    const result = await resolveReport(3);

    expect(mockService.resolveReport).toHaveBeenCalledWith(3);
    expect(result.status).toBe('resolved');
  });

  // CU-5: updateVocabulary calls service with id and DTO
  it('CU-5: updateVocabulary calls service with id and DTO', async () => {
    // updateVocabularyがIDとDTOでサービスを呼ぶ
    const dto = { meaning_vi: '新しい' };
    const updated = { id: 1, meaning_vi: '新しい', hiragana: 'x', level: 'N5', status: 'publish', version: 2 };
    mockService.update.mockResolvedValueOnce(updated);

    const { updateVocabulary } = useVocabularies();
    const result = await updateVocabulary(1, dto);

    expect(mockService.update).toHaveBeenCalledWith(1, dto);
    expect(result.version).toBe(2);
  });

  // CU-6: deleteVocabulary calls service delete
  it('CU-6: deleteVocabulary calls service delete', async () => {
    // deleteVocabularyがサービスのdeleteを呼ぶ
    mockService.deleteVocabulary.mockResolvedValueOnce(undefined);

    const { deleteVocabulary } = useVocabularies();
    await deleteVocabulary(5);

    expect(mockService.deleteVocabulary).toHaveBeenCalledWith(5);
  });

  // CU-7: getVocabulary calls service getVocabularyDetail
  it('CU-7: getVocabulary calls service getVocabularyDetail', async () => {
    // getVocabularyがサービスのgetVocabularyDetailを呼ぶ
    const vocab = { id: 2, meaning_vi: 'テスト', hiragana: 'てすと', level: 'N4', status: 'publish', version: 1, created_at: '2026-01-01', updated_at: '2026-01-01' };
    mockService.getVocabularyDetail.mockResolvedValueOnce(vocab);

    const { getVocabulary } = useVocabularies();
    const result = await getVocabulary(2);

    expect(mockService.getVocabularyDetail).toHaveBeenCalledWith(2);
    expect(result.id).toBe(2);
  });
});
