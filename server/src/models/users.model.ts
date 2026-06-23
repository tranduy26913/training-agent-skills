// Users module request/response models.
import type { User as PrismaUser } from '@prisma/client';
import type {
  AuditAction,
  PaginationParams,
  SortParams,
  ChangedFields,
} from './common.model';

// Application-side User type: Prisma-generated row. Callers must select
// against the public shape before returning to clients.
export type User = PrismaUser;

// API response shape for the audit-log list. Keeps snake_case to match the
// existing JSON contract returned to clients.
export interface AuditLog {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: string;
  changed_fields: ChangedFields;
  timestamp: Date;
  admin_name: string;
}

// User filter parameters for the list endpoint.
export interface UserFilters extends PaginationParams, SortParams {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Audit log create input (service-level DTO).
export interface AuditLogDTO {
  admin_id: number;
  target_user_id: number;
  action: AuditAction;
  changed_fields?: ChangedFields;
}
