import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@services/auth.service';
import type { LoginPayload, AuthUser } from '@apptypes/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<AuthUser | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  );

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const userRole = computed(() => user.value?.role || 'user');

  // Login with email and password, persist token and user.
  async function login(payload: LoginPayload): Promise<void> {
    const response = await authService.login(payload);
    token.value = response.token;
    user.value = response.user;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  // Logout: clear state and persisted storage.
  function logout(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Update current user info in state and localStorage.
  function updateUser(updatedUser: Partial<AuthUser>): void {
    if (!user.value) return;
    user.value = { ...user.value, ...updatedUser };
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