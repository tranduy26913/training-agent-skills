// 語彙コントローラーテスト / Vocabulary controller tests — Supertest with mocked service
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { VocabulariesController } from './vocabularies.controller';
import { ServiceError } from '../../models/common.model';
import type { VocabulariesService } from './vocabularies.service';
import { validate } from '../../middleware/validate.middleware';
import {
  createVocabularySchema,
  updateVocabularySchema,
  updateReportStatusSchema,
} from './vocabularies.validation';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { signToken } from '../../utils/token.util';

// テスト用JWTトークン生成 / Generate test JWT tokens for different roles
const adminToken = signToken({ userId: 1, email: 'admin@test.com', role: 'admin' });
const userToken = signToken({ userId: 2, email: 'user@test.com', role: 'user' });
const moderatorToken = signToken({ userId: 3, email: 'mod@test.com', role: 'moderator' });

// モックサービス生成 / Create mock service
function createMockService() {
  return {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getChangeLogs: vi.fn(),
    getReports: vi.fn(),
    updateReportStatus: vi.fn(),
    suggestTags: vi.fn(),
    searchVocabularies: vi.fn(),
  };
}

type MockService = ReturnType<typeof createMockService>;

// モックサービスでExpressアプリを構築 / Build Express app with injected mock service
function buildApp(service: MockService) {
  const app = express();
  app.use(express.json());

  const controller = new VocabulariesController(service as unknown as VocabulariesService);
  const router = express.Router();
  const protectedRouter = express.Router();

  // 認証 + 管理者権限を適用 / Auth + admin guard
  protectedRouter.use(authMiddleware, requireRole('admin'));

  // NOTE: 静的パスを :id より前に登録 / Static routes before :id to prevent conflict
  protectedRouter.get('/search', controller.searchVocabularies.bind(controller));
  protectedRouter.get('/', controller.getVocabularies.bind(controller));
  protectedRouter.post('/', validate(createVocabularySchema), controller.createVocabulary.bind(controller));
  protectedRouter.get('/:id', controller.getVocabulary.bind(controller));
  protectedRouter.put('/:id', validate(updateVocabularySchema), controller.updateVocabulary.bind(controller));
  protectedRouter.delete('/:id', controller.deleteVocabulary.bind(controller));
  protectedRouter.get('/:id/change-logs', controller.getChangeLogs.bind(controller));
  protectedRouter.get('/:id/reports', controller.getReports.bind(controller));
  protectedRouter.patch('/:id/reports/:reportId', validate(updateReportStatusSchema), controller.updateReportStatus.bind(controller));

  // タグ提案はpublic / Tags suggest is public (no auth)
  router.get('/tags/suggest', controller.suggestTags.bind(controller));
  router.use('/vocabularies', protectedRouter);

  app.use('/api', router);
  return app;
}

// サンプルデータ / Sample data fixtures
const sampleVocabDetail = {
  id: 1,
  meaning_vi: 'ăn',
  kanji: '食べる',
  hiragana: 'たべる',
  level: 'N5',
  status: 'publish',
  tags: ['động từ'],
  related_words: [],
  synonyms: [],
  antonyms: [],
  created_by_name: 'Admin',
  updated_by_name: null,
};

const sampleVocabRow = {
  id: 1,
  meaning_vi: 'ăn',
  kanji: '食べる',
  hiragana: 'たべる',
  level: 'N5',
  status: 'publish',
  tags: ['động từ'],
};

const validBody = {
  meaning_vi: 'ăn',
  level: 'N5',
  status: 'publish',
};

