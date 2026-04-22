import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, checkEmailSchema } from '../users.validation';

// バリデーションスキーマテスト / Validation schema tests

describe('createUserSchema', () => {
  describe('name validation', () => {
    it('accepts name with exactly 2 characters (min boundary)', () => {
      // 最小境界: 2文字の名前を受け入れる
      const result = createUserSchema.safeParse({
        name: 'Jo',
        email: 'jo@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    it('accepts name with exactly 50 characters (max boundary)', () => {
      // 最大境界: 50文字の名前を受け入れる
      const result = createUserSchema.safeParse({
        name: 'A'.repeat(50),
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    it('rejects name with 1 character (below min)', () => {
      // 最小未満: 1文字の名前を拒否する
      const result = createUserSchema.safeParse({
        name: 'J',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('2 characters');
    });

    it('rejects name with 51 characters (above max)', () => {
      // 最大超過: 51文字の名前を拒否する
      const result = createUserSchema.safeParse({
        name: 'A'.repeat(51),
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('50 characters');
    });
  });

  describe('note validation', () => {
    it('accepts note with exactly 500 characters (max boundary)', () => {
      // 最大境界: 500文字のメモを受け入れる
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
        note: 'A'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('rejects note with 501 characters (above max)', () => {
      // 最大超過: 501文字のメモを拒否する
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
        note: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('500 characters');
    });

    it('accepts schema without note (optional)', () => {
      // メモなしのスキーマを受け入れる（任意）
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('birthday validation', () => {
    it('accepts a past date', () => {
      // 過去の日付を受け入れる
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
        birthday: '1990-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a future date', () => {
      // 未来の日付を拒否する
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
        birthday: futureDate.toISOString().split('T')[0],
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('future');
    });

    it('accepts schema without birthday (optional)', () => {
      // 誕生日なしのスキーマを受け入れる（任意）
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email validation', () => {
    it('rejects invalid email format', () => {
      // 不正なメール形式を拒否する
      const result = createUserSchema.safeParse({
        name: 'Test',
        email: 'not-an-email',
        role: 'user',
        status: 'active',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('updateUserSchema', () => {
  it('has same name constraints as createUserSchema', () => {
    // createUserSchemaと同じ名前制約を持つ
    const tooShort = updateUserSchema.safeParse({
      name: 'J',
      email: 'test@test.com',
      role: 'user',
      status: 'active',
    });
    expect(tooShort.success).toBe(false);

    const tooLong = updateUserSchema.safeParse({
      name: 'A'.repeat(51),
      email: 'test@test.com',
      role: 'user',
      status: 'active',
    });
    expect(tooLong.success).toBe(false);
  });

  it('accepts note and birthday in update schema', () => {
    // 更新スキーマでnoteとbirthdayを受け入れる
    const result = updateUserSchema.safeParse({
      name: 'Test User',
      email: 'test@test.com',
      role: 'user',
      status: 'active',
      note: 'Some note',
      birthday: '1985-06-15',
    });
    expect(result.success).toBe(true);
  });
});

describe('checkEmailSchema', () => {
  it('accepts valid email', () => {
    // 有効なメールを受け入れる
    const result = checkEmailSchema.safeParse({ email: 'user@test.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    // 無効なメールを拒否する
    const result = checkEmailSchema.safeParse({ email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('accepts optional excludeId as string and coerces to number', () => {
    // 文字列のexcludeIdを数値に変換する
    const result = checkEmailSchema.safeParse({ email: 'user@test.com', excludeId: '5' });
    expect(result.success).toBe(true);
    expect(result.data?.excludeId).toBe(5);
  });
});
