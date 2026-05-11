import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import WorkspaceTable from '../WorkspaceTable.vue';
import AppDataTable from '@/components/AppDataTable.vue';
import type { Workspace } from '@/types/notebooklm.types';

const rows: Workspace[] = [
  {
    id: 11,
    name: 'Project A',
    description: 'Internal docs',
    role: 'owner',
    documentCount: 3,
    status: 'active',
    createdAt: '2026-05-07T08:00:00.000Z',
    updatedAt: '2026-05-07T08:00:00.000Z',
  },
  {
    id: 12,
    name: 'Project B',
    description: null,
    role: 'viewer',
    documentCount: 1,
    status: 'active',
    createdAt: '2026-05-07T08:00:00.000Z',
    updatedAt: '2026-05-07T08:00:00.000Z',
  },
];

describe('WorkspaceTable', () => {
  it('renders rows and role-aware actions', async () => {
    const wrapper = mount(WorkspaceTable, {
      props: {
        workspaces: rows,
        loading: false,
      },
      global: {
        plugins: [PrimeVue],
        directives: {
          tooltip: () => undefined,
        },
      },
    });

    expect(wrapper.find('.p-datatable').exists()).toBe(true);
    expect(wrapper.find('[data-testid="workspace-open-11"]').classes()).toContain('p-button');

    expect(wrapper.text()).toContain('Project A');
    expect(wrapper.text()).toContain('Project B');

    const editButtons = wrapper.findAll('[data-testid="workspace-edit"]');
    const deleteButtons = wrapper.findAll('[data-testid="workspace-delete"]');

    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);

    await wrapper.find('[data-testid="workspace-open-11"]').trigger('click');
    expect(wrapper.emitted('open')?.[0]).toEqual([11]);
  });

  it('forwards page change event', async () => {
    const wrapper = mount(WorkspaceTable, {
      props: {
        workspaces: rows,
        loading: false,
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
        },
      },
      global: {
        plugins: [PrimeVue],
        directives: {
          tooltip: () => undefined,
        },
      },
    });

    wrapper.findComponent(AppDataTable).vm.$emit('pageChange', 2);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('pageChange')?.[0]).toEqual([2]);
  });
});
