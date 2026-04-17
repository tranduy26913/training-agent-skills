import apiClient from '@/services/api.service';
import type { AxiosResponse } from 'axios';

// ユーザーフィルター型 / User filter parameters
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ユーザーデータ型 / User data type
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

// ユーザー作成データ型 / Create user DTO
export interface CreateUserDto {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
}

// ユーザー更新データ型 / Update user DTO
export type UpdateUserDto = CreateUserDto;

// ページネーション型 / Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 監査ログ型 / Audit log entry
export interface AuditLog {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: string;
  admin_name: string;
}

// ユーザーAPI呼び出し / Thin API wrappers for user endpoints
export function useUsers() {
  // ユーザー一覧取得 / Get filtered user list
  async function getUsers(filters?: UserFilters): Promise<{ data: User[]; pagination: PaginationInfo }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response: AxiosResponse = await apiClient.get(`/users?${params.toString()}`);
    return response.data.data;
  }

  // ユーザー取得 / Get single user
  async function getUser(id: number): Promise<User> {
    const response: AxiosResponse = await apiClient.get(`/users/${id}`);
    return response.data.data.data;
  }

  // ユーザー作成 / Create user
  async function createUser(data: CreateUserDto): Promise<User> {
    const response: AxiosResponse = await apiClient.post('/users', data);
    return response.data.data.data;
  }

  // ユーザー更新 / Update user
  async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const response: AxiosResponse = await apiClient.put(`/users/${id}`, data);
    return response.data.data.data;
  }

  // ユーザー削除 / Delete user
  async function deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // ユーザーアクティビティ取得 / Get user audit logs
  async function getUserActivity(id: number, limit?: number): Promise<AuditLog[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response: AxiosResponse = await apiClient.get(`/users/${id}/activity${params}`);
    return response.data.data.data;
  }

  return { getUsers, getUser, createUser, updateUser, deleteUser, getUserActivity };
}
