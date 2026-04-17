import { z } from 'zod';

// ユーザー作成スキーマ / Schema for creating a user
export const createUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
});

// ユーザー更新スキーマ / Schema for updating a user
export const updateUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