describe('VocabulariesController', () => {
  let service: MockService;

  beforeEach(() => {
    service = createMockService();
  });

  // ============================================================
  // Happy Path — CRUD
  // ============================================================
  describe('GET /api/vocabularies — thành công', () => {
    it('TC1: returns 200 with paginated data', async () => {
      // 成功時に200とページネーションデータを返す
      service.getList.mockResolvedValueOnce({
        data: [sampleVocabRow],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      });

      const res = await request(buildApp(service))
        .get('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/vocabularies/:id', () => {
    it('TC2: returns 200 with VocabularyDetail when found', async () => {
      // 見つかった時に200とVocabularyDetailを返す
      service.getById.mockResolvedValueOnce(sampleVocabDetail);

      const res = await request(buildApp(service))
        .get('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.meaning_vi).toBe('ăn');
    });

    it('TC3: returns 404 when vocabulary not found', async () => {
      // 語彙が見つからない場合は404を返す
      service.getById.mockRejectedValueOnce(new ServiceError('Vocabulary not found', 404));

      const res = await request(buildApp(service))
        .get('/api/vocabularies/9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/vocabularies', () => {
    it('TC4: returns 201 with created VocabularyDetail', async () => {
      // 作成成功時に201を返す
      service.create.mockResolvedValueOnce(sampleVocabDetail);

      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });
  });

  describe('PUT /api/vocabularies/:id', () => {
    it('TC5: returns 200 with updated VocabularyDetail', async () => {
      // 更新成功時に200を返す
      const updated = { ...sampleVocabDetail, meaning_vi: 'ăn (cập nhật)' };
      service.update.mockResolvedValueOnce(updated);

      const res = await request(buildApp(service))
        .put('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, meaning_vi: 'ăn (cập nhật)' });

      expect(res.status).toBe(200);
      expect(res.body.meaning_vi).toBe('ăn (cập nhật)');
    });
  });

  describe('DELETE /api/vocabularies/:id', () => {
    it('TC6: returns 204 on soft delete', async () => {
      // 軟削除成功時に204を返す
      service.delete.mockResolvedValueOnce(undefined);

      const res = await request(buildApp(service))
        .delete('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('GET /api/vocabularies/:id/change-logs', () => {
    it('TC7: returns 200 with change logs', async () => {
      // 変更ログを200で返す
      service.getChangeLogs.mockResolvedValueOnce([{ id: 1, field_name: 'meaning_vi' }]);

      const res = await request(buildApp(service))
        .get('/api/vocabularies/1/change-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/vocabularies/:id/reports', () => {
    it('TC8: returns 200 with reports', async () => {
      // レポートを200で返す
      service.getReports.mockResolvedValueOnce([{ id: 1, reason: 'error', status: 'pending' }]);

      const res = await request(buildApp(service))
        .get('/api/vocabularies/1/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('PATCH /api/vocabularies/:id/reports/:reportId', () => {
    it('TC9: returns 200 with resolved report', async () => {
      // レポートをresolvedにして200を返す
      const updatedReport = { id: 1, status: 'resolved' };
      service.updateReportStatus.mockResolvedValueOnce(updatedReport);

      const res = await request(buildApp(service))
        .patch('/api/vocabularies/1/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
    });
  });

  describe('GET /api/tags/suggest', () => {
    it('TC10: returns 200 with tag suggestions (no auth needed)', async () => {
      // 認証不要でタグ提案を200で返す
      service.suggestTags.mockResolvedValueOnce(['động từ', 'N5']);

      const res = await request(buildApp(service)).get('/api/tags/suggest?q=độ');

      expect(res.status).toBe(200);
      expect(res.body.data).toContain('động từ');
    });
  });

  describe('GET /api/vocabularies/search', () => {
    it('TC11: returns 200 with VocabSummary list', async () => {
      // 語彙検索で200とサマリーリストを返す
      service.searchVocabularies.mockResolvedValueOnce([
        { id: 1, kanji: '食べる', hiragana: 'たべる', meaning_vi: 'ăn' },
      ]);

      const res = await request(buildApp(service))
        .get('/api/vocabularies/search?q=食')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].id).toBe(1);
    });
  });

  // ============================================================
  // Validation Tests — POST /api/vocabularies
  // ============================================================
  describe('POST /api/vocabularies — validation', () => {
    it('TC12: returns 422 when meaning_vi is missing', async () => {
      // meaning_viが欠けている場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level: 'N5', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC13: returns 422 when meaning_vi is empty string', async () => {
      // meaning_viが空文字の場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: '', level: 'N5', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC14: returns 422 when meaning_vi exceeds 500 chars', async () => {
      // meaning_viが500文字を超える場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: 'a'.repeat(501), level: 'N5', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC15: returns 422 when level is missing', async () => {
      // levelが欠けている場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: 'ăn', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC16: returns 422 when level is invalid (N6)', async () => {
      // levelが無効(N6)の場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: 'ăn', level: 'N6', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC17: returns 422 when status is missing', async () => {
      // statusが欠けている場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: 'ăn', level: 'N5' });

      expect(res.status).toBe(422);
    });

    it('TC18: returns 422 when status is invalid (active)', async () => {
      // statusが無効(active)の場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ meaning_vi: 'ăn', level: 'N5', status: 'active' });

      expect(res.status).toBe(422);
    });

    it('TC19: returns 422 when media_url is not a valid URL', async () => {
      // media_urlが有効なURLでない場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, media_url: 'not-a-url' });

      expect(res.status).toBe(422);
    });

    it('TC20: returns 201 when media_url is a valid https URL', async () => {
      // media_urlが有効なhttps URLの場合は201を返す
      service.create.mockResolvedValueOnce(sampleVocabDetail);

      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, media_url: 'https://cdn.example.com/img.jpg' });

      expect(res.status).toBe(201);
    });

    it('TC21: returns 422 when kanji exceeds 200 chars', async () => {
      // kanjiが200文字を超える場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, kanji: 'a'.repeat(201) });

      expect(res.status).toBe(422);
    });

    it('TC22: returns 422 when a tag exceeds 100 chars', async () => {
      // タグが100文字を超える場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, tags: ['a'.repeat(101)] });

      expect(res.status).toBe(422);
    });

    it('TC23: returns 400 when related_ids contains self-reference', async () => {
      // related_idsに自己参照が含まれる場合は400を返す (service throws)
      service.create.mockRejectedValueOnce(new ServiceError('A vocabulary cannot reference itself', 400));

      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, related_ids: [1] });

      expect(res.status).toBe(400);
    });

    it('TC24: returns 422 when related_ids contains negative integer', async () => {
      // related_idsに負の整数が含まれる場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, related_ids: [-1] });

      expect(res.status).toBe(422);
    });

    it('TC25: returns 422 when note exceeds 5000 chars', async () => {
      // noteが5000文字を超える場合は422を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, note: 'a'.repeat(5001) });

      expect(res.status).toBe(422);
    });
  });

  // ============================================================
  // Validation Tests — PUT /api/vocabularies/:id
  // ============================================================
  describe('PUT /api/vocabularies/:id — validation', () => {
    it('TC26: returns 422 when meaning_vi is missing', async () => {
      // meaning_viが欠けている場合は422を返す
      const res = await request(buildApp(service))
        .put('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level: 'N5', status: 'publish' });

      expect(res.status).toBe(422);
    });

    it('TC27: returns 400 when synonym_ids contains self-reference', async () => {
      // synonym_idsに自己参照が含まれる場合は400を返す
      service.update.mockRejectedValueOnce(new ServiceError('A vocabulary cannot reference itself', 400));

      const res = await request(buildApp(service))
        .put('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, synonym_ids: [1] });

      expect(res.status).toBe(400);
    });

    it('TC28: returns 400 when antonym_ids contains self-reference', async () => {
      // antonym_idsに自己参照が含まれる場合は400を返す
      service.update.mockRejectedValueOnce(new ServiceError('A vocabulary cannot reference itself', 400));

      const res = await request(buildApp(service))
        .put('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, antonym_ids: [1] });

      expect(res.status).toBe(400);
    });

    it('TC29: returns 404 when vocabulary not found', async () => {
      // 語彙が見つからない場合は404を返す
      service.update.mockRejectedValueOnce(new ServiceError('Vocabulary not found', 404));

      const res = await request(buildApp(service))
        .put('/api/vocabularies/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody);

      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // Validation Tests — PATCH .../reports/:reportId
  // ============================================================
  describe('PATCH .../reports/:reportId — validation', () => {
    it('TC30: returns 422 when status is invalid (closed)', async () => {
      // statusが無効(closed)の場合は422を返す
      const res = await request(buildApp(service))
        .patch('/api/vocabularies/1/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'closed' });

      expect(res.status).toBe(422);
    });

    it('TC31: returns 404 when report not found', async () => {
      // レポートが見つからない場合は404を返す
      service.updateReportStatus.mockRejectedValueOnce(new ServiceError('Report not found', 404));

      const res = await request(buildApp(service))
        .patch('/api/vocabularies/1/reports/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // Authorization Tests
  // ============================================================
  describe('Authorization', () => {
    it('TC32: GET /api/vocabularies — 401 without token', async () => {
      // トークンなしで401を返す
      const res = await request(buildApp(service)).get('/api/vocabularies');
      expect(res.status).toBe(401);
    });

    it('TC33: POST /api/vocabularies — 403 for role=user', async () => {
      // roleがuserの場合は403を返す
      const res = await request(buildApp(service))
        .post('/api/vocabularies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it('TC34: PUT /api/vocabularies/:id — 403 for role=moderator', async () => {
      // roleがmoderatorの場合は403を返す
      const res = await request(buildApp(service))
        .put('/api/vocabularies/1')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it('TC35: DELETE /api/vocabularies/:id — 204 for role=admin', async () => {
      // roleがadminの場合は204を返す
      service.delete.mockResolvedValueOnce(undefined);

      const res = await request(buildApp(service))
        .delete('/api/vocabularies/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('TC36: GET /api/tags/suggest — 200 without any token', async () => {
      // 認証不要で200を返す（publicエンドポイント）
      service.suggestTags.mockResolvedValueOnce(['動詞']);

      const res = await request(buildApp(service)).get('/api/tags/suggest?q=動');

      expect(res.status).toBe(200);
    });

    it('TC37: GET /api/vocabularies/search — 401 without token', async () => {
      // トークンなしで401を返す（protectedエンドポイント）
      const res = await request(buildApp(service)).get('/api/vocabularies/search?q=食');

      expect(res.status).toBe(401);
    });
  });
});
