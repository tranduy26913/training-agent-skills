import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import UserListPage from '../UserListPage.vue';
import { useUsersStore } from '@/stores/users.store';
import type { User, PaginationInfo } from '@/pages/users/composables/useUsers';

// ---- Mocks / モック ----
const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

const confirmRequire = vi.fn();

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: confirmRequire,
  }),
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      users: {
        title: 'Users',
        createUser: 'Create User',
        deleteConfirm: 'Are you sure?',
        deleteHeader: 'Confirm Deletion',
        deletedSuccess: 'User deleted successfully',
        deletedError: 'Failed to delete user',
      },
      common: {
        yes: 'Yes',
        no: 'No',
        success: 'Success',
        error: 'Error',
      },
    },
  },
});

const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'user',
  status: 'active',
  avatar: null,
  last_login_at: null,
  points: 0,
  note: null,
  birthday: null,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
};

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 20,
  total: 1,
  pages: 1,
};

type StoreState = Partial<ReturnType<typeof useUsersStore>>;

function createWrapper(storeState: StoreState = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useUsersStore();
  Object.assign(store, {
    users: ref<User[]>([]),
    loading: ref<boolean>(false),
    pagination: ref<PaginationInfo>({ ...mockPagination, total: 0, pages: 0 }),
    filters: ref<Record<string, unknown>>({}),
    fetchUsers: vi.fn(),
    deleteUser: vi.fn(),
    ...storeState,
  });

  return mount(UserListPage, {
    global: {
      plugins: [pinia, i18n, PrimeVue],
      directives: {
        tooltip: () => undefined,
      },
      stubs: {
        'Button': true,
        'ConfirmDialog': true,
      },
    },
  });
}

describe('UserListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // F-LIST-01: Hiển thị skeleton khi loading
  it('passes loading=true to UserTable when loading', () => {
    const wrapper = createWrapper({ loading: true });
    const table = wrapper.findComponent({ name: 'UserTable' });
    expect(table.props('loading')).toBe(true);
  });

  // F-LIST-02: Hiển thị dữ liệu khi loaded
  it('renders UserTable with user data when loaded', () => {
    const wrapper = createWrapper({ users: [mockUser] });
    const table = wrapper.findComponent({ name: 'UserTable' });
    expect(table.props('users')).toHaveLength(1);
    expect(table.props('users')[0].email).toBe('jane@example.com');
  });

  // F-LIST-03: handleDelete gọi deleteUser
  it('calls deleteUser when UserTable emits delete and confirm accepts', async () => {
    const deleteUser = vi.fn().mockResolvedValue(undefined);
    confirmRequire.mockImplementation(({ accept }) => accept?.());

    const wrapper = createWrapper({
      users: [mockUser],
      deleteUser,
    });

    const table = wrapper.findComponent({ name: 'UserTable' });
    await table.vm.$emit('delete', 1);

    expect(confirmRequire).toHaveBeenCalledWith(expect.objectContaining({
      accept: expect.any(Function),
    }));
    expect(deleteUser).toHaveBeenCalledWith(1);
  });

  // F-LIST-05: handleEdit điều hướng đến edit
  it('navigates to edit page when UserTable emits edit', async () => {
    const wrapper = createWrapper({ users: [mockUser] });
    const table = wrapper.findComponent({ name: 'UserTable' });
    await table.vm.$emit('edit', 1);

    expect(routerPush).toHaveBeenCalledWith({ name: 'UserEdit', params: { id: 1 } });
  });

  // F-LIST-06: handleFilterChange reset page
  it('calls fetchUsers with page=1 on filter change', async () => {
    const fetchUsers = vi.fn();
    const wrapper = createWrapper({ fetchUsers });

    const filters = wrapper.findComponent({ name: 'UserFilters' });
    await filters.vm.$emit('filter-change', { search: 'jane' });

    expect(fetchUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, search: 'jane' }));
  });

  // F-LIST-07: fetchUsers gọi onMounted
  it('calls fetchUsers on mount', () => {
    const fetchUsers = vi.fn();
    createWrapper({ fetchUsers });

    expect(fetchUsers).toHaveBeenCalledTimes(1);
  });
});
