import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '@app';
import { prisma } from '@database/prisma';
import { signToken } from '@utils/token.util';
import { hashPassword } from '@utils/hash.util';

const ADMIN_EMAIL = 'admin.controller@test.com';
const TEST_USER_PASSWORD = 'password123';
let adminId: number;

// Fixed test emails used across tests.
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

function getAdminToken(): string {
  return signToken({ userId: adminId, email: ADMIN_EMAIL, role: 'admin' });
}

function getUserToken(userId: number, email: string): string {
  return signToken({ userId, email, role: 'user' });
}

// Delete a test user (and its audit logs) by email.
async function cleanupTestUserByEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.auditLog.deleteMany({
      where: { OR: [{ targetUserId: user.id }, { adminId: user.id }] },
    });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function cleanupAllTestUsers(): Promise<void> {
  await Promise.all(Object.values(TEST_EMAILS).map(cleanupTestUserByEmail));
}

async function createTestUserDirectly(data: {
  name: string;
  email: string;
  role?: string;
  status?: string;
  note?: string | null;
  birthday?: string | null;
}): Promise<number> {
  const hashedPassword = await hashPassword(TEST_USER_PASSWORD);
  const created = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'user',
      status: data.status || 'active',
      note: data.note ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
    },
    select: { id: true },
  });
  return created.id;
}

describe('UsersController Integration Tests', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await cleanupTestUserByEmail(ADMIN_EMAIL);
    adminId = await createTestUserDirectly({
      name: 'Test Administrator',
      email: ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
    });
    adminToken = getAdminToken();

    // Regular user for forbidden-access tests.
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
    await cleanupAllTestUsers();
  });

  afterEach(async () => {
    await cleanupAllTestUsers();
    // Reset admin points to default.
    await prisma.user.update({ where: { id: adminId }, data: { points: 0 } });
  });

  afterAll(async () => {
    await cleanupTestUserByEmail(TEST_EMAILS.regularUser);
    await cleanupTestUserByEmail(ADMIN_EMAIL);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return paginated users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({ page: 1, limit: 20 });
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(res.body.pagination.pages).toBeGreaterThanOrEqual(0);
    });

    it('should reject non-admin user with 403', async () => {
      await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app).get('/api/v1/admin/users').expect(401);
    });

    it('should filter by search and role', async () => {
      await createTestUserDirectly({
        name: 'John Controller Admin',
        email: TEST_EMAILS.john,
        role: 'admin',
        status: 'active',
      });

      const res = await request(app)
        .get('/api/v1/admin/users?search=john&role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((u: any) => u.role === 'admin')).toBe(true);
      expect(res.body.data.some((u: any) => u.email === TEST_EMAILS.john)).toBe(true);
    });

    it('should return correct pagination for page 2 with limit 25', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=2&limit=25')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(25);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('POST /api/v1/admin/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'New Controller User',
        email: TEST_EMAILS.newUser,
        role: 'user',
        status: 'active',
      };

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.email).toBe(newUser.email);
      expect(res.body.name).toBe(newUser.name);
      expect(res.body.role).toBe(newUser.role);
      expect(res.body.status).toBe(newUser.status);
      expect(res.body).not.toHaveProperty('password');

      // Verify the user was actually created in the DB.
      const created = await prisma.user.findUnique({ where: { email: newUser.email } });
      expect(created).not.toBeNull();
    });

    it('should reject duplicate email with 409', async () => {
      await createTestUserDirectly({
        name: 'Duplicate User',
        email: TEST_EMAILS.duplicate,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/v1/admin/users')
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

    it('should reject invalid body with short name', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          email: TEST_EMAILS.invalidName,
          role: 'user',
          status: 'active',
        })
        .expect(400);

      expect(res.body.message).toContain('Name must be at least 2 characters');
    });

    it('should reject future birthday', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Future Birthday User',
          email: TEST_EMAILS.futureBirthday,
          role: 'user',
          status: 'active',
          birthday: futureDateStr,
        })
        .expect(400);

      expect(res.body.message).toContain('Birthday cannot be in the future');
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should return existing user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Get By Id User',
        email: TEST_EMAILS.getById,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe(TEST_EMAILS.getById);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('PUT /api/v1/admin/users/:id', () => {
    it('should update user with valid data', async () => {
      const userId = await createTestUserDirectly({
        name: 'Update User',
        email: TEST_EMAILS.updateUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/v1/admin/users/${userId}`)
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
        .put(`/api/v1/admin/users/${userId}`)
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

    it('should allow email same as self', async () => {
      const userId = await createTestUserDirectly({
        name: 'Same Email User',
        email: TEST_EMAILS.updateUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/v1/admin/users/${userId}`)
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

    it('should ignore points field and keep it unchanged', async () => {
      await prisma.user.update({ where: { id: adminId }, data: { points: 100 } });

      const res = await request(app)
        .put(`/api/v1/admin/users/${adminId}`)
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

  describe('DELETE /api/v1/admin/users/:id', () => {
    it('should delete another user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Delete User',
        email: TEST_EMAILS.deleteUser,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('User deleted successfully');

      const after = await prisma.user.findUnique({ where: { id: userId } });
      expect(after).toBeNull();
    });

    it('should reject self-delete with 400', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.message).toContain('Cannot delete your own account');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('GET /api/v1/admin/users/:id/activity', () => {
    it('should return audit logs for existing user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Activity User',
        email: TEST_EMAILS.activity,
        role: 'user',
        status: 'active',
      });

      await prisma.auditLog.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'CREATE',
          changedFields: undefined,
        },
      });

      const res = await request(app)
        .get(`/api/v1/admin/users/${userId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].action).toBe('CREATE');
      expect(res.body[0].target_user_id).toBe(userId);
      expect(res.body[0]).toHaveProperty('admin_name');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/999999/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('User not found');
    });
  });

  describe('GET /api/v1/admin/users/check-email', () => {
    it('should return exists=false for unused email', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/check-email?email=unused.controller@test.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: false });
    });

    it('should return exists=true for existing email', async () => {
      await createTestUserDirectly({
        name: 'Check Email User',
        email: TEST_EMAILS.checkEmail,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/admin/users/check-email?email=${encodeURIComponent(TEST_EMAILS.checkEmail)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: true });
    });

    it('should return exists=false when excludeId matches same user', async () => {
      const userId = await createTestUserDirectly({
        name: 'Check Email User',
        email: TEST_EMAILS.checkEmail,
        role: 'user',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/admin/users/check-email?email=${encodeURIComponent(TEST_EMAILS.checkEmail)}&excludeId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ exists: false });
    });

    it('should reject missing email param', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/check-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.message).toMatch(/Invalid email address|Required/);
    });
  });
});
