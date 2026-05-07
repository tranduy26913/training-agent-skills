import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WorkspaceForm from '../WorkspaceForm.vue';

describe('WorkspaceForm', () => {
  beforeEach(() => {
    // no-op
  });

  it('emits submit with normalized payload when valid', async () => {
    const wrapper = mount(WorkspaceForm, {
      props: {
        mode: 'create',
      },
    });

    await wrapper.find('[data-testid="workspace-name"]').setValue('  Workspace A  ');
    await wrapper.find('[data-testid="workspace-description"]').setValue('  Shared notes  ');
    await wrapper.find('form').trigger('submit');

    const events = wrapper.emitted('submit');
    expect(events).toBeDefined();
    expect(events?.[0][0]).toEqual({
      name: 'Workspace A',
      description: 'Shared notes',
    });
  });

  it('shows validation error when name is empty', async () => {
    const wrapper = mount(WorkspaceForm, {
      props: {
        mode: 'create',
      },
    });

    await wrapper.find('[data-testid="workspace-name"]').setValue('');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Name is required');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });
});
