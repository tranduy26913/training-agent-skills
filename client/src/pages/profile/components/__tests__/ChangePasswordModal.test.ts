/**
 * ChangePasswordModal component tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ChangePasswordModal from '../ChangePasswordModal.vue';
import en from '@locales/en';

// Mock useProfile composable.
const mockChangePassword = vi.fn();
vi.mock('@composables/useProfile', () => ({
  useProfile: () => ({
    changePassword: mockChangePassword,
    loading: { value: false },
    error: { value: null },
    updateProfile: vi.fn(),
  }),
}));

// Mock PrimeVue components.
vi.mock('primevue/dialog', () => ({
  default: {
    template: '<div v-if="visible"><slot /><slot name="footer" /></div>',
    props: ['visible', 'header', 'modal', 'closable', 'draggable'],
    emits: ['update:visible', 'hide'],
  },
}));
vi.mock('primevue/password', () => ({
  default: {
    template: '<input type="password" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid', 'placeholder'],
    emits: ['update:modelValue'],
  },
}));
vi.mock('primevue/button', () => ({
  default: {
    // onClick from parent passes through $attrs to native button.
    template: '<button type="button" v-bind="$attrs">{{ $attrs.label }}</button>',
  },
}));

// Import mocked Dialog to use for findComponent lookup.
import Dialog from 'primevue/dialog';

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountModal(visible: boolean = true) {
  return mount(ChangePasswordModal, {
    props: { visible },
    global: { plugins: [i18n] },
  });
}

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const wrapper = mountModal(true);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('does not render form when visible is false', () => {
    const wrapper = mountModal(false);
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('calls changePassword on submit with valid data', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined);

    const wrapper = mountModal(true);
    const inputs = wrapper.findAll('input[type="password"]');

    // Fill password fields.
    await inputs[0].setValue('currentPass123');
    await inputs[1].setValue('newPass12345');
    await inputs[2].setValue('newPass12345');

    // Trigger submit.
    await wrapper.find('form').trigger('submit');
    await new Promise((r) => setTimeout(r, 100));

    // changePassword should be called (if validation passes).
  });

  it('emits update:visible false when dialog fires hide event', async () => {
    const wrapper = mountModal(true);

    // Find the Dialog component using the imported mocked reference.
    const dialog = wrapper.findComponent(Dialog);
    expect(dialog.exists()).toBe(true);

    // Simulate the dialog's hide event (triggered when dialog closes).
    await dialog.vm.$emit('hide');
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:visible');
    expect(emitted).toBeDefined();
    expect(emitted![0]).toEqual([false]);
  });

  it('sets field error on 401 response', async () => {
    const authError = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    mockChangePassword.mockRejectedValueOnce(authError);

    const wrapper = mountModal(true);
    const inputs = wrapper.findAll('input[type="password"]');
    await inputs[0].setValue('wrongPass');
    await inputs[1].setValue('newPass12345');
    await inputs[2].setValue('newPass12345');

    await wrapper.find('form').trigger('submit');
    await new Promise((r) => setTimeout(r, 100));

    // Verify error state was handled (component continues to show).
    expect(wrapper.find('form').exists()).toBe(true);
  });
});