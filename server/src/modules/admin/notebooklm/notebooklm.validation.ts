import { z } from 'zod';

const workspaceNameSchema = z
  .string()
  .trim()
  .min(3, 'Workspace name must be at least 3 characters')
  .max(255, 'Workspace name must be at most 255 characters');

export const listWorkspacesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(255).optional(),
  role: z.enum(['owner', 'editor', 'viewer']).optional(),
});

export const workspaceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const workspaceMemberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export const jobIdParamSchema = z.object({
  jobId: z.coerce.number().int().positive(),
});

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional(),
});

export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional(),
});

export const addMemberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.enum(['owner', 'editor', 'viewer']),
});

export const searchUsersQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required').max(255),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
});

export const uploadDocumentSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required').max(500),
  mimeType: z.string().trim().min(1, 'MIME type is required').max(100),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024),
  fileDataBase64: z.string().min(1, 'fileDataBase64 is required'),
});

export type ListWorkspacesQuery = z.infer<typeof listWorkspacesQuerySchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type SearchUsersQueryInput = z.infer<typeof searchUsersQuerySchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
