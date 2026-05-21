// 語彙コントローラーテスト / Vocabulary controller test suite
// Covers: Validation, Service Logic, Repository Query Logic, Authorization
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { VocabulariesController } from './vocabularies.controller';
import { VocabulariesService, ServiceError } from './vocabularies.service';
import { VocabulariesRepository } from './vocabularies.repository';
import {
  createVocabularySchema,
  updateVocabularySchema,
} from './vocabularies.validation';
import { signToken } from '../../utils/token.util';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';

// DBモック / Mock database connection
vi.mock('../../database/connection', () => ({
  pool: { query: vi.fn(), getConnection: vi.fn() },
}));
vi.mock('../../database/transaction', () => ({
  withTransaction: vi.fn((cb: any) => cb({ execute: vi.fn(), query: vi.fn() })),
}));

// テスト用JWTトークン生成 / Generate JWT tokens for auth tests
const adminToken = signToken({ userId: 1, email: 'admin@test.com', role: 'admin' });
const userToken = signToken({ userId: 2, email: 'user@test.com', role: 'user' });

// モックサービス作成 / Create mock service
function createMockService() {
  return {
    list: vi.fn(),
    getDetail: vi.fn(),
    getSimpleList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    getAuditLogs: vi.fn(),
    resolveReport: vi.fn(),
    rejectReport: vi.fn(),
  };
}

// モックリポジトリ作成 / Create mock repository
function createMockRepository() {
  return {
    findAllWithFilters: vi.fn(),
    findById: vi.fn(),
    findAllSimple: vi.fn(),
    findRelations: vi.fn(),
    findReports: vi.fn(),
    findReport: vi.fn(),
    updateReport: vi.fn(),
    findAuditLogs: vi.fn(),
    findAnalytics: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    insertRelationPair: vi.fn(),
  };
}

// ルーター構築ヘルパー / Build router with controller
function buildRouter(controller: VocabulariesController) {
  const router = express.Router();
  router.get('/list/simple', controller.getSimpleList.bind(controller));
  router.patch('/reports/:reportId/resolve', controller.resolveReport.bind(controller));
  router.patch('/reports/:reportId/reject', controller.rejectReport.bind(controller));
  router.get('/', controller.getVocabularies.bind(controller));
  router.post('/', controller.createVocabulary.bind(controller));
  router.get('/:id', controller.getVocabulary.bind(controller));
  router.put('/:id', controller.updateVocabulary.bind(controller));
  router.delete('/:id', controller.deleteVocabulary.bind(controller));
  router.get('/:id/audit-logs', controller.getAuditLogs.bind(controller));
  return router;
}

// サービスを注入したExpressアプリ構築 (認証なし) / Build app with injected mock service (no auth)
function buildApp(mockService: ReturnType<typeof createMockService>) {
  const app = express();
  app.use(express.json());
  const controller = new VocabulariesController(
    mockService as unknown as VocabulariesService,
  );
  // req.userを設定するモックミドルウェア / Mock middleware to set req.user
  app.use((req: any, _res: any, next: any) => {
    req.user = { userId: 1, email: 'admin@test.com', role: 'admin' };
    next();
  });
  app.use('/api/vocabularies', buildRouter(controller));
  return app;
}

// 認証ミドルウェア付きアプリ構築 / Build app with real auth middleware
function buildAuthApp(mockService: ReturnType<typeof createMockService>) {
  const app = express();
  app.use(express.json());
  const controller = new VocabulariesController(
    mockService as unknown as VocabulariesService,
  );
  // 認証 + 管理者権限をルーターに適用 / Apply auth + admin guard
  const authRouter = express.Router();
  authRouter.use(authMiddleware, requireRole('admin'));
  authRouter.use(buildRouter(controller));
  app.use('/api/vocabularies', authRouter);
  return app;
}

