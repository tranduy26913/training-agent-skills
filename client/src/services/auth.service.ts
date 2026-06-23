// Authentication service.
import apiClient from './api.service';
import type { LoginPayload, LoginResponseData } from '@apptypes/auth.types';

export const authService = {
  // Login with email and password.
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const { data } = await apiClient.post<LoginResponseData>('/auth/login', payload);
    return data;
  },

  // Get the current authenticated user.
  async me(): Promise<unknown> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};