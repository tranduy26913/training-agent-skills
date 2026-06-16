// 共通モデル定義 / Common model definitions shared across all modules

// ユーザーロール / User role enum values
export type UserRole = 'admin' | 'user' | 'moderator';

// 監査ログアクション / Audit log action types
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

// ページネーションパラメータ / Pagination request parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ソートパラメータ / Sort request parameters
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ページネーション情報 / Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ページネーション結果 / Paginated result wrapper
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 変更フィールド差分 / Changed fields diff for audit logs
export type ChangedFields = Record<string, { old: unknown; new: unknown }> | null;

// サービスエラー / Service error with HTTP status code
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
