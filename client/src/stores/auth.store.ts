import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService, type LoginPayload } from '@/services/auth.service';
import { useRouter } from 'vue-router';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const userRole = computed(() => user.value?.role || 'user');

  async function login(payload: LoginPayload): Promise<void> {
    const response = await authService.login(payload);
    token.value = response.data.token;
    user.value = response.data.user;
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    userRole,
    login,
    logout,
  };
});
