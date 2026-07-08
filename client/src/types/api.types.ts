// Common API type definitions shared across all services.

// User role.
export type UserRole = 'admin' | 'user' | 'moderator';

// User status.
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Audit action types.
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_SCRIPT'
  | 'UPDATE_SCRIPT'
  | 'DELETE_SCRIPT';

// Pagination info returned by the API.
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Paginated response wrapper from the API.
export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationInfo;
}

// API error response shape.
export interface ApiErrorResponse {
  message: string;
}

// Pagination request parameters.
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Sort request parameters.
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Changed fields diff recorded in audit logs.
export type ChangedFields = Record<string, { old: unknown; new: unknown }> | null;
