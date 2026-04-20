import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useUsers } from '@/pages/users/composables/useUsers';
import type { User, UserFilters, AuditLog } from '@/types/users.types';
import type { PaginationInfo } from '@/types/api.types';

export const useUsersStore = defineStore('users', () => {
  const { getUsers: apiGetUsers, getUser: apiGetUser, createUser: apiCreateUser, updateUser: apiUpdateUser, deleteUser: apiDeleteUser, getUserActivity: apiGetUserActivity } = useUsers();

  // 状態 / State
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const auditLogs = ref<AuditLog[]>([]);
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const filters = ref<UserFilters>({});
  const loading = shallowRef(false);
  const loadingUser = shallowRef(false);
  const loadingActivity = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // ゲッター / Getters
  const totalUsers = computed(() => pagination.value.total);
  const hasUsers = computed(() => users.value.length > 0);
  const isLastPage = computed(() => pagination.value.page >= pagination.value.pages);

  // ユーザー一覧取得 / Fetch paginated users
  async function fetchUsers(newFilters?: UserFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }
    loading.value = true;
    error.value = null;
    try {
      const result = await apiGetUsers(filters.value);
      users.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
  }

  // 単一ユーザー取得 / Fetch single user
  async function fetchUser(id: number): Promise<void> {
    loadingUser.value = true;
    error.value = null;
    try {
      currentUser.value = await apiGetUser(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch user';
    } finally {
      loadingUser.value = false;
    }
  }

  // ユーザー作成 / Create user
  async function createUser(data: { name: string; email: string; role: string; status: string }): Promise<void> {
    const user = await apiCreateUser(data as any);
    return;
  }

  // ユーザー更新 / Update user
  async function updateUser(id: number, data: { name: string; email: string; role: string; status: string }): Promise<void> {
    await apiUpdateUser(id, data as any);
  }

  // ユーザー削除 / Delete user
  async function deleteUser(id: number): Promise<void> {
    await apiDeleteUser(id);
    await fetchUsers();
  }

  // アクティビティ取得 / Fetch user activity
  async function fetchUserActivity(id: number): Promise<void> {
    loadingActivity.value = true;
    try {
      auditLogs.value = await apiGetUserActivity(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch activity';
    } finally {
      loadingActivity.value = false;
    }
  }

  // フィルターリセット / Reset filters
  function resetFilters(): void {
    filters.value = {};
    fetchUsers();
  }

  // 現在のユーザーをクリア / Clear current user
  function clearCurrentUser(): void {
    currentUser.value = null;
    auditLogs.value = [];
  }

  return {
    // 状態 / State
    users,
    currentUser,
    auditLogs,
    pagination,
    filters,
    loading,
    loadingUser,
    loadingActivity,
    error,
    // ゲッター / Getters
    totalUsers,
    hasUsers,
    isLastPage,
    // アクション / Actions
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    fetchUserActivity,
    resetFilters,
    clearCurrentUser,
  };
});
