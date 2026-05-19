import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import DocumentIngestionViewer from '../DocumentIngestionViewer.vue';
import type { WorkspaceDocument, WorkspaceJobProgress } from '@/types/notebooklm.types';

const docs: WorkspaceDocument[] = [
  {
    id: 501,
    workspaceId: 1,
    filename: 'notes.txt',
    mimeType: 'text/plain',
    size: 1024,
    status: 'processing',
    uploadedBy: 1,
    createdAt: '2026-05-07T08:00:00.000Z',
    updatedAt: '2026-05-07T08:00:00.000Z',
    latestJobId: 9001,
  },
];

const progress: WorkspaceJobProgress = {
  jobId: 9001,
  status: 'processing',
  steps: [
    { name: 'parse', status: 'done' },
    { name: 'chunk', status: 'running' },
  ],
  updatedAt: '2026-05-07T08:10:00.000Z',
};

describe('DocumentIngestionViewer', () => {
  it('emits upload for valid file and renders progress', async () => {
    const wrapper = mount(DocumentIngestionViewer, {
      props: {
        documents: docs,
        jobProgressById: { 9001: progress },
        canUpload: true,
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(wrapper.find('.p-card').exists()).toBe(true);
    expect(wrapper.find('.p-button').exists()).toBe(true);

    expect(wrapper.text()).toContain('parse');
    expect(wrapper.text()).toContain('chunk');

    const input = wrapper.find('[data-testid="document-upload-input"]');
    const file = new File(['hello'], 'new-notes.txt', { type: 'text/plain' });

    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    });
    await input.trigger('change');

    expect(wrapper.emitted('upload')?.[0][0]).toBe(file);
  });

  it('blocks upload when file exceeds 100MB', async () => {
    const wrapper = mount(DocumentIngestionViewer, {
      props: {
        documents: docs,
        jobProgressById: {},
        canUpload: true,
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    const input = wrapper.find('[data-testid="document-upload-input"]');
    const hugeFile = {
      name: 'big.pdf',
      type: 'application/pdf',
      size: 100 * 1024 * 1024 + 1,
    } as File;

    Object.defineProperty(input.element, 'files', {
      value: [hugeFile],
      configurable: true,
    });
    await input.trigger('change');

    expect(wrapper.text()).toContain('File size must be 100MB or less');
    expect(wrapper.emitted('upload')).toBeFalsy();
  });
});
