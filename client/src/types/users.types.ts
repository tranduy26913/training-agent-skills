// ユーザー型定義 / Users module type definitions
import type { UserRole, UserStatus, AuditAction, PaginationParams, SortParams, ChangedFields } from './api.types';

// ユーザーデータ型 / User data type
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

// ユーザー作成入力 / Create user DTO
export interface CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// ユーザー更新入力 / Update user DTO
export type UpdateUserDto = CreateUserDto;

// ユーザーフィルター / User list filter parameters
export interface UserFilters extends PaginationParams, SortParams {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// 監査ログ / Audit log entry
export interface AuditLog {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: AuditAction;
  changed_fields: ChangedFields;
  timestamp: string;
  admin_name: string;
}
