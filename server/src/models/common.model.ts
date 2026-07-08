// Common model definitions shared across all modules.

// User role enum values.
export type UserRole = 'admin' | 'user' | 'moderator';

// Audit log action types.
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_SCRIPT'
  | 'UPDATE_SCRIPT'
  | 'DELETE_SCRIPT'
  | 'CREATE_VOCABULARY'
  | 'UPDATE_VOCABULARY'
  | 'DELETE_VOCABULARY';

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

// Pagination info returned with paginated lists.
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Paginated result wrapper.
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Changed fields diff recorded in audit logs.
export type ChangedFields = Record<string, { old: unknown; new: unknown }> | null;

// Service error carrying an HTTP status code.
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
