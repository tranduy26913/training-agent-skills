import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { NotebookLmController } from './notebooklm.controller';
import { ServiceError } from '../../models/common.model';
import type { NotebookLmService } from './notebooklm.service';

function createMockService() {
  return {
    listWorkspaces: vi.fn(),
    searchUsers: vi.fn(),
    createWorkspace: vi.fn(),
    getWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    listMembers: vi.fn(),
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    enqueueDocumentIngestion: vi.fn(),
    enqueueDocumentDeletion: vi.fn(),
    getJobStatus: vi.fn(),
  };
}

type MockService = ReturnType<typeof createMockService>;

function buildApp(service: MockService) {
  const app = express();
  app.use(express.json({ limit: '110mb' }));

  app.use((req, _res, next) => {
    (req as any).user = { userId: 100, email: 'admin@example.com', role: 'admin' };
    next();
  });

  const controller = new NotebookLmController(service as unknown as NotebookLmService);
  const router = express.Router();

  router.get('/workspaces', controller.listWorkspaces.bind(controller));
  router.get('/users/search', controller.searchUsers.bind(controller));
  router.post('/workspaces', controller.createWorkspace.bind(controller));
  router.get('/workspaces/:id', controller.getWorkspace.bind(controller));
  router.put('/workspaces/:id', controller.updateWorkspace.bind(controller));
  router.delete('/workspaces/:id', controller.deleteWorkspace.bind(controller));

  router.get('/workspaces/:id/members', controller.listMembers.bind(controller));
  router.post('/workspaces/:id/members', controller.addMember.bind(controller));
  router.put('/workspaces/:id/members/:userId', controller.updateMemberRole.bind(controller));
  router.delete('/workspaces/:id/members/:userId', controller.removeMember.bind(controller));

  router.post('/workspaces/:id/documents', controller.uploadDocument.bind(controller));
  router.delete('/workspaces/:id/documents/:docId', controller.deleteDocument.bind(controller));

  router.get('/jobs/:jobId', controller.getJobStatus.bind(controller));

  app.use('/api/notebooklm', router);

  return app;
}

describe('NotebookLmController', () => {
  let service: MockService;

  beforeEach(() => {
    service = createMockService();
  });

  it('returns 201 on workspace create', async () => {
    service.createWorkspace.mockResolvedValueOnce({ id: 10, name: 'Workspace A' });

    const res = await request(buildApp(service))
      .post('/api/notebooklm/workspaces')
      .send({ name: 'Workspace A', description: 'docs' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
  });

  it('returns paginated search result for users', async () => {
    service.searchUsers.mockResolvedValueOnce({
      data: [{ id: 201, name: 'An Nguyen', email: 'an.nguyen@example.com' }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });

    const res = await request(buildApp(service)).get('/api/notebooklm/users/search?q=an&page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });
    expect(service.searchUsers).toHaveBeenCalledWith({ q: 'an', page: 1, limit: 10 }, 100);
  });

  it('returns 200 on workspace member add upsert', async () => {
    service.addMember.mockResolvedValueOnce([
      { id: 1, workspace_id: 10, user_id: 100, role: 'owner' },
      { id: 2, workspace_id: 10, user_id: 201, role: 'editor' },
    ]);

    const res = await request(buildApp(service))
      .post('/api/notebooklm/workspaces/10/members')
      .send({ userId: 201, role: 'editor' });

    expect(res.status).toBe(200);
  });

  it('returns 202 and job id on document upload enqueue', async () => {
    service.enqueueDocumentIngestion.mockResolvedValueOnce({ documentId: 501, jobId: 9001 });

    const res = await request(buildApp(service))
      .post('/api/notebooklm/workspaces/10/documents')
      .send({
        filename: 'spec.md',
        mimeType: 'text/markdown',
        fileSize: 9,
        fileDataBase64: Buffer.from('content').toString('base64'),
      });

    expect(res.status).toBe(202);
    expect(res.body.jobId).toBe(9001);
    expect(res.body.documentId).toBe(501);
  });

  it('returns 202 and job id on document delete enqueue', async () => {
    service.enqueueDocumentDeletion.mockResolvedValueOnce({ jobId: 9002 });

    const res = await request(buildApp(service)).delete('/api/notebooklm/workspaces/10/documents/77');

    expect(res.status).toBe(202);
    expect(res.body.jobId).toBe(9002);
  });

  it('maps viewer upload permission errors to 403', async () => {
    service.enqueueDocumentIngestion.mockRejectedValueOnce(new ServiceError('Insufficient permissions', 403));

    const res = await request(buildApp(service))
      .post('/api/notebooklm/workspaces/10/documents')
      .send({
        filename: 'spec.md',
        mimeType: 'text/markdown',
        fileSize: 9,
        fileDataBase64: Buffer.from('content').toString('base64'),
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('maps viewer delete permission errors to 403', async () => {
    service.enqueueDocumentDeletion.mockRejectedValueOnce(new ServiceError('Insufficient permissions', 403));

    const res = await request(buildApp(service)).delete('/api/notebooklm/workspaces/10/documents/77');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('returns job status response', async () => {
    service.getJobStatus.mockResolvedValueOnce({
      id: 9001,
      status: 'processing',
      steps: [
        { id: 1, step_name: 'parse', status: 'done', progress_pct: 100 },
      ],
    });

    const res = await request(buildApp(service)).get('/api/notebooklm/jobs/9001');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('processing');
    expect(res.body.steps).toHaveLength(1);
  });

  it('returns 404 when job not found', async () => {
    service.getJobStatus.mockRejectedValueOnce(new ServiceError('Job not found', 404));

    const res = await request(buildApp(service)).get('/api/notebooklm/jobs/9999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Job not found');
  });
});
