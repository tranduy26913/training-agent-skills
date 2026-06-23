// Users API service extending the base client.
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog } from '@apptypes/users.types';

// Users API client with domain-specific methods.
class UsersApiClient extends BaseApiClient<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super('/admin/users');
  }

  // Get users with filters.
  async getUsers(filters?: UserFilters) {
    return this.getList(filters as Record<string, unknown>);
  }

  // Get audit logs for a user.
  async getUserActivity(id: number, limit?: number): Promise<AuditLog[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response: AxiosResponse<AuditLog[]> = await apiClient.get(
      `${this.basePath}/${id}/activity${params}`,
    );
    return response.data;
  }

  // Check if an email already exists.
  async checkEmail(email: string, excludeId?: number): Promise<{ exists: boolean }> {
    const params = new URLSearchParams({ email });
    if (excludeId !== undefined) params.set('excludeId', String(excludeId));
    const response: AxiosResponse<{ exists: boolean }> = await apiClient.get(
      `${this.basePath}/check-email?${params.toString()}`,
    );
    return response.data;
  }
}

// Singleton instance.
export const usersApiService = new UsersApiClient();