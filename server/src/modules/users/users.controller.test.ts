import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import app from '../../app';
import { pool } from '../../database/connection';
import { signToken } from '../../utils/token.util';
import { hashPassword } from '../../utils/hash.util';

// 環境変数を読み込む / Load environment variables from project root
// これによりテストDB（app_db_test）が使用される / Ensures test database is used
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const ADMIN_ID = 1000;
const ADMIN_EMAIL = 'admin@app.com';
const TEST_USER_PASSWORD = 'password123';

// テストで使用する固定メールアドレス / Fixed test emails used across tests
const TEST_EMAILS = {
  regularUser: 'regularuser.controller@test.com',
  newUser: 'newuser.controller@test.com',
  duplicate: 'duplicate.controller@test.com',
  updateUser: 'updateuser.controller@test.com',
  conflict: 'conflict.controller@test.com',
  john: 'john.controller@test.com',
  getById: 'getbyid.controller@test.com',
  deleteUser: 'deleteuser.controller@test.com',
  checkEmail: 'checkemail.controller@test.com',
  futureBirthday: 'future.controller@test.com',
  invalidName: 'invalid.controller@test.com',
  activity: 'activity.controller@test.com',
};

// 管理者JWTトークンを生成 / Generate admin JWT token
function getAdminToken(): string {
  return signToken({ userId: ADMIN_ID, email: ADMIN_EMAIL, role: 'admin' });
}

// 一般ユーザーのJWTトークンを生成 / Generate regular user JWT token
function getUserToken(userId: number, email: string): string {
  return signToken({ userId, email, role: 'user' });
}

// メールアドレスでテストユーザーを削除 / Delete test user by email
async function cleanupTestUserByEmail(email: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  const user = rows[0] as { id: number } | undefined;
  if (user) {
    // FK制約のため監査ログを先に削除 / Delete audit logs first due to FK constraints
    await pool.query('DELETE FROM audit_logs WHERE target_user_id = ? OR admin_id = ?', [user.id, user.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [user.id]);
  }
}

// 全テストメールのクリーンアップ / Cleanup all known test emails
async function cleanupAllTestUsers(): Promise<void> {
  await Promise.all(Object.values(TEST_EMAILS).map(cleanupTestUserByEmail));
}

// DBにテストユーザーを直接作成 / Create test user directly in database
async function createTestUserDirectly(data: {
  name: string;
  email: string;
  role?: string;
  status?: string;
  note?: string | null;
  birthday?: string | null;
}): Promise<number> {
  const hashedPassword = await hashPassword(TEST_USER_PASSWORD);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email, password, role, status, note, birthday) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      data.name,
      data.email,
      hashedPassword,
      data.role || 'user',
      data.status || 'active',
      data.note ?? null,
      data.birthday ?? null,
    ],
  );
  return result.insertId;
}

