import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import type { LoginPayload, AuthUser } from '@/types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<AuthUser | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const userRole = computed(() => user.value?.role || 'user');

  async function login(payload: LoginPayload): Promise<void> {
    const response = await authService.login(payload);
    token.value = response.token;
    user.value = response.user;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Update current user's info in state and localStorage.
   * 現在のユーザー情報をstateとlocalStorageに反映する。
   */
  function updateUser(updatedUser: Partial<AuthUser>): void {
    user.value = { ...user.value!, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    userRole,
    login,
    logout,
    updateUser,
  };
});
