/**
 * Unit tests for ChatSessionForm component
 * ChatSessionFormコンポーネントのユニットテスト
 * [CR-NBLM-LLM-001] Tests for provider dropdown and form validation
 */
import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/locales/en';
import ChatSessionForm from '../ChatSessionForm.vue';
import type { ChatSession } from '@/types/notebooklm.types';

// PrimeVueコンポーネントのモック / Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: { template: '<div class="p-card"><slot name="content" /></div>' },
}));
vi.mock('primevue/button', () => ({
  default: {
    inheritAttrs: false,
    template:
      '<button v-bind="$attrs" @click="$emit(\'click\')">{{ $attrs.label }}</button>',
  },
}));
vi.mock('primevue/inputtext', () => ({
  default: {
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}));
vi.mock('primevue/select', () => ({
  default: {
    inheritAttrs: false,
    template:
      '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'fluid'],
    emits: ['update:modelValue'],
  },
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

// テスト用セッションフィクスチャ / Session fixture for edit mode
const EXISTING_SESSION: ChatSession = {
  id: 5,
  workspaceId: 10,
  userId: 1,
  title: 'Existing Session',
  llmProvider: 'mock',
  createdAt: '2026-05-11T10:00:00.000Z',
  updatedAt: '2026-05-11T10:00:00.000Z',
};

function mountForm(props: Record<string, unknown> = {}) {
  return mount(ChatSessionForm, {
    props: { mode: 'create', ...props },
    global: { plugins: [i18n] },
  });
}

describe('ChatSessionForm', () => {
  // フォームのレンダリングテスト / Form rendering tests
  describe('rendering', () => {
    it('renders title input', () => {
      const wrapper = mountForm();
      expect(wrapper.find('input').exists()).toBe(true);
    });

    it('renders provider select dropdown', () => {
      const wrapper = mountForm();
      expect(wrapper.find('[data-testid="session-provider-select"]').exists()).toBe(true);
    });

    it('renders submit and cancel buttons', () => {
      const wrapper = mountForm();
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // デフォルト値テスト / Default value tests
  describe('default values', () => {
    it('defaults llmProvider to ollama in create mode', () => {
      const wrapper = mountForm({ mode: 'create' });
      const select = wrapper.find('[data-testid="session-provider-select"]');
      expect((select.element as HTMLSelectElement).value).toBe('ollama');
    });

    it('pre-fills title and provider from initialData in edit mode', () => {
      const wrapper = mountForm({ mode: 'edit', initialData: EXISTING_SESSION });
      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('Existing Session');

      const select = wrapper.find('[data-testid="session-provider-select"]');
      expect((select.element as HTMLSelectElement).value).toBe('mock');
    });
  });

  // バリデーションテスト / Validation tests
  describe('validation', () => {
    it('emits submit with title and llmProvider on valid form submission in create mode', async () => {
      const wrapper = mountForm({ mode: 'create' });
      const input = wrapper.find('input');
      await input.setValue('New Session Title');

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.emitted('submit')).toBeTruthy();
      const emittedData = wrapper.emitted('submit')![0][0] as { title: string; llmProvider: string };
      expect(emittedData.title).toBe('New Session Title');
      expect(emittedData.llmProvider).toBe('ollama');
    });

    it('emits submit with selected provider when changed', async () => {
      const wrapper = mountForm({ mode: 'create' });

      // Select a different provider
      const select = wrapper.find('[data-testid="session-provider-select"]');
      await select.setValue('gemini');

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.emitted('submit')).toBeTruthy();
      const emittedData = wrapper.emitted('submit')![0][0] as { llmProvider: string };
      expect(emittedData.llmProvider).toBe('gemini');
    });

    it('emits cancel when cancel button is clicked', async () => {
      const wrapper = mountForm();
      const cancelBtn = wrapper.find('[data-testid="session-cancel-btn"]');
      await cancelBtn.trigger('click');

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });
  });

  // 編集モードテスト / Edit mode tests
  describe('edit mode', () => {
    it('shows updated llmProvider after select change', async () => {
      const wrapper = mountForm({ mode: 'edit', initialData: EXISTING_SESSION });
      const select = wrapper.find('[data-testid="session-provider-select"]');
      await select.setValue('ollama');

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.emitted('submit')).toBeTruthy();
      const emittedData = wrapper.emitted('submit')![0][0] as { llmProvider: string };
      expect(emittedData.llmProvider).toBe('ollama');
    });
  });
});
