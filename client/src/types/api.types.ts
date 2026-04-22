// 共通API型定義 / Common API type definitions shared across all services

// ユーザーロール / User role
export type UserRole = 'admin' | 'user' | 'moderator';

// ユーザーステータス / User status
export type UserStatus = 'active' | 'inactive' | 'suspended';

// 監査アクション / Audit action types
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

// ページネーション情報 / Pagination info from API
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ページネーション付きレスポンス / Paginated response from API
export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationInfo;
}

// APIエラーレスポンス / API error response
export interface ApiErrorResponse {
  message: string;
}

// ページネーションパラメータ / Pagination request params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ソートパラメータ / Sort request params
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 変更フィールド差分 / Changed fields diff for audit logs
export type ChangedFields = Record<string, { old: unknown; new: unknown }> | null;
