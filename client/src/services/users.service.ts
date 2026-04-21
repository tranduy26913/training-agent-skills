// ユーザーAPIサービス / Users API service extending base client
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog } from '@/types/users.types';

// ユーザーAPIクライアント / Users API client with domain-specific methods
class UsersApiClient extends BaseApiClient<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super('/users');
  }

  // フィルター付きユーザー一覧取得 / Get users with filters
  async getUsers(filters?: UserFilters) {
    return this.getList(filters as Record<string, unknown>);
  }

  // ユーザーアクティビティ取得 / Get audit logs for a user
  async getUserActivity(id: number, limit?: number): Promise<AuditLog[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response: AxiosResponse<AuditLog[]> = await apiClient.get(
      `${this.basePath}/${id}/activity${params}`,
    );
    return response.data;
  }

  // メール重複チェック / Check if email already exists
  async checkEmail(email: string, excludeId?: number): Promise<{ exists: boolean }> {
    const params = new URLSearchParams({ email });
    if (excludeId !== undefined) params.set('excludeId', String(excludeId));
    const response: AxiosResponse<{ exists: boolean }> = await apiClient.get(
      `${this.basePath}/check-email?${params.toString()}`,
    );
    return response.data;
  }
}

// シングルトンインスタンス / Singleton instance
export const usersApiService = new UsersApiClient();
