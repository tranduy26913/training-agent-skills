import { z } from 'zod';

// Login request validation schema.
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Update profile request validation schema.
// ~2.7MB base64 (= 2MB raw file * 1.37 encoding overhead).
const MAX_AVATAR_BASE64_LENGTH = 2_800_000;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters'),
  birthday: z
    .string()
    .optional()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      'Birthday cannot be in the future',
    ),
  note: z.string().max(500, 'Note must be under 500 characters').optional(),
  avatar: z
    .string()
    .max(MAX_AVATAR_BASE64_LENGTH, 'Avatar file exceeds maximum allowed size')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Change password request validation schema.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