describe('UsersController Integration Tests', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = getAdminToken();

    // 権限不足テスト用の一般ユーザーを作成 / Create regular user for forbidden tests
    await cleanupTestUserByEmail(TEST_EMAILS.regularUser);
    const regularUserId = await createTestUserDirectly({
      name: 'Regular User',
      email: TEST_EMAILS.regularUser,
      role: 'user',
      status: 'active',
    });
    userToken = getUserToken(regularUserId, TEST_EMAILS.regularUser);
  });

  beforeEach(async () => {
    // 各テスト前にクリーンアップ / Cleanup before each test
    await cleanupAllTestUsers();
  });

  afterEach(async () => {
    // 各テスト後にクリーンアップ / Cleanup after each test
    await cleanupAllTestUsers();
    // 管理者のpointsを元に戻す / Reset admin points to default
    await pool.query<ResultSetHeader>('UPDATE users SET points = 0 WHERE id = ?', [ADMIN_ID]);
  });

  afterAll(async () => {
    await cleanupTestUserByEmail(TEST_EMAILS.regularUser);
    await pool.end();
  });

  describe('GET /api/users', () => {
    // I-BE-01: Admin authenticated, no filters → 200 + data[] + pagination
    it('should return paginated users for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
      });
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(res.body.pagination.pages).toBeGreaterThanOrEqual(0);
    });

    // I-BE-02: Non-admin user → 403
    it('should reject non-admin user with 403', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    // I-BE-03: No auth → 401
    it('should reject unauthenticated request with 401', async () => {
      await request(app).get('/api/users').expect(401);
    });

    // I-BE-04: With search=john&role=admin → 200 + filtered results
    it('should filter by search and role', async () => {
      await createTestUserDirectly({
        name: 'John Controller Admin',
        email: TEST_EMAILS.john,
        role: 'admin',
        status: 'active',
      });

      const res = await request(app)
        .get('/api/users?search=john&role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((u: any) => u.role === 'admin')).toBe(true);
      expect(res.body.data.some((u: any) => u.email === TEST_EMAILS.john)).toBe(true);
    });

    // I-BE-05: page=2&limit=25 → 200 + correct offset
    it('should return correct pagination for page 2 with limit 25', async () => {
      const res = await request(app)
        .get('/api/users?page=2&limit=25')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(25);
      expect(Array.isArray(res.body.data)).toBe(true);
      // テストDBは25件未満を前提 / Assumes test DB has fewer than 25 users
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('POST /api/users', () => {
    // I-BE-06: Valid body, unique email → 201 + UserDto
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'New Controller User',
        email: TEST_EMAILS.newUser,
        role: 'user',
        status: 'active',
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.email).toBe(newUser.email);
      expect(res.body.name).toBe(newUser.name);
      expect(res.body.role).toBe(newUser.role);
      expect(res.body.status).toBe(newUser.status);
      expect(res.body).not.toHaveProperty('password');

      // DBに実際に作成されたことを確認 / Verify user was actually created in DB
      const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [newUser.email]);
      expect(rows.length).toBe(1);
    });

    // I-BE-07: Duplicate email → 409
    it('should reject duplicate email with 409', async () => {
      await createTestUserDirectly({
        name: 'Duplicate User',
        email: TEST_EMAILS.duplicate,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another User',
          email: TEST_EMAILS.duplicate,
          role: 'user',
          status: 'active',
        })
        .expect(409);

      expect(res.body.message).toContain('Email already exists');
    });

    // I-BE-08: Invalid body (short name) → 400/422
    it('should reject invalid body with short name', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          email: TEST_EMAILS.invalidName,
          role: 'user',
          status: 'active',
        })
        .expect(422);

      expect(res.body.message).toContain('Name must be at least 2 characters');
    });

    // I-BE-09: Birthday in the future → 400/422
    it('should reject future birthday', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Future Birthday User',
          email: TEST_EMAILS.futureBirthday,
          role: 'user',
          status: 'active',
          birthday: futureDateStr,
        })
        .expect(422);

      expect(res.body.message).toContain('Birthday cannot be in the future');
    });
  });

  describe('GET /api/users/:id', () => {
    // I-BE-10: Existing user → 200 + UserDto
    it('should return existing user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Get By Id User',
        email: TEST_EMAILS.getById,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe(TEST_EMAILS.getById);
      expect(res.body).not.toHaveProperty('password');
    });

    // I-BE-11: Non-existent user → 404
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    // I-BE-12: Valid update → 200 + updated UserDto
    it('should update user with valid data', async () => {
      const userId = await createTestUserDirectly({
        name: 'Update User',
        email: TEST_EMAILS.updateUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: TEST_EMAILS.updateUser,
          role: 'moderator',
          status: 'inactive',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.role).toBe('moderator');
      expect(res.body.status).toBe('inactive');
    });

    // I-BE-13: Email conflicts with another user → 409
    it('should reject email conflict with another user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Update User',
        email: TEST_EMAILS.updateUser,
        role: 'user',
        status: 'active',
      });

      await createTestUserDirectly({
        name: 'Conflict User',
        email: TEST_EMAILS.conflict,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: TEST_EMAILS.conflict,
          role: 'user',
          status: 'active',
        })
        .expect(409);

      expect(res.body.message).toContain('Email already exists');
    });

    // I-BE-14: Email same as self → OK
    it('should allow email same as self', async () => {
      const userId = await createTestUserDirectly({
        name: 'Same Email User',
        email: TEST_EMAILS.updateUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Same Email Updated',
          email: TEST_EMAILS.updateUser,
          role: 'user',
          status: 'active',
        })
        .expect(200);

      expect(res.body.name).toBe('Same Email Updated');
    });

    // I-BE-15: Attempt to set points → 200 + points unchanged
    it('should ignore points field and keep it unchanged', async () => {
      await pool.query<ResultSetHeader>('UPDATE users SET points = 100 WHERE id = ?', [ADMIN_ID]);

      const res = await request(app)
        .put(`/api/users/${ADMIN_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated',
          email: ADMIN_EMAIL,
          role: 'admin',
          status: 'active',
          points: 9999,
        })
        .expect(200);

      expect(res.body.points).toBe(100);
      expect(res.body.points).not.toBe(9999);
    });
  });

  describe('DELETE /api/users/:id', () => {
    // I-BE-16: Delete other user → 200
    it('should delete another user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Delete User',
        email: TEST_EMAILS.deleteUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('User deleted successfully');

      const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [userId]);
      expect(rows.length).toBe(0);
    });

    // I-BE-17: Delete self → 400
    it('should reject self-delete with 400', async () => {
      const res = await request(app)
        .delete(`/api/users/${ADMIN_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.message).toContain('Cannot delete your own account');
    });

    // I-BE-18: Non-existent user → 404
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('GET /api/users/:id/activity', () => {
    // I-BE-19: Existing user → 200 + data[]
    it('should return audit logs for existing user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Activity User',
        email: TEST_EMAILS.activity,
        role: 'user',
        status: 'active',
      });

      // 監査ログを直接作成 / Create audit log directly
      await pool.query<ResultSetHeader>(
        'INSERT INTO audit_logs (admin_id, target_user_id, action, changed_fields) VALUES (?, ?, ?, ?)',
        [ADMIN_ID, userId, 'CREATE', null],
      );

      const res = await request(app)
        .get(`/api/users/${userId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].action).toBe('CREATE');
      expect(res.body[0].target_user_id).toBe(userId);
      expect(res.body[0]).toHaveProperty('admin_name');
    });

    // I-BE-20: Non-existent user → 404
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999999/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('GET /api/users/check-email', () => {
    // I-BE-21: Not exists → 200 + {exists:false}
    it('should return exists=false for unused email', async () => {
      const res = await request(app)
        .get('/api/users/check-email?email=unused.controller@test.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: false });
    });

    // I-BE-22: Exists → 200 + {exists:true}
    it('should return exists=true for existing email', async () => {
      await createTestUserDirectly({
        name: 'Check Email User',
        email: TEST_EMAILS.checkEmail,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/users/check-email?email=${encodeURIComponent(TEST_EMAILS.checkEmail)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: true });
    });

    // I-BE-23: Exists + excludeId = same user → 200 + {exists:false}
    it('should return exists=false when excludeId matches same user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Check Email User',
        email: TEST_EMAILS.checkEmail,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/users/check-email?email=${encodeURIComponent(TEST_EMAILS.checkEmail)}&excludeId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: false });
    });

    // I-BE-24: Missing email param → 400/422
    it('should reject missing email param', async () => {
      const res = await request(app)
        .get('/api/users/check-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422);

      expect(res.body.message).toMatch(/Invalid email address|Required/);
    });
  });
});
