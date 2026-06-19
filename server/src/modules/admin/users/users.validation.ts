import { z } from 'zod';

// 莉頑律莉･蜑阪・譌･莉倥メ繧ｧ繝・け / Validate date is not in the future
const pastOrPresentDate = z
  .string()
  .optional()
  .refine(
    (val) => !val || new Date(val) <= new Date(),
    { message: 'Birthday cannot be in the future' },
  );

// 繝ｦ繝ｼ繧ｶ繝ｼ菴懈・繧ｹ繧ｭ繝ｼ繝・/ Schema for creating a user
export const createUserSchema = z.object({
  // [UPDATE] name: min 2, max 50 (was min 3, max 100)
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
  // [NEW] note and birthday fields
  note: z.string().max(500, 'Note must be at most 500 characters').optional(),
  birthday: pastOrPresentDate,
});

// 繝ｦ繝ｼ繧ｶ繝ｼ譖ｴ譁ｰ繧ｹ繧ｭ繝ｼ繝・/ Schema for updating a user
export const updateUserSchema = z.object({
  // [UPDATE] name: min 2, max 50 (was min 3, max 100)
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator'], { message: 'Role must be admin, user, or moderator' }),
  status: z.enum(['active', 'inactive', 'suspended'], { message: 'Status must be active, inactive, or suspended' }),
  // [NEW] note and birthday fields
  note: z.string().max(500, 'Note must be at most 500 characters').optional(),
  birthday: pastOrPresentDate,
});

// 繝｡繝ｼ繝ｫ繝√ぉ繝・け繧ｹ繧ｭ繝ｼ繝・/ Schema for email duplicate check query
export const checkEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  excludeId: z.coerce.number().int().positive().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CheckEmailQuery = z.infer<typeof checkEmailSchema>;
