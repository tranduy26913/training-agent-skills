// ユーザーAPI操作コンポーザブル / Users API composable wrapper
import { usersApiService } from '@/services/users.service';
import type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog } from '@/types/users.types';
import type { PaginatedData } from '@/types/api.types';

// 型の再エクスポート / Re-export types for component usage
export type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog };
export type { PaginationInfo } from '@/types/api.types';

// ユーザーAPI呼び出し / Thin API wrappers for user endpoints
export function useUsers() {
  // ユーザー一覧取得 / Get filtered user list
  async function getUsers(filters?: UserFilters): Promise<PaginatedData<User>> {
    return usersApiService.getUsers(filters);
  }

  // ユーザー取得 / Get single user
  async function getUser(id: number): Promise<User> {
    return usersApiService.getById(id);
  }

  // ユーザー作成 / Create user
  async function createUser(data: CreateUserDto): Promise<User> {
    return usersApiService.create(data);
  }

  // ユーザー更新 / Update user
  async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
    return usersApiService.update(id, data);
  }

  // ユーザー削除 / Delete user
  async function deleteUser(id: number): Promise<void> {
    return usersApiService.delete(id);
  }

  // ユーザーアクティビティ取得 / Get user audit logs
  async function getUserActivity(id: number, limit?: number): Promise<AuditLog[]> {
    return usersApiService.getUserActivity(id, limit);
  }

  return { getUsers, getUser, createUser, updateUser, deleteUser, getUserActivity };
}