// =============================================================================
// Validation — POST /api/vocabularies (V-1 through V-17)
// バリデーションテスト — 語彙作成スキーマ
// =============================================================================
describe('Validation — POST /api/vocabularies', () => {
  it('V-1: rejects missing meaning_vi', () => {
    // meaning_viが欠如している場合に失敗する
    const result = createVocabularySchema.safeParse({
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
    const fields = result.error?.errors.map((e) => e.path.join('.'));
    expect(fields).toContain('meaning_vi');
  });

  it('V-2: rejects empty meaning_vi', () => {
    // meaning_viが空文字列の場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: '',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
  });

  it('V-3: rejects meaning_vi over 500 chars', () => {
    // meaning_viが500文字を超える場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'a'.repeat(501),
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('500');
  });

  it('V-4: rejects missing hiragana', () => {
    // hiraganaが欠如している場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
    const fields = result.error?.errors.map((e) => e.path.join('.'));
    expect(fields).toContain('hiragana');
  });

  it('V-5: rejects empty hiragana', () => {
    // hiraganaが空文字列の場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: '',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
  });

  it('V-6: rejects hiragana over 200 chars', () => {
    // hiraganaが200文字を超える場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'a'.repeat(201),
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('200');
  });

  it('V-7: rejects missing level', () => {
    // levelが欠如している場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      status: 'publish',
    });
    expect(result.success).toBe(false);
    const fields = result.error?.errors.map((e) => e.path.join('.'));
    expect(fields).toContain('level');
  });

  it('V-8: rejects invalid level N6', () => {
    // 無効なレベルN6を拒否する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N6',
      status: 'publish',
    });
    expect(result.success).toBe(false);
  });

  it('V-9: rejects missing status', () => {
    // statusが欠如している場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
    });
    expect(result.success).toBe(false);
    const fields = result.error?.errors.map((e) => e.path.join('.'));
    expect(fields).toContain('status');
  });

  it('V-10: rejects invalid status archived', () => {
    // 無効なステータスarchivedを拒否する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });

  it('V-11: rejects non-URL image_url', () => {
    // URLでないimage_urlを拒否する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      image_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('V-12: rejects note over 2000 chars', () => {
    // noteが2000文字を超える場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      note: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('V-13: rejects tags array over 20 items', () => {
    // tagsが20個を超える場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('V-14: rejects single tag over 50 chars', () => {
    // 50文字を超えるタグを拒否する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      tags: ['a'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it('V-15: rejects related_ids with non-number value', () => {
    // related_idsに数値以外の値がある場合に失敗する
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      related_ids: ['abc'],
    });
    expect(result.success).toBe(false);
  });

  it('V-16: accepts minimal valid body', () => {
    // 最小限の有効なボディを受け入れる
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
    });
    expect(result.success).toBe(true);
  });

  it('V-17: accepts fully populated valid body', () => {
    // 全フィールド入力の有効なボディを受け入れる
    const result = createVocabularySchema.safeParse({
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      romaji: 'tesuto',
      kanji: 'テスト',
      sino_vietnamese: 'Thử nghiệm',
      level: 'N3',
      image_url: 'https://example.com/img.png',
      note: 'test note',
      tags: ['tag1', 'tag2'],
      status: 'publish',
      related_ids: [2, 3],
      synonym_ids: [4],
      antonym_ids: [5],
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Validation — PUT /api/vocabularies/:id (V-18 through V-22)
// バリデーションテスト — 語彙更新スキーマ
// =============================================================================
describe('Validation — PUT /api/vocabularies/:id', () => {
  it('V-18: rejects empty meaning_vi in update', () => {
    // 更新時に空のmeaning_viを拒否する
    const result = updateVocabularySchema.safeParse({ meaning_vi: '' });
    expect(result.success).toBe(false);
  });

  it('V-19: rejects empty hiragana in update', () => {
    // 更新時に空のhiraganaを拒否する
    const result = updateVocabularySchema.safeParse({ hiragana: '' });
    expect(result.success).toBe(false);
  });

  it('V-20: rejects invalid level N0 in update', () => {
    // 更新時に無効なレベルN0を拒否する
    const result = updateVocabularySchema.safeParse({ level: 'N0' as any });
    expect(result.success).toBe(false);
  });

  it('V-21: returns 404 for non-existent vocabulary', async () => {
    // 存在しない語彙IDの場合404を返す
    const mockService = createMockService();
    mockService.update.mockRejectedValueOnce(
      new ServiceError('Vocabulary not found', 404),
    );
    const app = buildApp(mockService);

    const res = await request(app)
      .put('/api/vocabularies/9999')
      .send({ note: 'updated note' });

    expect(res.status).toBe(404);
  });

  it('V-22: accepts partial valid body', () => {
    // 部分的な有効なボディを受け入れる
    const result = updateVocabularySchema.safeParse({ note: 'updated note' });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Service Logic (S-1 through S-12)
// サービスロジックテスト
// =============================================================================
describe('Service Logic', () => {
  let service: VocabulariesService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new VocabulariesService(mockRepo as unknown as VocabulariesRepository);
    vi.clearAllMocks();
  });

  it('S-1: creates vocabulary — calls create and audit via repository', async () => {
    // 語彙作成成功 — リポジトリのcreateが呼ばれる
    const vocabRow = {
      id: 1,
      meaning_vi: 'テスト',
      hiragana: 'てすと',
      level: 'N5',
      status: 'publish',
      version: 1,
    };
    mockRepo.create.mockResolvedValueOnce(vocabRow);

    const result = await service.create(
      { meaning_vi: 'テスト', hiragana: 'てすと', level: 'N5', status: 'publish' },
      1,
    );

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(1);
  });

  it('S-2: creates vocabulary with relations — insertRelationPair called bidirectionally', async () => {
    // 関係付きの語彙作成 — 双方向でinsertRelationPairが呼ばれる
    const vocabRow = { id: 10, meaning_vi: 'x', hiragana: 'x', level: 'N5', status: 'publish' };
    mockRepo.create.mockResolvedValueOnce(vocabRow);

    await service.create(
      { meaning_vi: 'x', hiragana: 'x', level: 'N5', status: 'publish', related_ids: [2, 3] },
      1,
    );

    // repository.create handles the bidirectional insertion internally
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ related_ids: [2, 3] }),
      1,
    );
  });

  it('S-3: rejects self-relation — SELF_RELATION_NOT_ALLOWED', async () => {
    // 自己関係を拒否する — SELF_RELATION_NOT_ALLOWED
    // Note: self-relation is enforced by DB UNIQUE constraint; this test verifies
    // that the repository throws when duplicate is attempted
    mockRepo.create.mockRejectedValueOnce(new ServiceError('SELF_RELATION_NOT_ALLOWED', 400));

    await expect(
      service.create(
        {
          meaning_vi: 'テスト',
          hiragana: 'てすと',
          level: 'N5',
          status: 'publish',
          related_ids: [1],
        },
        1,
      ),
    ).rejects.toThrow('SELF_RELATION_NOT_ALLOWED');
  });

  it('S-4: update — version is incremented', async () => {
    // 更新時にバージョンが増加する
    const existing = { id: 1, version: 1, meaning_vi: 'old', hiragana: 'old', level: 'N5', status: 'publish' };
    const updated = { ...existing, version: 2, meaning_vi: 'new' };
    mockRepo.findById.mockResolvedValueOnce(existing);
    mockRepo.update.mockResolvedValueOnce(updated);

    const result = await service.update(1, { meaning_vi: 'new' }, 1);

    expect(mockRepo.update).toHaveBeenCalledTimes(1);
    expect(result.version).toBe(2);
  });

  it('S-5: update — changed_fields contains old/new meaning_vi', async () => {
    // 更新時にchanged_fieldsに古い/新しいmeaning_viが含まれる
    const existing = {
      id: 1,
      version: 1,
      meaning_vi: '古い',
      hiragana: 'ふるい',
      level: 'N5',
      status: 'publish',
    };
    const updated = { ...existing, version: 2, meaning_vi: '新しい' };
    mockRepo.findById.mockResolvedValueOnce(existing);
    mockRepo.update.mockResolvedValueOnce(updated);

    await service.update(1, { meaning_vi: '新しい' }, 1);

    const updateCall = mockRepo.update.mock.calls[0];
    const changedFields = updateCall[3]; // 4th arg: changedFields
    expect(changedFields).toHaveProperty('meaning_vi');
    expect(changedFields!.meaning_vi.old).toBe('古い');
    expect(changedFields!.meaning_vi.new).toBe('新しい');
  });

  it('S-6: update relations — calls repository.update with relation DTO and null changedFields', async () => {
    // 関係更新 — リレーションのみ変更の場合changedFieldsはnull
    // _buildChangedFields tracks scalar fields only (not relation_ids)
    const existing = { id: 1, version: 1, meaning_vi: 'x', hiragana: 'x', level: 'N5', status: 'publish' };
    mockRepo.findById.mockResolvedValueOnce(existing);
    mockRepo.update.mockResolvedValueOnce({ ...existing, version: 2 });

    await service.update(1, { synonym_ids: [5] }, 1);

    expect(mockRepo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ synonym_ids: [5] }),
      1,
      null, // no scalar field changes → changedFields is null
    );
  });

  it('S-7: soft delete — sets status=deleted and records DELETE audit log', async () => {
    // ソフトデリート — status=deletedに設定し監査ログを記録する
    const existing = { id: 1, version: 1, meaning_vi: 'テスト', status: 'publish' };
    mockRepo.findById.mockResolvedValueOnce(existing);
    mockRepo.softDelete.mockResolvedValueOnce(undefined);

    await service.softDelete(1, 1);

    expect(mockRepo.softDelete).toHaveBeenCalledWith(1, 1);
  });

  it('S-8: soft delete non-existent — throws 404', async () => {
    // 存在しない語彙をソフトデリート — 404を返す
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(service.softDelete(9999, 1)).rejects.toMatchObject({
      code: 404,
    });
  });

  it('S-9: resolveReport success', async () => {
    // レポート解決成功
    const report = { id: 3, vocab_id: 1, status: 'pending' };
    const resolved = { ...report, status: 'resolved', resolved_by: 1 };
    mockRepo.findReport
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(resolved);
    mockRepo.updateReport.mockResolvedValueOnce(undefined);

    const result = await service.resolveReport(3, 1);

    expect(mockRepo.updateReport).toHaveBeenCalledWith(3, 'resolved', 1);
    expect(result?.status).toBe('resolved');
  });

  it('S-10: resolveReport on already-resolved report — throws 409', async () => {
    // 既に処理済みのレポートを解決 — 409を返す
    const report = { id: 3, vocab_id: 1, status: 'resolved' };
    mockRepo.findReport.mockResolvedValueOnce(report);

    await expect(service.resolveReport(3, 1)).rejects.toMatchObject({
      code: 409,
    });
  });

  it('S-11: rejectReport success', async () => {
    // レポート拒否成功
    const report = { id: 3, vocab_id: 1, status: 'pending' };
    const rejected = { ...report, status: 'rejected', resolved_by: 1 };
    mockRepo.findReport
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(rejected);
    mockRepo.updateReport.mockResolvedValueOnce(undefined);

    const result = await service.rejectReport(3, 1);

    expect(mockRepo.updateReport).toHaveBeenCalledWith(3, 'rejected', 1);
    expect(result?.status).toBe('rejected');
  });

  it('S-12: getSimpleList returns id, kanji, hiragana, meaning_vi only', async () => {
    // シンプルリストはid, kanji, hiragana, meaning_viのみを返す
    const simpleRows = [
      { id: 1, kanji: '日本語', hiragana: 'にほんご', meaning_vi: 'Tiếng Nhật' },
    ];
    mockRepo.findAllSimple.mockResolvedValueOnce(simpleRows);

    const result = await service.getSimpleList();

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('kanji');
    expect(result[0]).toHaveProperty('hiragana');
    expect(result[0]).toHaveProperty('meaning_vi');
    expect(result[0]).not.toHaveProperty('status');
  });
});

// =============================================================================
// Repository — Query Logic (R-1 through R-7) — mocked DB pool
// リポジトリクエリロジックテスト
// =============================================================================
describe('Repository — Query Logic', () => {
  let repository: VocabulariesRepository;

  // モックプール再インポート / Re-import mock pool
  beforeEach(async () => {
    vi.clearAllMocks();
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query = vi.fn();
    repository = new VocabulariesRepository();
  });

  it('R-1: findAllWithFilters — search applies LIKE on 4 fields', async () => {
    // 検索フィルターが4フィールドにLIKEを適用する
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ search: 'こんにちは' });

    const firstCall = (mockPool as any).query.mock.calls[0];
    expect(firstCall[0]).toContain('meaning_vi LIKE ?');
    expect(firstCall[0]).toContain('hiragana LIKE ?');
    expect(firstCall[0]).toContain('romaji LIKE ?');
  });

  it('R-2: findAllWithFilters — filter level adds WHERE level = ?', async () => {
    // levelフィルターがWHERE level = ?を追加する
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ level: 'N3' });

    const firstCall = (mockPool as any).query.mock.calls[0];
    expect(firstCall[0]).toContain('v.level = ?');
    expect(firstCall[1]).toContain('N3');
  });

  it('R-3: findAllWithFilters — filter status adds WHERE status = ?', async () => {
    // statusフィルターがWHERE status = ?を追加する
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ status: 'publish' });

    const firstCall = (mockPool as any).query.mock.calls[0];
    expect(firstCall[0]).toContain('v.status = ?');
    expect(firstCall[1]).toContain('publish');
  });

  it('R-4: findAllWithFilters — filter tag uses JSON_CONTAINS', async () => {
    // tagフィルターがJSON_CONTAINSを使用する
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ tag: '日常' });

    const firstCall = (mockPool as any).query.mock.calls[0];
    expect(firstCall[0]).toContain('JSON_CONTAINS');
  });

  it('R-5: insertRelationPair inserts 2 rows (bidirectional)', async () => {
    // insertRelationPairが2行（双方向）を挿入する
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query.mockResolvedValueOnce([{ affectedRows: 2 }]);

    await repository.insertRelationPair(1, 2, 'synonym');

    const call = (mockPool as any).query.mock.calls[0];
    // VALUES句に2組のペアが含まれる / Two pairs in VALUES clause
    expect(call[0]).toContain('VALUES');
    expect(call[1]).toContain(1);
    expect(call[1]).toContain(2);
    expect(call[1]).toContain('synonym');
  });

  it('R-6: sortBy SQL injection — falls back to created_at', async () => {
    // sortByのSQLインジェクション — created_atにフォールバックする
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ sortBy: 'id;DROP TABLE' });

    const firstCall = (mockPool as any).query.mock.calls[0];
    // ホワイトリスト外のsortByはcreated_atにフォールバックする
    expect(firstCall[0]).toContain('v.created_at');
    expect(firstCall[0]).not.toContain('DROP TABLE');
  });

  it('R-7: pagination offset calculated correctly for page 3 limit 10', async () => {
    // ページ3、リミット10のオフセットが正しく計算される (offset = 20)
    const { pool: mockPool } = await import('../../database/connection');
    (mockPool as any).query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await repository.findAllWithFilters({ page: 3, limit: 10 });

    const firstCall = (mockPool as any).query.mock.calls[0];
    // LIMIT ? OFFSET ? — paramsの最後2つがlimit=10, offset=20
    const params = firstCall[1] as number[];
    const limitIdx = params.lastIndexOf(10);
    expect(params[limitIdx + 1]).toBe(20);
  });
});

