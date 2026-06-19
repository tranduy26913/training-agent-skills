import { UsersRepository } from './users.repository';
import { hashPassword } from '@utils/hash.util';
import { ServiceError } from '@models/common.model';
import type { UserFilters, AuditLog } from '@models/users.model';
import type { PaginatedResult } from '@models/common.model';
import type { CreateUserInput, UpdateUserInput } from './users.validation';

// Re-export ServiceError for controller usage.
export { ServiceError };

// Public user shape returned by repository (no password hash).
type PublicUser = NonNullable<Awaited<ReturnType<UsersRepository['findByIdWithoutPassword']>>>;

// Users business logic service.
export class UsersService {
  private repository: UsersRepository;

  constructor(repository?: UsersRepository) {
    this.repository = repository || new UsersRepository();
  }

  // Default password derived from the email local part.
  generatePassword(email: string): string {
    const username = email.split('@')[0];
    return `${username}123`;
  }

  // Compute a diff between the old record and the new payload, used for
  // the audit log entry on UPDATE.
  buildChangedFields(
    oldUser: PublicUser,
    newData: UpdateUserInput,
  ): Record<string, { old: unknown; new: unknown }> | null {
    const fields: (keyof UpdateUserInput)[] = ['name', 'email', 'role', 'status', 'note', 'birthday'];
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const field of fields) {
      const oldVal = oldUser[field as keyof PublicUser];
      const newVal = newData[field];
      if (newVal === undefined) continue;
      if (oldVal !== newVal) {
        changes[field] = { old: oldVal, new: newVal };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  // Returns true if the email is already used by another user.
  async checkEmailDuplicate(email: string, excludeId?: number): Promise<boolean> {
    const existing = await this.repository.findByEmail(email, excludeId);
    return existing !== null;
  }

  // Paginated user list with filters.
  async getUsers(filters: UserFilters): Promise<PaginatedResult<PublicUser>> {
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

  // Fetch a single user, or throw a 404 if missing.
  async getUser(id: number): Promise<PublicUser> {
    const user = await this.repository.findByIdWithoutPassword(id);
    if (!user) {
      throw new ServiceError('User not found', 404);
    }
    return user;
  }

  // Create a new user with a default password and write an audit log entry.
  async createUser(data: CreateUserInput, adminId: number): Promise<PublicUser> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ServiceError('Email already exists', 409);
    }

    const password = this.generatePassword(data.email);
    const hashedPassword = await hashPassword(password);

    const newId = await this.repository.create({
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      note: data.note ?? null,
      birthday: data.birthday ?? null,
      password: hashedPassword,
    });

    await this.repository.createAuditLog({
      admin_id: adminId,
      target_user_id: newId,
      action: 'CREATE',
      changed_fields: null,
    });

    return this.getUser(newId);
  }

  // Update a user, recording which fields actually changed.
  async updateUser(id: number, data: UpdateUserInput, adminId: number): Promise<PublicUser> {
    const oldUser = await this.getUser(id);

    const existing = await this.repository.findByEmail(data.email, id);
    if (existing) {
      throw new ServiceError('Email already exists', 409);
    }

    const changedFields = this.buildChangedFields(oldUser, data);

    await this.repository.update(id, {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      note: data.note ?? null,
      birthday: data.birthday ?? null,
    });

    await this.repository.createAuditLog({
      admin_id: adminId,
      target_user_id: id,
      action: 'UPDATE',
      changed_fields: changedFields,
    });

    return this.getUser(id);
  }

  // Delete a user (cannot delete self). Audit log is written first so the
  // target row still exists when the FK is checked.
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

  // Audit log list for a target user.
  async getUserActivity(id: number, limit = 20): Promise<AuditLog[]> {
    await this.getUser(id);
    return this.repository.getAuditLogs(id, limit);
  }
}
