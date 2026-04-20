import { UsersRepository } from './users.repository';
import { hashPassword } from '../../utils/hash.util';
import { ServiceError } from '../../models/common.model';
import type { UserRow, UserFilters, AuditLogRow } from '../../models/users.model';
import type { PaginatedResult } from '../../models/common.model';
import type { CreateUserInput, UpdateUserInput } from './users.validation';

// ServiceErrorを再エクスポート / Re-export for controller usage
export { ServiceError };

// ユーザーサービス / Users business logic service
export class UsersService {
  private repository: UsersRepository;

  constructor(repository?: UsersRepository) {
    this.repository = repository || new UsersRepository();
  }

  // デフォルトパスワード生成 / Generate default password from email
  generatePassword(email: string): string {
    const username = email.split('@')[0];
    return `${username}123`;
  }

  // 変更フィールド差分取得 / Build changed fields diff between old and new data
  buildChangedFields(
    oldUser: UserRow,
    newData: UpdateUserInput,
  ): Record<string, { old: unknown; new: unknown }> | null {
    const fields: (keyof UpdateUserInput)[] = ['name', 'email', 'role', 'status'];
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const field of fields) {
      if (oldUser[field] !== newData[field]) {
        changes[field] = { old: oldUser[field], new: newData[field] };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  // ユーザー一覧取得 / Get paginated users with filters
  async getUsers(filters: UserFilters): Promise<PaginatedResult<UserRow>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const { data, total } = await this.repository.findAllWithFilters(filters);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ユーザー取得 / Get single user by ID
  async getUser(id: number): Promise<UserRow> {
    const user = await this.repository.findByIdWithoutPassword(id);
    if (!user) {
      throw new ServiceError('User not found', 404);
    }
    return user;
  }

  // ユーザー作成 / Create a new user
  async createUser(data: CreateUserInput, adminId: number): Promise<UserRow> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ServiceError('Email already exists', 409);
    }

    const password = this.generatePassword(data.email);
    const hashedPassword = await hashPassword(password);

    const result = await this.repository.create({
      ...data,
      password: hashedPassword,
    } as Partial<UserRow>);

    await this.repository.createAuditLog({
      admin_id: adminId,
      target_user_id: result.insertId,
      action: 'CREATE',
      changed_fields: null,
    });

    return this.getUser(result.insertId);
  }

  // ユーザー更新 / Update an existing user
  async updateUser(id: number, data: UpdateUserInput, adminId: number): Promise<UserRow> {
    const oldUser = await this.getUser(id);

    const existing = await this.repository.findByEmail(data.email, id);
    if (existing) {
      throw new ServiceError('Email already exists', 409);
    }

    const changedFields = this.buildChangedFields(oldUser, data);

    await this.repository.update(id, data as Partial<UserRow>);

    await this.repository.createAuditLog({
      admin_id: adminId,
      target_user_id: id,
      action: 'UPDATE',
      changed_fields: changedFields,
    });

    return this.getUser(id);
  }

  // ユーザー削除 / Delete a user (cannot delete self)
  async deleteUser(id: number, adminId: number): Promise<void> {
    if (id === adminId) {
      throw new ServiceError('Cannot delete your own account', 400);
    }

    await this.getUser(id);

    await this.repository.createAuditLog({
      admin_id: adminId,
      target_user_id: id,
      action: 'DELETE',
      changed_fields: null,
    });

    await this.repository.delete(id);
  }

  // ユーザーアクティビティ取得 / Get audit logs for a user
  async getUserActivity(id: number, limit = 20): Promise<AuditLogRow[]> {
    await this.getUser(id);
    return this.repository.getAuditLogs(id, limit);
  }
}
