// Projects module Zod validation schemas.
import { z } from 'zod';

// Schema for creating a project.
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Tên project phải từ 2-200 ký tự').max(200, 'Tên project phải từ 2-200 ký tự'),
  description: z.string().max(2000, 'Mô tả không được quá 2000 ký tự').optional(),
  projectPrompt: z.string().max(10000, 'Prompt không được quá 10000 ký tự').optional(),
});

// Schema for updating a project (all fields optional).
export const updateProjectSchema = z.object({
  name: z.string().min(2, 'Tên project phải từ 2-200 ký tự').max(200, 'Tên project phải từ 2-200 ký tự').optional(),
  description: z.string().max(2000, 'Mô tả không được quá 2000 ký tự').optional(),
  projectPrompt: z.string().max(10000, 'Prompt không được quá 10000 ký tự').optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
