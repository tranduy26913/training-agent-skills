import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import JobStepViewer from '../JobStepViewer.vue';
import type { NotebooklmJobDetail } from '@/types/notebooklm.types';

const detail: NotebooklmJobDetail = {
  id: 77,
  type: 'INGEST',
  status: 'failed',
  retryCount: 2,
  workerId: 'worker-1',
  workspaceId: 3,
  correlationId: 'corr-1',
  createdAt: '2026-05-08T03:00:00.000Z',
  updatedAt: '2026-05-08T03:05:00.000Z',
  payload: { key: 'value' },
  steps: [
    {
      id: 1,
      stepName: 'extract',
      status: 'done',
      detail: null,
      startedAt: null,
      finishedAt: null,
    },
    {
      id: 2,
      stepName: 'embed',
      status: 'failed',
      detail: 'vector store timeout',
      startedAt: null,
      finishedAt: null,
    },
  ],
};

describe('JobStepViewer', () => {
  it('renders timeline entries for selected job detail', () => {
    const wrapper = mount(JobStepViewer, {
      props: {
        visible: true,
        job: detail,
      },
      global: {
        plugins: [PrimeVue],
        stubs: {
          Drawer: {
            props: ['visible'],
            template: '<div v-if="visible"><slot /></div>',
          },
          Timeline: {
            props: ['value'],
            template:
              '<div><div v-for="item in value" :key="item.id"><slot name="content" :item="item" /></div></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Job #77');
    expect(wrapper.text()).toContain('extract');
    expect(wrapper.text()).toContain('embed');
    expect(wrapper.text()).toContain('vector store timeout');
    expect(wrapper.findAll('[data-testid="job-step-item"]')).toHaveLength(2);
  });
});
