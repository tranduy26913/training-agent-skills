// Users + audit-log data access using Prisma Client.
// Mirrors the public API of the previous mysql2-based repository so the
// service layer does not need to change.
import { prisma } from '../../database/prisma';
import type { Prisma } from '@prisma/client';
import type { UserFilters, AuditLogDTO, AuditLog } from '../../models/users.model';
import type { ChangedFields } from '../../models/common.model';

// Whitelist of sortable columns to prevent arbitrary field injection.
const ALLOWED_SORT_FIELDS: Record<string, Prisma.UserOrderByWithRelationInput> = {
  id: { id: 'asc' },
  name: { name: 'asc' },
  email: { email: 'asc' },
  role: { role: 'asc' },
  status: { status: 'asc' },
  created_at: { createdAt: 'asc' },
  updated_at: { updatedAt: 'asc' },
};

// Columns the user-list API exposes (no password hash).
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatar: true,
  lastLoginAt: true,
  points: true,
  note: true,
  birthday: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersRepository {
  // Build a Prisma where clause from the request filters.
  private buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return where;
  }

  // Find users with filters, sort, and pagination. Returns rows without the
  // password field and the total count for the page meta.
  async findAllWithFilters(filters: UserFilters) {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy =
      ALLOWED_SORT_FIELDS[filters.sortBy || ''] ??
      { createdAt: 'desc' as const };
    if (filters.sortOrder === 'asc') {
      const key = Object.keys(orderBy)[0] as keyof Prisma.UserOrderByWithRelationInput;
      (orderBy as any)[key] = 'asc';
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: USER_PUBLIC_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  // Find a user by id, excluding the password hash.
  findByIdWithoutPassword(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  }

  // Find a user by email. Optionally exclude an id (used when updating to
  // ignore the user's own record during duplicate checks).
  findByEmail(email: string, excludeId?: number) {
    return prisma.user.findFirst({
      where: {
        email,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
  }

  // Create a new user. Returns the generated id.
  async create(data: {
    name: string;
    email: string;
    role: string;
    status: string;
    password: string;
    note?: string | null;
    birthday?: string | null;
  }): Promise<number> {
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        password: data.password,
        note: data.note ?? null,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
      select: { id: true },
    });
    return created.id;
  }

  // Update user fields. Only whitelisted fields are accepted.
  async update(
    id: number,
    data: {
      name: string;
      email: string;
      role: string;
      status: string;
      note?: string | null;
      birthday?: string | null;
    },
  ): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        note: data.note ?? null,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
    });
  }

  // Delete a user by id.
  async delete(id: number): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  // Create an audit log entry. changedFields is serialized to JSON by Prisma.
  async createAuditLog(entry: AuditLogDTO): Promise<void> {
    await prisma.auditLog.create({
      data: {
        adminId: entry.admin_id,
        targetUserId: entry.target_user_id,
        action: entry.action,
        // Prisma expects JsonValue-compatible input; the application value is
        // already a plain object/null/undefined.
        changedFields: entry.changed_fields as never,
      },
    });
  }

  // Return audit logs for a target user, joined with the admin's name.
  // Returns rows in the API snake_case shape (admin_id, target_user_id, ...).
  async getAuditLogs(targetUserId: number, limit = 20): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { targetUserId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { admin: { select: { name: true } } },
    });

    return rows.map((r) => ({
      id: r.id,
      admin_id: r.adminId,
      target_user_id: r.targetUserId,
      action: r.action,
      changed_fields: r.changedFields as ChangedFields,
      timestamp: r.timestamp,
      admin_name: r.admin?.name ?? '',
    }));
  }
}
