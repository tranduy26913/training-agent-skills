// ProjectsController integration tests.
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import app from '@app';
import { prisma } from '@database/prisma';
import { signToken } from '@utils/token.util';
import { hashPassword } from '@utils/hash.util';

// Load env from project root so the test DB (app_db_test) is used.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const ADMIN_EMAIL = 'admin@app.com';
const TEST_USER_PASSWORD = 'password123';

// Fixed test emails used across tests.
const TEST_EMAILS = {
  regularUser: 'reguser.proj.test@test.com',
};

const TEST_PROJECT_NAMES = {
  toCreate: 'Test Project Create',
  toUpdate: 'Test Project Update',
  toDelete: 'Test Project Delete',
  listA: 'Project Alpha',
  listB: 'Project Beta',
  listCDeleted: 'Project Deleted',
};

let adminId: number;

function getAdminToken(): string {
  return signToken({ userId: adminId, email: ADMIN_EMAIL, role: 'admin' });
}

function getUserToken(userId: number, email: string): string {
  return signToken({ userId, email, role: 'user' });
}

// Cleanup all test projects by name.
async function cleanupTestProjects(): Promise<void> {
  await prisma.project.deleteMany({
    where: {
      name: { in: Object.values(TEST_PROJECT_NAMES) },
    },
  });
}

// Create a test project directly in DB.
async function createTestProject(data: {
  name: string;
  description?: string | null;
  projectPrompt?: string | null;
  ownerId?: number;
}): Promise<number> {
  const created = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      projectPrompt: data.projectPrompt ?? null,
      headline: null,
      caption: null,
      subtext: null,
      ownerId: data.ownerId ?? adminId,
    },
    select: { id: true },
  });
  return created.id;
}

describe('ProjectsController Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let regularUserId: number;

  beforeAll(async () => {
    // Fetch the actual admin ID from the database.
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
      select: { id: true },
    });
    adminId = admin.id;
    adminToken = getAdminToken();

    // Create a regular user for forbidden-access tests.
    const hashedPassword = await hashPassword(TEST_USER_PASSWORD);
    const user = await prisma.user.upsert({
      where: { email: TEST_EMAILS.regularUser },
      update: {},
      create: {
        name: 'Regular User',
        email: TEST_EMAILS.regularUser,
        password: hashedPassword,
        role: 'user',
        status: 'active',
      },
      select: { id: true },
    });
    regularUserId = user.id;
    userToken = getUserToken(regularUserId, TEST_EMAILS.regularUser);
  });

  beforeEach(async () => {
    await cleanupTestProjects();
  });

  afterEach(async () => {
    await cleanupTestProjects();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAILS.regularUser } });
    await prisma.$disconnect();
  });

  // ─── SV-001: GET /api/v1/admin/projects ───────────────────────────

  describe('GET /api/v1/admin/projects', () => {
    it('should return all non-deleted projects for admin', async () => {
      await createTestProject({ name: TEST_PROJECT_NAMES.listA });
      await createTestProject({ name: TEST_PROJECT_NAMES.listB });

      const res = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should exclude soft-deleted projects', async () => {
      await createTestProject({ name: TEST_PROJECT_NAMES.listA });
      const deletedId = await createTestProject({ name: TEST_PROJECT_NAMES.listCDeleted });
      await prisma.project.update({ where: { id: deletedId }, data: { isDeleted: true } });

      const res = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const names = res.body.data.map((p: any) => p.name);
      expect(names).not.toContain(TEST_PROJECT_NAMES.listCDeleted);
    });

    it('should reject non-admin user with 403', async () => {
      await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app).get('/api/v1/admin/projects').expect(401);
    });
  });

  // ─── SV-002: POST /api/v1/admin/projects ──────────────────────────

  describe('POST /api/v1/admin/projects', () => {
    it('should create a new project with valid data', async () => {
      const newProject = {
        name: TEST_PROJECT_NAMES.toCreate,
        description: 'A test project description',
        projectPrompt: 'You are a content creator for a test brand.',
      };

      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProject)
        .expect(201);

      expect(res.body.data.name).toBe(newProject.name);
      expect(res.body.data.description).toBe(newProject.description);
      expect(res.body.data.projectPrompt).toBe(newProject.projectPrompt);
      expect(res.body.data.ownerId).toBe(adminId);
      expect(res.body.data.ownerName).toBeTruthy();
    });

    it('should reject empty name with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(422);

      expect(res.body.message).toContain('Tên project phải từ 2-200 ký tự');
    });

    it('should reject name too short with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' })
        .expect(422);

      expect(res.body.message).toContain('Tên project phải từ 2-200 ký tự');
    });
  });

  // ─── SV-003: GET /api/v1/admin/projects/:id ──────────────────────

  describe('GET /api/v1/admin/projects/:id', () => {
    it('should return existing project', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toCreate });

      const res = await request(app)
        .get(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data.name).toBe(TEST_PROJECT_NAMES.toCreate);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/v1/admin/projects/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toContain('Project not found');
    });

    it('should return 404 for soft-deleted project', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toDelete });
      await prisma.project.update({ where: { id: projectId }, data: { isDeleted: true } });

      await request(app)
        .get(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── SV-004: PUT /api/v1/admin/projects/:id ──────────────────────

  describe('PUT /api/v1/admin/projects/:id', () => {
    it('should update an existing project', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toUpdate });

      const res = await request(app)
        .put(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', description: 'Updated description' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .put('/api/v1/admin/projects/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nope' })
        .expect(404);
    });

    it('should reject name too long with 400', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toUpdate });

      const res = await request(app)
        .put(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A'.repeat(201) })
        .expect(422);

      expect(res.body.message).toContain('Tên project phải từ 2-200 ký tự');
    });
  });

  // ─── SV-005: DELETE /api/v1/admin/projects/:id ────────────────────

  describe('DELETE /api/v1/admin/projects/:id', () => {
    it('should soft-delete an existing project', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toDelete });

      const res = await request(app)
        .delete(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('Project deleted successfully');

      // Verify soft delete in DB.
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      expect(project?.isDeleted).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/v1/admin/projects/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for already deleted project', async () => {
      const projectId = await createTestProject({ name: TEST_PROJECT_NAMES.toDelete });
      await prisma.project.update({ where: { id: projectId }, data: { isDeleted: true } });

      await request(app)
        .delete(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── Authorization ────────────────────────────────────────────────

  describe('Authorization', () => {
    it('admin can access list', async () => {
      await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('user cannot access list', async () => {
      await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('admin can create', async () => {
      await request(app)
        .post('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Auth Test' })
        .expect(201);
    });

    it('user cannot delete', async () => {
      const projectId = await createTestProject({ name: 'Auth Del' });
      await request(app)
        .delete(`/api/v1/admin/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
