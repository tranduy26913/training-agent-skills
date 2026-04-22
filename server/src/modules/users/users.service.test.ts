import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService, ServiceError } from './users.service';
import type { UserRow } from '../../models/users.model';

// パスワードハッシュモック / Mock hash utility
vi.mock('../../utils/hash.util', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
}));

// モックリポジトリ作成 / Create mock repository
function createMockRepository() {
  return {
    findAllWithFilters: vi.fn(),
    findByIdWithoutPassword: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createAuditLog: vi.fn(),
    getAuditLogs: vi.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new UsersService(mockRepo as any);
    vi.clearAllMocks();
  });

  describe('generatePassword', () => {
    it('generates password from email username + 123', () => {
      // メールのユーザー名 + 123でパスワードを生成する
      expect(service.generatePassword('jane@example.com')).toBe('jane123');
    });

    it('handles dots in email username', () => {
      // ドット付きメールのユーザー名を処理する
      expect(service.generatePassword('jane.smith@example.com')).toBe('jane.smith123');
    });
  });

  describe('buildChangedFields', () => {
    const oldUser = {
      id: 1,
      name: 'John',
      email: 'john@test.com',
      role: 'user',
      status: 'active',
      note: null,
      birthday: null,
    } as UserRow;

    it('returns only changed keys', () => {
      // 変更されたキーのみを返す
      const result = service.buildChangedFields(oldUser, {
        name: 'Jane',
        email: 'john@test.com',
        role: 'user',
        status: 'active',
      });

      expect(result).toEqual({ name: { old: 'John', new: 'Jane' } });
    });

    it('returns null when nothing changed', () => {
      // 変更がない場合nullを返す
      const result = service.buildChangedFields(oldUser, {
        name: 'John',
        email: 'john@test.com',
        role: 'user',
        status: 'active',
      });

      expect(result).toBeNull();
    });

    it('returns multiple changed fields', () => {
      // 複数の変更フィールドを返す
      const result = service.buildChangedFields(oldUser, {
        name: 'Jane',
        email: 'jane@test.com',
        role: 'admin',
        status: 'active',
      });

      expect(result).toEqual({
        name: { old: 'John', new: 'Jane' },
        email: { old: 'john@test.com', new: 'jane@test.com' },
        role: { old: 'user', new: 'admin' },
      });
    });

    it('tracks note and birthday changes', () => {
      // noteとbirthdayの変更を追跡する
      const result = service.buildChangedFields(oldUser, {
        name: 'John',
        email: 'john@test.com',
        role: 'user',
        status: 'active',
        note: 'New note',
        birthday: '1990-01-01',
      });

      expect(result).toEqual({
        note: { old: null, new: 'New note' },
        birthday: { old: null, new: '1990-01-01' },
      });
    });
  });

  describe('createUser', () => {
    it('creates user and audit log', async () => {
      // ユーザーと監査ログを作成する
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ insertId: 10 });
      mockRepo.findByIdWithoutPassword.mockResolvedValue({ id: 10, name: 'Test', email: 'test@test.com' });
      mockRepo.createAuditLog.mockResolvedValue(undefined);

      const result = await service.createUser(
        { name: 'Test', email: 'test@test.com', role: 'user', status: 'active' },
        1,
      );

      expect(result.id).toBe(10);
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', admin_id: 1, target_user_id: 10 }),
      );
    });

    it('passes note and birthday to repository', async () => {
      // noteとbirthdayをリポジトリに渡す
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ insertId: 11 });
      mockRepo.findByIdWithoutPassword.mockResolvedValue({ id: 11, name: 'Test2', email: 'test2@test.com' });
      mockRepo.createAuditLog.mockResolvedValue(undefined);

      await service.createUser(
        { name: 'Test2', email: 'test2@test.com', role: 'user', status: 'active', note: 'A note', birthday: '1990-05-01' },
        1,
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'A note', birthday: '1990-05-01' }),
      );
    });

    it('throws 409 when email already exists', async () => {
      // メールが既に存在する場合409をスローする
      mockRepo.findByEmail.mockResolvedValue({ id: 5, email: 'dup@test.com' });

      await expect(
        service.createUser(
          { name: 'Test', email: 'dup@test.com', role: 'user', status: 'active' },
          1,
        ),
      ).rejects.toThrow(ServiceError);

      try {
        await service.createUser(
          { name: 'Test', email: 'dup@test.com', role: 'user', status: 'active' },
          1,
        );
      } catch (error) {
        expect((error as ServiceError).code).toBe(409);
      }
    });
  });

  describe('deleteUser', () => {
    it('throws 400 when deleting own account', async () => {
      // 自分のアカウントを削除しようとすると400をスローする
      await expect(service.deleteUser(1, 1)).rejects.toThrow(ServiceError);

      try {
        await service.deleteUser(1, 1);
      } catch (error) {
        expect((error as ServiceError).code).toBe(400);
        expect((error as ServiceError).message).toBe('Cannot delete your own account');
      }
    });

    it('deletes user and creates audit log', async () => {
      // ユーザーを削除して監査ログを作成する
      mockRepo.findByIdWithoutPassword.mockResolvedValue({ id: 2, name: 'Target' });
      mockRepo.createAuditLog.mockResolvedValue(undefined);
      mockRepo.delete.mockResolvedValue({ affectedRows: 1 });

      await service.deleteUser(2, 1);

      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', admin_id: 1, target_user_id: 2 }),
      );
      expect(mockRepo.delete).toHaveBeenCalledWith(2);
    });
  });

  describe('updateUser', () => {
    it('updates user and logs changed fields', async () => {
      // ユーザーを更新して変更フィールドをログする
      const oldUser = { id: 1, name: 'Old', email: 'old@test.com', role: 'user', status: 'active', note: null, birthday: null };
      mockRepo.findByIdWithoutPassword
        .mockResolvedValueOnce(oldUser)
        .mockResolvedValueOnce({ id: 1, name: 'New', email: 'old@test.com', role: 'user', status: 'active' });
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue({ affectedRows: 1 });
      mockRepo.createAuditLog.mockResolvedValue(undefined);

      const result = await service.updateUser(
        1,
        { name: 'New', email: 'old@test.com', role: 'user', status: 'active' },
        5,
      );

      expect(result.name).toBe('New');
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          changed_fields: { name: { old: 'Old', new: 'New' } },
        }),
      );
    });

    it('does not include points in repository update call', async () => {
      // pointsはリポジトリの更新呼び出しに含まれない
      const oldUser = { id: 1, name: 'Bob', email: 'bob@test.com', role: 'user', status: 'active', note: null, birthday: null, points: 100 };
      mockRepo.findByIdWithoutPassword
        .mockResolvedValueOnce(oldUser)
        .mockResolvedValueOnce(oldUser);
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue({ affectedRows: 1 });
      mockRepo.createAuditLog.mockResolvedValue(undefined);

      await service.updateUser(1, { name: 'Bob', email: 'bob@test.com', role: 'user', status: 'active' }, 5);

      const updateCallArg = mockRepo.update.mock.calls[0][1];
      expect(updateCallArg).not.toHaveProperty('points');
    });

    it('throws 409 when email taken by another user', async () => {
      // 別のユーザーがメールを使用している場合409をスローする
      mockRepo.findByIdWithoutPassword.mockResolvedValue({ id: 1, name: 'John', email: 'john@test.com', role: 'user', status: 'active' });
      mockRepo.findByEmail.mockResolvedValue({ id: 2, email: 'taken@test.com' });

      await expect(
        service.updateUser(1, { name: 'John', email: 'taken@test.com', role: 'user', status: 'active' }, 5),
      ).rejects.toThrow(ServiceError);
    });
  });

  describe('getUser', () => {
    it('throws 404 when user not found', async () => {
      // ユーザーが見つからない場合404をスローする
      mockRepo.findByIdWithoutPassword.mockResolvedValue(null);

      await expect(service.getUser(999)).rejects.toThrow(ServiceError);

      try {
        await service.getUser(999);
      } catch (error) {
        expect((error as ServiceError).code).toBe(404);
      }
    });
  });

  describe('checkEmailDuplicate', () => {
    it('returns true when email is taken', async () => {
      // メールが使用済みの場合はtrueを返す
      mockRepo.findByEmail.mockResolvedValue({ id: 5, email: 'used@test.com' });

      const result = await service.checkEmailDuplicate('used@test.com');

      expect(result).toBe(true);
      expect(mockRepo.findByEmail).toHaveBeenCalledWith('used@test.com', undefined);
    });

    it('returns false when email is available', async () => {
      // メールが使用可能な場合はfalseを返す
      mockRepo.findByEmail.mockResolvedValue(null);

      const result = await service.checkEmailDuplicate('free@test.com');

      expect(result).toBe(false);
    });

    it('passes excludeId to repository when provided', async () => {
      // excludeIdが指定された場合、リポジトリに渡す
      mockRepo.findByEmail.mockResolvedValue(null);

      await service.checkEmailDuplicate('me@test.com', 3);

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('me@test.com', 3);
    });
  });
});
