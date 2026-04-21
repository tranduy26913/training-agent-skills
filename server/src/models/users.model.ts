// ユーザーモデル定義 / Users module request/response models
import type { RowDataPacket } from 'mysql2/promise';
import type {
  UserRole,
  UserStatus,
  AuditAction,
  PaginationParams,
  SortParams,
  ChangedFields,
} from './common.model';

// ユーザーデータ行 / User database row
export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  // [NEW] fields
  last_login_at: Date | null;
  points: number;
  note: string | null;
  birthday: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ユーザーフィルター / User list filter parameters
export interface UserFilters extends PaginationParams, SortParams {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// 監査ログエントリ入力 / Audit log create input
export interface AuditLogEntry {
  admin_id: number;
  target_user_id: number;
  action: AuditAction;
  changed_fields?: ChangedFields;
}

// 監査ログ行 / Audit log database row
export interface AuditLogRow extends RowDataPacket {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: string;
  changed_fields: ChangedFields;
  timestamp: Date;
  admin_name: string;
}
