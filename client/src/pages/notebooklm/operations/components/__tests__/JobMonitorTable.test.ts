import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import JobMonitorTable from '../JobMonitorTable.vue';
import type { NotebooklmJobMonitorItem } from '@/types/notebooklm.types';

const rows: NotebooklmJobMonitorItem[] = [
  {
    id: 100,
    type: 'INGEST',
    status: 'failed',
    retryCount: 1,
    workerId: 'w-1',
    workspaceId: 10,
    correlationId: 'corr-100',
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:01:00.000Z',
  },
  {
    id: 101,
    type: 'QUERY',
    status: 'dead_letter',
    retryCount: 3,
    workerId: 'w-2',
    workspaceId: 11,
    correlationId: 'corr-101',
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:01:00.000Z',
  },
];

describe('JobMonitorTable', () => {
  it('emits view/retry/purge actions and renders status tags', async () => {
    const wrapper = mount(JobMonitorTable, {
      props: {
        jobs: rows,
        loading: false,
        pagination: { page: 1, limit: 25, total: 2, pages: 1 },
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(wrapper.findAll('[data-testid="job-status-tag"]')).toHaveLength(2);

    await wrapper.findAll('[data-testid="job-view-btn"]')[0].trigger('click');
    await wrapper.findAll('[data-testid="job-retry-btn"]')[0].trigger('click');
    await wrapper.findAll('[data-testid="job-purge-btn"]')[0].trigger('click');

    expect(wrapper.emitted('view')?.[0]).toEqual([100]);
    expect(wrapper.emitted('retry')?.[0]).toEqual([100]);
    expect(wrapper.emitted('purge')?.[0]).toEqual([101]);
  });
});
