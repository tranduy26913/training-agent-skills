import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotebooklmOperationsStore } from '../notebooklm-operations.store';
import type { PaginatedData } from '@/types/api.types';
import type { NotebooklmJobDetail, NotebooklmJobMonitorItem } from '@/types/notebooklm.types';

const serviceMocks = vi.hoisted(() => ({
  getJobs: vi.fn(),
  getJob: vi.fn(),
  retryJob: vi.fn(),
  getDlqItems: vi.fn(),
  getDlqItem: vi.fn(),
  updateDlqItem: vi.fn(),
  purgeDlq: vi.fn(),
}));

vi.mock('@/services/notebooklm-operations.service', () => ({
  notebooklmOperationsService: serviceMocks,
}));

const row: NotebooklmJobMonitorItem = {
  id: 100,
  type: 'INGEST',
  status: 'failed',
  retryCount: 2,
  workerId: 'worker-a',
  workspaceId: 3,
  correlationId: 'corr-a',
  createdAt: '2026-05-08T01:00:00.000Z',
  updatedAt: '2026-05-08T01:01:00.000Z',
};

const detail: NotebooklmJobDetail = {
  ...row,
  payload: { workspaceId: 3 },
  steps: [],
};

describe('useNotebooklmOperationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads jobs with filters', async () => {
    const payload: PaginatedData<NotebooklmJobMonitorItem> = {
      data: [row],
      pagination: { page: 1, limit: 25, total: 1, pages: 1 },
    };
    serviceMocks.getJobs.mockResolvedValue(payload);

    const store = useNotebooklmOperationsStore();
    await store.fetchItems({ status: 'failed', page: 1, limit: 25 });

    expect(store.items).toHaveLength(1);
    expect(store.items[0].status).toBe('failed');
    expect(serviceMocks.getJobs).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('loads job detail for step viewer', async () => {
    serviceMocks.getJob.mockResolvedValue(detail);

    const store = useNotebooklmOperationsStore();
    await store.fetchItem(100);

    expect(store.currentItem?.id).toBe(100);
    expect(serviceMocks.getJob).toHaveBeenCalledWith(100);
  });

  it('retries a failed job and updates list row', async () => {
    const retried: NotebooklmJobMonitorItem = { ...row, status: 'pending', retryCount: 0 };
    serviceMocks.retryJob.mockResolvedValue(retried);

    const store = useNotebooklmOperationsStore();
    store.items = [row];

    const result = await store.createItem(100, { reason: 'manual retry' });

    expect(result.status).toBe('pending');
    expect(store.items[0].status).toBe('pending');
    expect(serviceMocks.retryJob).toHaveBeenCalledWith(100, { reason: 'manual retry' });
  });

  it('purges DLQ items and refreshes dlq list', async () => {
    serviceMocks.purgeDlq.mockResolvedValue(undefined);
    serviceMocks.getDlqItems.mockResolvedValue([]);

    const store = useNotebooklmOperationsStore();
    await store.deleteItem({ ids: [9] });

    expect(serviceMocks.purgeDlq).toHaveBeenCalledWith({ ids: [9] });
    expect(serviceMocks.getDlqItems).toHaveBeenCalledOnce();
  });
});
