// Users module type definitions.
import type { UserRole, UserStatus, AuditAction, PaginationParams, SortParams, ChangedFields } from './api.types';

// User data type returned by the API.
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  last_login_at: string | null;
  points: number;
  note: string | null;
  birthday: string | null;
  created_at: string;
  updated_at: string;
}

// Create user DTO.
export interface CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  note?: string;
  birthday?: string;
}

// Update user DTO.
export type UpdateUserDto = CreateUserDto;

// User list filter parameters.
export interface UserFilters extends PaginationParams, SortParams {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Audit log entry.
export interface AuditLog {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: AuditAction;
  changed_fields: ChangedFields;
  timestamp: string;
  admin_name: string;
}