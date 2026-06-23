import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useUsers } from '@pages/users/composables/useUsers';
import type { User, UserFilters, AuditLog, CreateUserDto, UpdateUserDto } from '@apptypes/users.types';
import type { PaginationInfo } from '@apptypes/api.types';

export const useUsersStore = defineStore('users', () => {
  const {
    getUsers: apiGetUsers,
    getUser: apiGetUser,
    createUser: apiCreateUser,
    updateUser: apiUpdateUser,
    deleteUser: apiDeleteUser,
    getUserActivity: apiGetUserActivity,
  } = useUsers();

  // State
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const auditLogs = ref<AuditLog[]>([]);
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const filters = ref<UserFilters>({});
  const loading = shallowRef(false);
  const loadingUser = shallowRef(false);
  const loadingActivity = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // Getters
  const totalUsers = computed(() => pagination.value.total);
  const hasUsers = computed(() => users.value.length > 0);
  const isLastPage = computed(() => pagination.value.page >= pagination.value.pages);

  // Extract a readable error message from an unknown catch value.
  function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  }

  // Fetch paginated users.
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
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch users');
    } finally {
      loading.value = false;
    }
  }

  // Fetch a single user.
  async function fetchUser(id: number): Promise<void> {
    loadingUser.value = true;
    error.value = null;
    try {
      currentUser.value = await apiGetUser(id);
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch user');
    } finally {
      loadingUser.value = false;
    }
  }

  // Create a user.
  async function createUser(data: CreateUserDto): Promise<void> {
    await apiCreateUser(data);
  }

  // Update a user.
  async function updateUser(id: number, data: UpdateUserDto): Promise<void> {
    await apiUpdateUser(id, data);
  }

  // Delete a user and reload the list.
  async function deleteUser(id: number): Promise<void> {
    await apiDeleteUser(id);
    await fetchUsers();
  }

  // Fetch user activity (audit logs).
  async function fetchUserActivity(id: number): Promise<void> {
    loadingActivity.value = true;
    try {
      auditLogs.value = await apiGetUserActivity(id);
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch activity');
    } finally {
      loadingActivity.value = false;
    }
  }

  // Reset filters and reload.
  function resetFilters(): void {
    filters.value = {};
    fetchUsers();
  }

  // Clear the current user and audit logs.
  function clearCurrentUser(): void {
    currentUser.value = null;
    auditLogs.value = [];
  }

  return {
    // State
    users,
    currentUser,
    auditLogs,
    pagination,
    filters,
    loading,
    loadingUser,
    loadingActivity,
    error,
    // Getters
    totalUsers,
    hasUsers,
    isLastPage,
    // Actions
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