import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireRole } from '../../middleware/auth.middleware';
import { NotebookLmOperationsController } from './operations.controller';
import type { NotebookLmOperationsService } from './operations.service';

function createMockService() {
  return {
    listJobs: vi.fn(),
    getJobDetail: vi.fn(),
    retryJob: vi.fn(),
    listDeadLetterJobs: vi.fn(),
    purgeDeadLetterJobs: vi.fn(),
  };
}

type MockService = ReturnType<typeof createMockService>;

function buildApp(service: MockService) {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    const roleHeader = req.header('x-test-role');
    (req as any).user = {
      userId: Number(req.header('x-test-user-id') ?? 100),
      email: 'admin@example.com',
      role: roleHeader ?? 'admin',
    };
    next();
  });

  const controller = new NotebookLmOperationsController(service as unknown as NotebookLmOperationsService);
  const router = express.Router();
  router.use(requireRole('admin'));

  router.get('/jobs', controller.listJobs.bind(controller));
  router.get('/jobs/:id', controller.getJobDetail.bind(controller));
  router.post('/jobs/:id/retry', controller.retryJob.bind(controller));
  router.get('/dlq', controller.listDeadLetterJobs.bind(controller));
  router.delete('/dlq', controller.purgeDeadLetterJobs.bind(controller));

  app.use('/api/notebooklm/admin', router);

  return app;
}

describe('NotebookLmOperationsController', () => {
  let service: MockService;

  beforeEach(() => {
    service = createMockService();
  });

  it('returns 403 for non-admin requests', async () => {
    const res = await request(buildApp(service)).get('/api/notebooklm/admin/jobs').set('x-test-role', 'user');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('lists jobs for admin', async () => {
    service.listJobs.mockResolvedValueOnce({
      data: [{ id: 1, type: 'INGEST', status: 'failed' }],
      pagination: { page: 1, limit: 25, total: 1, pages: 1 },
    });

    const res = await request(buildApp(service)).get('/api/notebooklm/admin/jobs');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(service.listJobs).toHaveBeenCalledTimes(1);
  });

  it('returns job detail with steps for admin', async () => {
    service.getJobDetail.mockResolvedValueOnce({
      id: 1,
      status: 'failed',
      steps: [{ id: 10, step_name: 'parse', status: 'failed', progress_pct: 20 }],
    });

    const res = await request(buildApp(service)).get('/api/notebooklm/admin/jobs/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.steps).toHaveLength(1);
  });

  it('retries job for admin', async () => {
    service.retryJob.mockResolvedValueOnce({ id: 2, status: 'pending', steps: [] });

    const res = await request(buildApp(service))
      .post('/api/notebooklm/admin/jobs/2/retry')
      .send({ reason: 'manual retry' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(service.retryJob).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      2,
      'manual retry',
    );
  });

  it('lists dead letter jobs for admin', async () => {
    service.listDeadLetterJobs.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const res = await request(buildApp(service)).get('/api/notebooklm/admin/dlq');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('purges dead letter jobs for admin', async () => {
    service.purgeDeadLetterJobs.mockResolvedValueOnce({ deletedCount: 5, message: 'Deleted successfully' });

    const res = await request(buildApp(service))
      .delete('/api/notebooklm/admin/dlq')
      .send({ reason: 'cleanup' });

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(5);
    expect(service.purgeDeadLetterJobs).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      'cleanup',
    );
  });
});