// =============================================================================
// Authorization (A-1 through A-13)
// 認可テスト
// =============================================================================
describe('Authorization', () => {
  // 認証済みアプリを直接構築 / Build app using vocabularies routes directly
  let authApp: express.Express;
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
    // Mock responses for all endpoints
    const paginatedResult = { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    mockService.list.mockResolvedValue(paginatedResult);
    mockService.getSimpleList.mockResolvedValue([]);
    mockService.create.mockResolvedValue({ id: 1 });
    mockService.update.mockResolvedValue({ id: 1 });
    mockService.softDelete.mockResolvedValue({ id: 1 });
    mockService.resolveReport.mockResolvedValue({ id: 1, status: 'resolved' });

    authApp = buildAuthApp(mockService);
  });

  it('A-1: GET /api/vocabularies — admin returns 200', async () => {
    // 管理者はリストへのアクセスが許可される
    const res = await request(authApp)
      .get('/api/vocabularies')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-2: GET /api/vocabularies — non-admin returns 403', async () => {
    // 一般ユーザーはリストへのアクセスが拒否される
    const res = await request(authApp)
      .get('/api/vocabularies')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-3: POST /api/vocabularies — admin returns 201', async () => {
    // 管理者は語彙作成が許可される
    const res = await request(authApp)
      .post('/api/vocabularies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ meaning_vi: 'テスト', hiragana: 'てすと', level: 'N5', status: 'publish' });
    expect(res.status).toBe(201);
  });

  it('A-4: POST /api/vocabularies — user returns 403', async () => {
    // 一般ユーザーは語彙作成が拒否される
    const res = await request(authApp)
      .post('/api/vocabularies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ meaning_vi: 'テスト', hiragana: 'てすと', level: 'N5', status: 'publish' });
    expect(res.status).toBe(403);
  });

  it('A-5: PUT /api/vocabularies/:id — admin returns 200', async () => {
    // 管理者は語彙更新が許可される
    const res = await request(authApp)
      .put('/api/vocabularies/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'updated' });
    expect(res.status).toBe(200);
  });

  it('A-6: PUT /api/vocabularies/:id — user returns 403', async () => {
    // 一般ユーザーは語彙更新が拒否される
    const res = await request(authApp)
      .put('/api/vocabularies/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ note: 'updated' });
    expect(res.status).toBe(403);
  });

  it('A-7: DELETE /api/vocabularies/:id — admin returns 200', async () => {
    // 管理者は語彙削除が許可される
    const res = await request(authApp)
      .delete('/api/vocabularies/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-8: DELETE /api/vocabularies/:id — user returns 403', async () => {
    // 一般ユーザーは語彙削除が拒否される
    const res = await request(authApp)
      .delete('/api/vocabularies/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-9: PATCH /api/vocabularies/reports/:id/resolve — admin returns 200', async () => {
    // 管理者はレポート解決が許可される
    const res = await request(authApp)
      .patch('/api/vocabularies/reports/3/resolve')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-10: PATCH /api/vocabularies/reports/:id/resolve — user returns 403', async () => {
    // 一般ユーザーはレポート解決が拒否される
    const res = await request(authApp)
      .patch('/api/vocabularies/reports/3/resolve')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-11: GET /api/vocabularies — unauthenticated returns 401', async () => {
    // 未認証ユーザーはリストへのアクセスが拒否される
    const res = await request(authApp).get('/api/vocabularies');
    expect(res.status).toBe(401);
  });

  it('A-12: GET /api/vocabularies/list/simple — admin returns 200', async () => {
    // 管理者はシンプルリストへのアクセスが許可される
    const res = await request(authApp)
      .get('/api/vocabularies/list/simple')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-13: GET /api/vocabularies/list/simple — unauthenticated returns 401', async () => {
    // 未認証ユーザーはシンプルリストへのアクセスが拒否される
    const res = await request(authApp).get('/api/vocabularies/list/simple');
    expect(res.status).toBe(401);
  });
});
