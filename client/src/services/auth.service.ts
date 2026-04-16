import apiClient from './api.service';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: 'admin' | 'user' | 'moderator';
      status: string;
    };
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async me(): Promise<any> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
