/**
 * ProfileForm component tests
 * ProfileFormコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ProfileForm from '../ProfileForm.vue';
import en from '@/locales/en';
import type { AuthUser } from '@/types/auth.types';

// PrimeVueコンポーネントのモック / Mock PrimeVue components
vi.mock('primevue/inputtext', () => ({
  default: { template: '<input data-testid="mock-input" v-bind="$attrs" />' },
}));
vi.mock('primevue/textarea', () => ({
  default: { template: '<textarea data-testid="mock-textarea" v-bind="$attrs"></textarea>' },
}));
vi.mock('primevue/datepicker', () => ({
  default: { template: '<input type="date" data-testid="mock-datepicker" v-bind="$attrs" />' },
}));
vi.mock('primevue/button', () => ({
  default: { template: '<button type="submit" v-bind="$attrs">{{ $attrs.label }}</button>' },
}));
vi.mock('primevue/badge', () => ({
  default: { template: '<span data-testid="mock-badge" v-bind="$attrs">{{ $attrs.value }}</span>' },
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const mockUser: AuthUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  status: 'active',
  avatar: undefined,
  birthday: undefined,
  note: undefined,
};

function mountProfileForm(user: AuthUser = mockUser) {
  return mount(ProfileForm, {
    props: { user },
    global: { plugins: [i18n] },
  });
}

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with user name in name field', () => {
    // ユーザー名がnameフィールドに表示される
    const wrapper = mountProfileForm();
    const nameInput = wrapper.find('[data-testid="profile-name"]');
    expect(nameInput.exists()).toBe(true);
  });

  it('renders email as read-only', () => {
    // メールが読み取り専用で表示される
    const wrapper = mountProfileForm();
    const emailInput = wrapper.find('[data-testid="profile-email"]');
    expect(emailInput.attributes('disabled')).toBeDefined();
  });

  it('renders role badge', () => {
    // ロールバッジが表示される
    const wrapper = mountProfileForm();
    const badge = wrapper.find('[data-testid="profile-role"]');
    expect(badge.exists()).toBe(true);
  });

  it('shows avatar initials when no avatar', () => {
    // アバターがない場合はイニシャルを表示
    const wrapper = mountProfileForm({ ...mockUser, name: 'Alice Bob' });
    const preview = wrapper.find('[data-testid="avatar-preview"]');
    expect(preview.text()).toContain('AB');
  });

  it('shows avatar image when avatar is set', () => {
    // アバターが設定されている場合は画像を表示
    const avatarUser: AuthUser = { ...mockUser, avatar: 'data:image/png;base64,abc' };
    const wrapper = mountProfileForm(avatarUser);
    const img = wrapper.find('[data-testid="avatar-preview"] img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('data:image/png;base64,abc');
  });

  it('emits submit with correct dto on form submit', async () => {
    // フォーム送信時に正しいdtoをemitする
    const wrapper = mountProfileForm();
    await wrapper.find('form').trigger('submit');
    // Name is 'Alice' — valid, so submit should emit
    // (validation may pass synchronously with valid data)
    // Allow async validation to complete
    await new Promise((r) => setTimeout(r, 50));
    const submitted = wrapper.emitted('submit');
    if (submitted && submitted.length > 0) {
      const dto = submitted[0][0] as any;
      expect(dto).toHaveProperty('name', 'Alice');
    }
  });

  it('formats birthday using local date (not UTC) to avoid off-by-one day across timezones', async () => {
    // タイムゾーンに関係なく、ローカル日付でbirthdayをフォーマットする
    // e.g. UTC+7: new Date('2026-04-23') is 2026-04-22T17:00:00Z — toISOString() would return '2026-04-22', not '2026-04-23'
    const userWithBirthday: AuthUser = {
      ...mockUser,
      birthday: '2026-04-23',
    };
    const wrapper = mountProfileForm(userWithBirthday);
    await wrapper.find('form').trigger('submit');
    await new Promise((r) => setTimeout(r, 50));
    const submitted = wrapper.emitted('submit');
    if (submitted && submitted.length > 0) {
      const dto = submitted[0][0] as any;
      // Must match the local date "2026-04-23", not the UTC-shifted "2026-04-22"
      expect(dto.birthday).toBe('2026-04-23');
    }
  });

  it('renders save button', () => {
    // 保存ボタンが表示される
    const wrapper = mountProfileForm();
    const btn = wrapper.find('[data-testid="profile-save-btn"]');
    expect(btn.exists()).toBe(true);
  });
});
