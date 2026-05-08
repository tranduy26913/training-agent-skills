import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceError } from '../../models/common.model';
import { NotebookLmOperationsService } from './operations.service';

function createMockRepository() {
  return {
    listJobs: vi.fn(),
    countJobs: vi.fn(),
    findJobById: vi.fn(),
    findJobWithStepsById: vi.fn(),
    retryJob: vi.fn(),
    listDeadLetterJobs: vi.fn(),
    purgeDeadLetterJobs: vi.fn(),
    createAuditLog: vi.fn(),
  };
}

type MockRepository = ReturnType<typeof createMockRepository>;

describe('NotebookLmOperationsService', () => {
  let repository: MockRepository;
  let service: NotebookLmOperationsService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new NotebookLmOperationsService(repository as never);
  });

  it('rejects non-admin users from listing jobs', async () => {
    await expect(
      service.listJobs({ userId: 200, role: 'user' }, { page: 1, limit: 25 }),
    ).rejects.toEqual(new ServiceError('Insufficient permissions', 403));
  });

  it('returns paginated jobs list for admin', async () => {
    repository.listJobs.mockResolvedValueOnce([
      {
        id: 10,
        type: 'INGEST',
        status: 'failed',
      },
    ]);
    repository.countJobs.mockResolvedValueOnce(1);

    const result = await service.listJobs({ userId: 100, role: 'admin' }, { page: 1, limit: 25 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 25, total: 1, pages: 1 });
  });

  it('returns job details with steps for admin', async () => {
    repository.findJobWithStepsById.mockResolvedValueOnce({
      id: 99,
      status: 'processing',
      steps: [{ id: 1, step_name: 'parse', status: 'done', progress_pct: 100 }],
    });

    const result = await service.getJobDetail({ userId: 100, role: 'admin' }, 99);

    expect(result.id).toBe(99);
    expect(result.steps).toHaveLength(1);
  });

  it('retries failed job and writes audit log', async () => {
    repository.findJobById.mockResolvedValueOnce({ id: 501, status: 'failed' });
    repository.retryJob.mockResolvedValueOnce(undefined);
    repository.findJobWithStepsById.mockResolvedValueOnce({ id: 501, status: 'pending', steps: [] });

    const result = await service.retryJob({ userId: 100, role: 'admin' }, 501, 'manual retry');

    expect(result.status).toBe('pending');
    expect(repository.createAuditLog).toHaveBeenCalledTimes(1);
  });

  it('retries dead_letter job and writes audit log', async () => {
    repository.findJobById.mockResolvedValueOnce({ id: 777, status: 'dead_letter' });
    repository.retryJob.mockResolvedValueOnce(undefined);
    repository.findJobWithStepsById.mockResolvedValueOnce({ id: 777, status: 'pending', steps: [] });

    const result = await service.retryJob({ userId: 100, role: 'admin' }, 777, 'manual retry');

    expect(result.status).toBe('pending');
    expect(repository.createAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects retry when job status is not failed or dead_letter', async () => {
    repository.findJobById.mockResolvedValueOnce({ id: 601, status: 'done' });

    await expect(service.retryJob({ userId: 100, role: 'admin' }, 601, 'manual retry')).rejects.toEqual(
      new ServiceError('Only failed or dead_letter jobs can be retried', 400),
    );
  });

  it('lists dead letter queue items for admin', async () => {
    repository.listDeadLetterJobs.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const result = await service.listDeadLetterJobs({ userId: 100, role: 'admin' });

    expect(result).toHaveLength(2);
  });

  it('purges dead letter queue and writes audit log', async () => {
    repository.purgeDeadLetterJobs.mockResolvedValueOnce(3);

    const result = await service.purgeDeadLetterJobs({ userId: 100, role: 'admin' }, 'maintenance');

    expect(result.deletedCount).toBe(3);
    expect(repository.createAuditLog).toHaveBeenCalledTimes(1);
  });
});