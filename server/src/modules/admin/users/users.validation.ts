import { z } from 'zod';

// Validate that a date string is not in the future.
const pastOrPresentDate = z
  .string()
  .optional()
  .refine(
    (val) => !val || new Date(val) <= new Date(),
    { message: 'Birthday cannot be in the future' },
  );

// Schema for creating a user.
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
  note: z.string().max(500, 'Note must be at most 500 characters').optional(),
  birthday: pastOrPresentDate,
});

// Schema for updating a user.
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
  note: z.string().max(500, 'Note must be at most 500 characters').optional(),
  birthday: pastOrPresentDate,
});

// Schema for the email duplicate check query.
export const checkEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  excludeId: z.coerce.number().int().positive().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CheckEmailQuery = z.infer<typeof checkEmailSchema>;