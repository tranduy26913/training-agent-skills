/**
 * Unit tests for useUsersStore
 * ユーザーズストアのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUsersStore } from '../users.store';
import type { PaginatedData } from '@/types/api.types';
import type { User, AuditLog, CreateUserDto, UpdateUserDto } from '@/types/users.types';

// ---- Composable mock / コンポーザブルモック ----
const usersComposableMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserActivity: vi.fn(),
}));

vi.mock('@/pages/users/composables/useUsers', () => ({
  useUsers: () => usersComposableMocks,
}));

// ---- Fixtures / テストデータ ----
const MOCK_USER: User = {
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

const MOCK_PAGINATED: PaginatedData<User> = {
  data: [MOCK_USER],
  pagination: { page: 1, limit: 20, total: 1, pages: 1 },
};

const MOCK_AUDIT_LOG: AuditLog = {
  id: 1,
  admin_id: 1000,
  target_user_id: 1,
  action: 'CREATE',
  changed_fields: null,
  timestamp: '2026-06-01T00:00:00.000Z',
  admin_name: 'Admin',
};

describe('useUsersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // F-STORE-01: fetchUsers cập nhật users + pagination
  it('updates users and pagination after fetchUsers', async () => {
    usersComposableMocks.getUsers.mockResolvedValue(MOCK_PAGINATED);

    const store = useUsersStore();
    await store.fetchUsers();

    expect(store.users).toHaveLength(1);
    expect(store.users[0].email).toBe('jane@example.com');
    expect(store.pagination.total).toBe(1);
  });

  // F-STORE-02: fetchUsers loading flag
  it('sets loading flag during fetchUsers', async () => {
    usersComposableMocks.getUsers.mockImplementation(async () => {
      expect(useUsersStore().loading).toBe(true);
      return MOCK_PAGINATED;
    });

    const store = useUsersStore();
    expect(store.loading).toBe(false);

    await store.fetchUsers();

    expect(store.loading).toBe(false);
  });

  // F-STORE-03: createUser gọi composable
  it('calls createUser composable when creating user', async () => {
    const newUser: CreateUserDto = {
      name: 'New User',
      email: 'new@example.com',
      role: 'user',
      status: 'active',
    };
    usersComposableMocks.createUser.mockResolvedValue({ ...MOCK_USER, ...newUser, id: 2 });

    const store = useUsersStore();
    await store.createUser(newUser);

    expect(usersComposableMocks.createUser).toHaveBeenCalledWith(newUser);
  });

  // F-STORE-04: deleteUser reload fetchUsers
  it('reloads users after deleteUser', async () => {
    usersComposableMocks.deleteUser.mockResolvedValue(undefined);
    usersComposableMocks.getUsers.mockResolvedValue({ ...MOCK_PAGINATED, data: [] });

    const store = useUsersStore();
    await store.deleteUser(1);

    expect(usersComposableMocks.deleteUser).toHaveBeenCalledWith(1);
    expect(usersComposableMocks.getUsers).toHaveBeenCalled();
    expect(store.users).toHaveLength(0);
  });

  // F-STORE-05: resetFilters reset + fetchUsers
  it('resets filters and fetches users', async () => {
    usersComposableMocks.getUsers.mockResolvedValue(MOCK_PAGINATED);

    const store = useUsersStore();
    store.filters = { search: 'jane', role: 'admin' };

    await store.resetFilters();

    expect(store.filters).toEqual({});
    expect(usersComposableMocks.getUsers).toHaveBeenCalledWith({});
  });

  // F-STORE-06: clearCurrentUser clear state
  it('clears current user and audit logs', () => {
    const store = useUsersStore();
    store.currentUser = MOCK_USER;
    store.auditLogs = [MOCK_AUDIT_LOG];

    store.clearCurrentUser();

    expect(store.currentUser).toBeNull();
    expect(store.auditLogs).toHaveLength(0);
  });

  // F-STORE-07: fetchUsers set error khi fail
  it('sets error when fetchUsers fails', async () => {
    usersComposableMocks.getUsers.mockRejectedValue({ response: { data: { message: 'Network error' } } });

    const store = useUsersStore();
    await store.fetchUsers();

    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  // F-STORE-08: fetchUser cập nhật currentUser
  it('fetches single user into currentUser', async () => {
    usersComposableMocks.getUser.mockResolvedValue(MOCK_USER);

    const store = useUsersStore();
    await store.fetchUser(1);

    expect(store.currentUser).toEqual(MOCK_USER);
    expect(store.loadingUser).toBe(false);
  });

  // F-STORE-09: updateUser gọi composable
  it('calls updateUser composable when updating user', async () => {
    const updateData: UpdateUserDto = {
      name: 'Updated Name',
      email: 'jane@example.com',
      role: 'user',
      status: 'active',
    };
    usersComposableMocks.updateUser.mockResolvedValue({ ...MOCK_USER, ...updateData });

    const store = useUsersStore();
    await store.updateUser(1, updateData);

    expect(usersComposableMocks.updateUser).toHaveBeenCalledWith(1, updateData);
  });

  // F-STORE-10: fetchUserActivity cập nhật auditLogs
  it('fetches user activity into auditLogs', async () => {
    usersComposableMocks.getUserActivity.mockResolvedValue([MOCK_AUDIT_LOG]);

    const store = useUsersStore();
    await store.fetchUserActivity(1);

    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0].action).toBe('CREATE');
    expect(store.loadingActivity).toBe(false);
  });
});
