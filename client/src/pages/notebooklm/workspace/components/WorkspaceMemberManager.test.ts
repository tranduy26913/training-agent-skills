import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/locales/en';
import type { WorkspaceMember, WorkspaceMemberCandidate } from '@/types/notebooklm.types';
import WorkspaceMemberManager from './WorkspaceMemberManager.vue';

vi.mock('primevue/select', () => ({
  default: {
    template: '<select data-testid="member-role-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">-</option><option value="owner">owner</option><option value="editor">editor</option><option value="viewer">viewer</option></select>',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const members: WorkspaceMember[] = [
  {
    id: 301,
    userId: 1,
    role: 'viewer',
    name: 'Alice',
    email: 'alice@example.com',
  },
];

const candidates: WorkspaceMemberCandidate[] = [
  {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
  },
];

function mountComponent(overrides?: Partial<InstanceType<typeof WorkspaceMemberManager>['$props']>) {
  return mount(WorkspaceMemberManager, {
    props: {
      members,
      candidates,
      canManage: true,
      loading: false,
      ...overrides,
    },
    global: {
      plugins: [i18n],
      stubs: {
        InputText: {
          template: '<input data-testid="workspace-member-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue'],
        },
      },
    },
  });
}

describe('WorkspaceMemberManager', () => {
  it('emits search event when user types keyword', async () => {
    const wrapper = mountComponent();

    await wrapper.find('[data-testid="workspace-member-search"]').setValue('bob');

    expect(wrapper.emitted('search')?.[0]).toEqual(['bob']);
  });

  it('requires role selection before emitting add event', async () => {
    const wrapper = mountComponent();

    await wrapper.find('[data-testid="candidate-select-2"]').trigger('click');
    await wrapper.find('[data-testid="workspace-member-add"]').trigger('click');

    expect(wrapper.emitted('add')).toBeFalsy();
    expect(wrapper.text()).toContain(en.notebooklmWorkspace.memberManager.roleRequired);
  });

  it('shows updated role when members prop is refreshed after add/upsert', async () => {
    const wrapper = mountComponent();

    await wrapper.setProps({
      members: [
        {
          id: 301,
          userId: 1,
          role: 'editor',
          name: 'Alice',
          email: 'alice@example.com',
        },
      ],
    });

    expect(wrapper.text()).toContain('editor');
  });

  it('hides add controls for non-owner access', () => {
    const wrapper = mountComponent({ canManage: false });

    expect(wrapper.find('[data-testid="workspace-member-search"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="workspace-member-add"]').exists()).toBe(false);
  });
});
