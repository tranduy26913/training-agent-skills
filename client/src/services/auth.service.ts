import apiClient from './api.service';
import type { LoginPayload, LoginResponseData } from '@/types/auth.types';

// 認証サービス / Authentication service
export const authService = {
  // ログイン / Login with email and password
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const { data } = await apiClient.post<LoginResponseData>('/auth/login', payload);
    return data;
  },

  // 現在のユーザー取得 / Get current authenticated user
  async me(): Promise<unknown> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
