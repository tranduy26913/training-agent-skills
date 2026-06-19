/**
 * Vocabulary Controller Integration Tests
 * Tests for vocabulary management API endpoints
 * English and Japanese comments for clarity
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import app from '@app';
import { prisma } from '@database/prisma';
import { signToken } from '@utils/token.util';
import {
  VocabularyStatus,
  VocabLevel,
  VocabRelationType,
} from '@models/vocabularies.model';

// Load environment variables from project root
// これによりチE��チEDB�E�Epp_db_test�E�が使用されめE/ Ensures test database is used
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const ADMIN_ID = 1000;
const ADMIN_EMAIL = 'admin@app.com';
const USER_ID = 1001;
const USER_EMAIL = 'testuser@test.com';

// Test email addresses for vocabulary creators
const TEST_EMAILS = {
  vocabCreator: 'vocab.creator@test.com',
};

// Generate admin JWT token
// 管琁E��EJWT ト�Eクンを生戁E
function getAdminToken(): string {
  return signToken({ userId: ADMIN_ID, email: ADMIN_EMAIL, role: 'admin' });
}

// Generate regular user JWT token
// 一般ユーザーの JWT ト�Eクンを生戁E
function getUserToken(): string {
  return signToken({ userId: USER_ID, email: USER_EMAIL, role: 'user' });
}

// Clean up test vocabulary by kanji. Cascades through relations, change
// logs, and reports.
async function cleanupTestVocabByKanji(kanji: string): Promise<void> {
  const ids = await prisma.vocabulary.findMany({
    where: { kanji },
    select: { id: true },
  });
  const idList = ids.map((v) => v.id);
  if (idList.length === 0) return;

  await prisma.vocabReport.deleteMany({ where: { vocabId: { in: idList } } });
  await prisma.vocabChangeLog.deleteMany({ where: { vocabId: { in: idList } } });
  await prisma.vocabRelation.deleteMany({
    where: { OR: [{ vocabId: { in: idList } }, { targetVocabId: { in: idList } }] },
  });
  await prisma.vocabulary.deleteMany({ where: { id: { in: idList } } });
}

// Create vocabulary directly via Prisma.
async function createTestVocabDirectly(data: {
  kanji: string;
  hiragana?: string | null;
  romaji?: string | null;
  meaning_vi: string;
  on_yomi?: string | null;
  level?: VocabLevel | null;
  status?: VocabularyStatus;
  created_by?: number | null;
}): Promise<number> {
  const created = await prisma.vocabulary.create({
    data: {
      kanji: data.kanji,
      hiragana: data.hiragana ?? null,
      romaji: data.romaji ?? null,
      meaningVi: data.meaning_vi,
      onYomi: data.on_yomi ?? null,
      level: data.level ?? null,
      status: data.status ?? VocabularyStatus.Publish,
      createdBy: data.created_by ?? null,
      version: 1,
    },
    select: { id: true },
  });
  return created.id;
}

// Create a report directly via Prisma.
async function createTestReport(vocabId: number, reportText: string, reportedBy: number = 1000): Promise<number> {
  const created = await prisma.vocabReport.create({
    data: {
      vocabId,
      reportText,
      status: 'pending',
      reportedBy,
    },
    select: { id: true },
  });
  return created.id;
}

describe('VocabularyController Integration Tests', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = getAdminToken();
    userToken = getUserToken();
  });

  beforeEach(async () => {
    // Cleanup before each test
    await cleanupAllTestVocabs();
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanupAllTestVocabs();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============================================================================
  // POST /api/v1/admin/vocabularies - Create Vocabulary Tests
  // ============================================================================

  describe('POST /api/v1/admin/vocabularies', () => {
    // UT-001: Valid DTO, admin user ↁE201 + created vocabulary
    it('should create a new vocabulary with valid data (UT-001)', async () => {
      const newVocab = {
        kanji: '食べる',
        hiragana: 'たべる',
        romaji: 'taberu',
        meaning_vi: 'Ăn',
        on_yomi: '飲む',
        level: VocabLevel.N5,
        status: VocabularyStatus.Publish,
      };

      const res = await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newVocab)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.vocabulary).toMatchObject({
        kanji: newVocab.kanji,
        hiragana: newVocab.hiragana,
        romaji: newVocab.romaji,
        meaning_vi: newVocab.meaning_vi,
        on_yomi: newVocab.on_yomi,
        level: newVocab.level,
        status: newVocab.status,
      });

      // Verify in database
      const created = await prisma.vocabulary.findFirst({
        where: { kanji: newVocab.kanji },
        select: { id: true },
      });
      expect(created).not.toBeNull();
    });

    // UT-002: Invalid DTO (missing kanji) ↁE400 + validation error
    it('should reject missing kanji with 400 (UT-002)', async () => {
      const invalidVocab = {
        meaning_vi: 'Ăn',
      };

      const res = await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidVocab)
        .expect(422);

      expect(res.body.message).toContain('Kanji');
    });

    // UT-002: Invalid DTO (missing meaning_vi) ↁE400 + validation error
    it('should reject missing meaning_vi with 400 (UT-002)', async () => {
      const invalidVocab = {
        kanji: 'test',
      };

      const res = await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidVocab)
        .expect(422);

      expect(res.body.message).toContain('Meaning');
    });

    // UT-003: Duplicate kanji+meaning ↁE409 + DUPLICATE_VOCAB error
    it('should reject duplicate kanji+meaning with 409 (UT-003)', async () => {
      const vocab = {
        kanji: 'Duplicate',
        meaning_vi: 'Duplicate meaning',
      };

      // Create first vocabulary
      await createTestVocabDirectly({
        kanji: vocab.kanji,
        meaning_vi: vocab.meaning_vi,
        status: VocabularyStatus.Publish,
      });

      // Try to create duplicate
      const res = await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vocab)
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    // UT-004: No auth token ↁE401 Unauthorized
    it('should reject unauthenticated request with 401 (UT-004)', async () => {
      const newVocab = {
        kanji: 'Test',
        meaning_vi: 'Test meaning',
      };

      await request(app).post('/api/v1/admin/vocabularies').send(newVocab).expect(401);
    });

    // UT-005: User role='user' ↁE403 Forbidden
    it('should reject non-admin user with 403 (UT-005)', async () => {
      const newVocab = {
        kanji: 'Test',
        meaning_vi: 'Test meaning',
      };

      await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newVocab)
        .expect(403);
    });

    // UT-003: Kanji only numbers ↁE422 validation error
    it('should reject kanji with only numbers (UT-003)', async () => {
      const invalidVocab = {
        kanji: '12345',
        meaning_vi: 'Invalid kanji',
      };

      const res = await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidVocab)
        .expect(422);

      expect(res.body.message).toContain('only numbers');
    });
  });

  // ============================================================================
  // PUT /api/v1/admin/vocabularies/:id - Update Vocabulary Tests
  // ============================================================================

  describe('PUT /api/v1/admin/vocabularies/:id', () => {
    // UT-006: Valid DTO, existing vocab ↁE200 + updated vocabulary + version incremented
    it('should update vocabulary and increment version (UT-006)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Original',
        meaning_vi: 'Original meaning',
        status: VocabularyStatus.Publish,
      });

      const updateData = {
        kanji: 'Updated',
        meaning_vi: 'Updated meaning',
      };

      const res = await request(app)
        .put(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.vocabulary.kanji).toBe('Updated');
      expect(res.body.vocabulary.meaning_vi).toBe('Updated meaning');
      expect(res.body.version).toBe(2);

      // Verify change log was created
      const logs = await prisma.vocabChangeLog.findMany({
        where: { vocabId },
        orderBy: { createdAt: 'desc' },
        take: 2,
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    // UT-007: Change log created on update
    it('should create change log on update (UT-007)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'ChangeLog',
        meaning_vi: 'ChangeLog meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app)
        .put(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          kanji: 'Changed',
        })
        .expect(200);

      const logs = await prisma.vocabChangeLog.findMany({
        where: { vocabId, fieldName: 'kanji' },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].oldValue).toBe('ChangeLog');
      expect(logs[0].newValue).toBe('Changed');
    });

    // UT-008: Non-existent id ↁE404
    it('should return 404 for non-existent vocabulary (UT-008)', async () => {
      const res = await request(app)
        .put('/api/v1/admin/vocabularies/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          kanji: 'Update',
          meaning_vi: 'Update meaning',
        })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    // UT-009: Soft deleted vocab ↁE404 SOFT_DELETED
    it('should reject update on soft deleted vocabulary (UT-009)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Deleted',
        meaning_vi: 'Deleted meaning',
        status: VocabularyStatus.Delete,
      });

      const res = await request(app)
        .put(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          kanji: 'Update',
        })
        .expect(404);

      expect(res.body.message).toContain('deleted');
    });

    // UT-005: Non-admin user ↁE403 Forbidden
    it('should reject non-admin user with 403 (UT-005)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Test',
        meaning_vi: 'Test meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app)
        .put(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kanji: 'Update',
        })
        .expect(403);
    });
  });

  // ============================================================================
  // DELETE /api/v1/admin/vocabularies/:id - Delete Vocabulary Tests
  // ============================================================================

  describe('DELETE /api/v1/admin/vocabularies/:id', () => {
    // UT-010: Existing vocab ↁE200 + status='Delete'
    it('should soft delete vocabulary (UT-010)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'ToDelete',
        meaning_vi: 'To delete meaning',
        status: VocabularyStatus.Publish,
      });

      const res = await request(app)
        .delete(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('Delete');

      // Verify soft delete in database
      const after = await prisma.vocabulary.findUnique({
        where: { id: vocabId },
        select: { status: true },
      });
      expect(after?.status).toBe('Delete');
    });

    // UT-011: Non-existent id ↁE404
    it('should return 404 for non-existent vocabulary (UT-011)', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/vocabularies/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    // UT-012: No auth token ↁE401 Unauthorized
    it('should reject unauthenticated request with 401 (UT-012)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Test',
        meaning_vi: 'Test meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app).delete(`/api/v1/admin/vocabularies/${vocabId}`).expect(401);
    });

    // UT-013: Non-admin user ↁE403 Forbidden
    it('should reject non-admin user with 403 (UT-013)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Test',
        meaning_vi: 'Test meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app)
        .delete(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // ============================================================================
  // GET /api/v1/admin/vocabularies - List Vocabularies Tests
  // ============================================================================

  describe('GET /api/v1/admin/vocabularies', () => {
    // UT-014: No query params ↁE200 + paginated results (page=1, limit=20)
    it('should return paginated list with defaults (UT-014)', async () => {
      await createTestVocabDirectly({
        kanji: 'Test1',
        meaning_vi: 'Test meaning 1',
        status: VocabularyStatus.Publish,
      });

      const res = await request(app)
        .get('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });

    // UT-015: Query level=N3 ↁE200 + filtered results
    it('should filter by level (UT-015)', async () => {
      await createTestVocabDirectly({
        kanji: 'N3Vocab',
        meaning_vi: 'N3 meaning',
        level: VocabLevel.N3,
        status: VocabularyStatus.Publish,
      });

      await createTestVocabDirectly({
        kanji: 'N5Vocab',
        meaning_vi: 'N5 meaning',
        level: VocabLevel.N5,
        status: VocabularyStatus.Publish,
      });

      const res = await request(app)
        .get('/api/v1/admin/vocabularies?level=N3')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.every((v: any) => v.level === 'N3')).toBe(true);
    });

    // UT-016: Query status=Publish ↁE200 + filtered results
    it('should filter by status (UT-016)', async () => {
      await createTestVocabDirectly({
        kanji: 'PublishVocab',
        meaning_vi: 'Publish meaning',
        status: VocabularyStatus.Publish,
      });

      await createTestVocabDirectly({
        kanji: 'HideVocab',
        meaning_vi: 'Hide meaning',
        status: VocabularyStatus.Hide,
      });

      const res = await request(app)
        .get('/api/v1/admin/vocabularies?status=Publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.every((v: any) => v.status === 'Publish')).toBe(true);
    });

    // UT-017: Query kanji=食べ ↁE200 + LIKE search results
    it('should filter by kanji search (UT-017)', async () => {
      await createTestVocabDirectly({
        kanji: '食べる',
        meaning_vi: 'Eat',
        status: VocabularyStatus.Publish,
      });

      await createTestVocabDirectly({
        kanji: '飲む',
        meaning_vi: 'Drink',
        status: VocabularyStatus.Publish,
      });

      const res = await request(app)
        .get('/api/v1/admin/vocabularies?kanji=食べ')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.some((v: any) => v.kanji === '食べる')).toBe(true);
    });

    // UT-018: Query page=2&limit=10 ↁE200 + page 2, 10 items
    it('should handle pagination (UT-018)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/vocabularies?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
    });

    // Read routes only require authentication, not admin role
    it('should allow non-admin user to read vocabularies', async () => {
      await request(app).get('/api/v1/admin/vocabularies').set('Authorization', `Bearer ${userToken}`).expect(200);
    });
  });

  // ============================================================================
  // GET /api/v1/admin/vocabularies/:id - Get Vocabulary Detail Tests
  // ============================================================================

  describe('GET /api/v1/admin/vocabularies/:id', () => {
    // UT-019: Existing vocab ↁE200 + vocabulary detail + relations + logs + reports
    it('should return vocabulary detail with relations, logs, reports (UT-019)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'DetailVocab',
        meaning_vi: 'Detail meaning',
        status: VocabularyStatus.Publish,
      });

      // Create a report
      await createTestReport(vocabId, 'Test report');

      const res = await request(app)
        .get(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('vocabulary');
      expect(res.body).toHaveProperty('relations');
      expect(res.body).toHaveProperty('changeLogs');
      expect(res.body).toHaveProperty('reports');
      expect(res.body.vocabulary.kanji).toBe('DetailVocab');
    });

    // UT-020: Non-existent id ↁE404
    it('should return 404 for non-existent vocabulary (UT-020)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/vocabularies/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    // UT-021: Soft deleted ↁE404 SOFT_DELETED
    it('should return 404 for soft deleted vocabulary (UT-021)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'DeletedVocab',
        meaning_vi: 'Deleted meaning',
        status: VocabularyStatus.Delete,
      });

      const res = await request(app)
        .get(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('deleted');
    });
  });

  // ============================================================================
  // PATCH /api/v1/admin/vocabularies/:id/reports/:reportId - Resolve Report Tests
  // ============================================================================

  describe('PATCH /api/v1/admin/vocabularies/:id/reports/:reportId', () => {
    // UT-022: Valid status='resolved' ↁE200 + report status updated
    it('should resolve report with status=resolved (UT-022)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'ReportVocab',
        meaning_vi: 'Report meaning',
        status: VocabularyStatus.Publish,
      });

      const reportId = await createTestReport(vocabId, 'Test report to resolve');

      const res = await request(app)
        .patch(`/api/v1/admin/vocabularies/${vocabId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(res.body).toHaveProperty('report');
      expect(res.body.report.status).toBe('resolved');
    });

    // UT-023: Valid status='dismissed' ↁE200 + report status updated
    it('should dismiss report with status=dismissed (UT-023)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'DismissVocab',
        meaning_vi: 'Dismiss meaning',
        status: VocabularyStatus.Publish,
      });

      const reportId = await createTestReport(vocabId, 'Test report to dismiss');

      const res = await request(app)
        .patch(`/api/v1/admin/vocabularies/${vocabId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'dismissed' })
        .expect(200);

      expect(res.body).toHaveProperty('report');
      expect(res.body.report.status).toBe('dismissed');
    });

    // UT-024: Invalid status ↁE400 INVALID_STATUS
    it('should reject invalid status with 400 (UT-024)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'InvalidStatusVocab',
        meaning_vi: 'Invalid status meaning',
        status: VocabularyStatus.Publish,
      });

      const reportId = await createTestReport(vocabId, 'Test report');

      const res = await request(app)
        .patch(`/api/v1/admin/vocabularies/${vocabId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' })
        .expect(422);

      expect(res.body.message).toContain('resolved or dismissed');
    });

    // UT-025: Non-existent report ↁE404
    it('should return 404 for non-existent report (UT-025)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'NoReportVocab',
        meaning_vi: 'No report meaning',
        status: VocabularyStatus.Publish,
      });

      const res = await request(app)
        .patch(`/api/v1/admin/vocabularies/${vocabId}/reports/999999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // GET /api/v1/admin/vocabularies/:id/analytics - Analytics Tests
  // ============================================================================

  describe('GET /api/v1/admin/vocabularies/:id/analytics', () => {
    // UT-026: Existing vocab ↁE200 + analytics data
    it('should return analytics data (UT-026)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'AnalyticsVocab',
        meaning_vi: 'Analytics meaning',
        status: VocabularyStatus.Publish,
        created_by: ADMIN_ID,
      });

      const res = await request(app)
        .get(`/api/v1/admin/vocabularies/${vocabId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('learnCount');
      expect(res.body).toHaveProperty('favoriteCount');
      expect(res.body).toHaveProperty('reportCount');
      expect(res.body).toHaveProperty('relationCount');
    });

    // UT-027: Non-existent vocab ↁE404
    it('should return 404 for non-existent vocabulary (UT-027)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/vocabularies/999999/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization Tests', () => {
    // AUTH-001: Non-admin cannot create ↁE403
    it('should prevent non-admin from creating vocabulary (AUTH-001)', async () => {
      await request(app)
        .post('/api/v1/admin/vocabularies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kanji: 'Test',
          meaning_vi: 'Test meaning',
        })
        .expect(403);
    });

    // AUTH-002: Non-admin cannot update ↁE403
    it('should prevent non-admin from updating vocabulary (AUTH-002)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Test',
        meaning_vi: 'Test meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app)
        .put(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kanji: 'Updated',
        })
        .expect(403);
    });

    // AUTH-003: Non-admin cannot delete ↁE403
    it('should prevent non-admin from deleting vocabulary (AUTH-003)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'Test',
        meaning_vi: 'Test meaning',
        status: VocabularyStatus.Publish,
      });

      await request(app)
        .delete(`/api/v1/admin/vocabularies/${vocabId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    // AUTH-004: Admin can resolve reports ↁE200
    it('should allow admin to resolve reports (AUTH-004)', async () => {
      const vocabId = await createTestVocabDirectly({
        kanji: 'AdminReport',
        meaning_vi: 'Admin report meaning',
        status: VocabularyStatus.Publish,
      });

      const reportId = await createTestReport(vocabId, 'Test report');

      await request(app)
        .patch(`/api/v1/admin/vocabularies/${vocabId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' })
        .expect(200);
    });

    // AUTH-005: Unauthenticated access ↁE401
    it('should reject unauthenticated access to list (AUTH-005)', async () => {
      await request(app).get('/api/v1/admin/vocabularies').expect(401);
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

// All kanji patterns used in the test suite, kept in one place so the cleanup
// step stays in sync with the test data.
const TEST_KANJI_PATTERNS = [
  'Test', 'Duplicate', 'Update', 'Delete', 'ChangeLog', 'Detail',
  'Report', 'Dismiss', 'Invalid', 'Analytics', 'AdminReport', 'Original',
  'N3Vocab', 'N5Vocab', 'PublishVocab', 'HideVocab', '食べる', '飲む',
  'DeletedVocab', 'NoReportVocab', 'CreatedVocab',
];
const TEST_REPORT_PATTERNS = [
  'Test report',
  'Test report to resolve',
  'Test report to dismiss',
];

// Cleanup all test vocabularies + orphan reports created by the suite.
async function cleanupAllTestVocabs(): Promise<void> {
  // Delete orphan reports first (no foreign key to vocab so we match on text).
  await prisma.vocabReport.deleteMany({
    where: { reportText: { in: TEST_REPORT_PATTERNS } },
  });

  // For each kanji pattern, cascade through related tables.
  for (const kanji of TEST_KANJI_PATTERNS) {
    const ids = await prisma.vocabulary.findMany({
      where: { kanji: { contains: kanji } },
      select: { id: true },
    });
    const idList = ids.map((v) => v.id);
    if (idList.length === 0) continue;

    await prisma.vocabReport.deleteMany({ where: { vocabId: { in: idList } } });
    await prisma.vocabChangeLog.deleteMany({ where: { vocabId: { in: idList } } });
    await prisma.vocabRelation.deleteMany({
      where: { OR: [{ vocabId: { in: idList } }, { targetVocabId: { in: idList } }] },
    });
    await prisma.vocabulary.deleteMany({ where: { id: { in: idList } } });
  }
}
