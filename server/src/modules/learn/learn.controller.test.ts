// 学習コントローラーテスト / LearnController integration tests — Supertest with mocked service
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { LearnController } from './learn.controller';
import { ServiceError } from '../../models/common.model';
import type { LearnService } from './learn.service';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { signToken } from '../../utils/token.util';
import { batchUpdateProgressSchema, getVocabulariesQuerySchema } from './learn.validation';

// テスト用JWTトークン生成 / Generate test JWT tokens for different roles
const userToken = signToken({ userId: 1, email: 'user@test.com', role: 'user' });
const adminToken = signToken({ userId: 2, email: 'admin@test.com', role: 'admin' });
const moderatorToken = signToken({ userId: 3, email: 'mod@test.com', role: 'moderator' });

// モックサービス生成 / Create mock service factory
function createMockService() {
  return {
    getLevelStats: vi.fn(),
    getVocabularies: vi.fn(),
    batchUpdateProgress: vi.fn(),
    toggleFavorite: vi.fn(),
  };
}

type MockService = ReturnType<typeof createMockService>;

// モックサービスでExpressアプリを構築 / Build Express app with injected mock service
function buildApp(service: MockService) {
  const app = express();
  app.use(express.json());

  const controller = new LearnController(service as unknown as LearnService);
  const router = express.Router();
  router.use(authMiddleware, requireRole('user'));

  router.get('/stats', controller.getStats.bind(controller));
  router.get('/vocabularies', validate(getVocabulariesQuerySchema, 'query'), controller.getVocabularies.bind(controller));
  router.post('/progress/batch', validate(batchUpdateProgressSchema), controller.batchUpdateProgress.bind(controller));
  router.post('/favorite/:vocabularyId', controller.toggleFavorite.bind(controller));

  app.use('/api/learn', router);
  return app;
}

// サンプルデータ / Sample data fixtures
const sampleStats = [
  { level: 'N5', total: 120, known: 45, learning: 20, new_count: 55 },
];

const sampleVocabList = {
  data: [
    {
      id: 1, kanji: '食べる', hiragana: 'たべる', romaji: 'taberu',
      meaning_vi: 'ăn', level: 'N5', tags: [], media_url: null, note: null,
      progress: null,
    },
  ],
  pagination: { page: 1, limit: 50, total: 1, pages: 1 },
};

describe('LearnController', () => {
  let service: MockService;
  let app: express.Express;

  beforeEach(() => {
    service = createMockService();
    app = buildApp(service);
  });

  // ============================
  // Authentication & Authorization
  // ============================
  describe('Authorization', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/learn/stats');
      expect(res.status).toBe(401);
    });

    it('returns 403 when role is admin', async () => {
      const res = await request(app)
        .get('/api/learn/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 when role is moderator', async () => {
      const res = await request(app)
        .get('/api/learn/vocabularies?level=N5')
        .set('Authorization', `Bearer ${moderatorToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/learn/stats')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  // ============================
  // GET /api/learn/stats
  // ============================
  describe('GET /api/learn/stats', () => {
    it('returns 200 with level stats for user role', async () => {
      // Arrange
      service.getLevelStats.mockResolvedValue(sampleStats);

      // Act
      const res = await request(app)
        .get('/api/learn/stats')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(sampleStats);
    });

    it('returns 500 on service error', async () => {
      // Arrange
      service.getLevelStats.mockRejectedValue(new Error('DB error'));

      // Act
      const res = await request(app)
        .get('/api/learn/stats')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(500);
    });
  });

  // ============================
  // GET /api/learn/vocabularies
  // ============================
  describe('GET /api/learn/vocabularies', () => {
    it('returns 200 with paginated vocabulary list', async () => {
      // Arrange
      service.getVocabularies.mockResolvedValue(sampleVocabList);

      // Act
      const res = await request(app)
        .get('/api/learn/vocabularies?level=N5')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('returns 422 when level param is missing', async () => {
      // Act
      const res = await request(app)
        .get('/api/learn/vocabularies')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(422);
    });

    it('returns 422 when level param is invalid', async () => {
      // Act
      const res = await request(app)
        .get('/api/learn/vocabularies?level=XX')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(422);
    });
  });

  // ============================
  // POST /api/learn/progress/batch
  // ============================
  describe('POST /api/learn/progress/batch', () => {
    it('returns 200 with updated count', async () => {
      // Arrange
      service.batchUpdateProgress.mockResolvedValue(2);

      // Act
      const res = await request(app)
        .post('/api/learn/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ updates: [{ vocabulary_id: 1, status: 'known' }, { vocabulary_id: 2, status: 'learning' }] });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(2);
    });

    it('returns 422 when updates array is empty', async () => {
      // Act
      const res = await request(app)
        .post('/api/learn/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ updates: [] });

      // Assert
      expect(res.status).toBe(422);
    });

    it('returns 422 when updates array exceeds 200 items', async () => {
      // Arrange
      const updates = Array.from({ length: 201 }, (_, i) => ({ vocabulary_id: i + 1, status: 'known' }));

      // Act
      const res = await request(app)
        .post('/api/learn/progress/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ updates });

      // Assert
      expect(res.status).toBe(422);
    });
  });

  // ============================
  // POST /api/learn/favorite/:vocabularyId
  // ============================
  describe('POST /api/learn/favorite/:vocabularyId', () => {
    it('returns 200 with toggle result', async () => {
      // Arrange
      service.toggleFavorite.mockResolvedValue({ vocabulary_id: 1, is_favorite: true });

      // Act
      const res = await request(app)
        .post('/api/learn/favorite/1')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.vocabulary_id).toBe(1);
      expect(res.body.is_favorite).toBe(true);
    });

    it('returns 404 when vocabulary does not exist', async () => {
      // Arrange
      service.toggleFavorite.mockRejectedValue(new ServiceError('Vocabulary not found', 404));

      // Act
      const res = await request(app)
        .post('/api/learn/favorite/9999')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(404);
    });
  });
});
