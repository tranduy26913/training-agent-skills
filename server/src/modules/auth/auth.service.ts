import { prisma } from '@database/prisma';
import { comparePassword, hashPassword } from '@utils/hash.util';
import { signToken } from '@utils/token.util';
import { ServiceError } from '@models/common.model';
import type { UserRole } from '@models/common.model';
import type { AuthUser, LoginResponseData } from '@models/auth.model';
import type { LoginInput, UpdateProfileInput, ChangePasswordInput } from './auth.validation';

// Public user fields returned to clients (no password hash).
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

// Authentication service backed by Prisma.
export class AuthService {
  // Login with email + password. Returns null for unknown email, inactive
  // accounts, or wrong password (caller decides how to map that to HTTP).
  async login(input: LoginInput): Promise<LoginResponseData | null> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        ...USER_PUBLIC_SELECT,
        status: true,
        password: true,
      },
    });

    if (!user) return null;
    if (user.status !== 'active') return null;

    const valid = await comparePassword(input.password, user.password);
    if (!valid) return null;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    const { password, ...userWithoutPassword } = user;
    const authUser: AuthUser = {
      id: userWithoutPassword.id,
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role as UserRole,
      status: userWithoutPassword.status,
    };

    return { token, user: authUser };
  }

  // Update the authenticated user's profile. Only name, birthday, note, and
  // avatar are allowed; other fields are ignored.
  async updateProfile(
    userId: number,
    input: UpdateProfileInput,
  ): Promise<AuthUser> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new ServiceError('User not found', 404);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        birthday: input.birthday ? new Date(input.birthday) : null,
        note: input.note ?? null,
        avatar: input.avatar ?? null,
      },
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
    if (!updated) {
      throw new ServiceError('User not found', 404);
    }
    return {
      ...updated,
      role: updated.role as UserRole,
    };
  }

  // Change the authenticated user's password after verifying the current one.
  async changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    const isValid = await comparePassword(input.currentPassword, user.password);
    if (!isValid) {
      throw new ServiceError('Current password is incorrect', 401);
    }

    const hashed = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }
}
