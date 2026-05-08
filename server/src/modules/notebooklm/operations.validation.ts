import { z } from 'zod';

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(['INGEST', 'QUERY', 'DELETE_DOC', 'DELETE_WORKSPACE']).optional(),
  status: z.enum(['pending', 'processing', 'retrying', 'done', 'failed', 'dead_letter']).optional(),
});

export const jobIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const retryJobBodySchema = z.object({
  reason: z.string().trim().min(1, 'Retry reason is required').max(500),
});

export const purgeDlqBodySchema = z.object({
  reason: z.string().trim().min(1, 'Purge reason is required').max(500),
});

export const updateDlqNoteBodySchema = z.object({
  note: z.string().trim().max(4000),
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
export type RetryJobBody = z.infer<typeof retryJobBodySchema>;
export type PurgeDlqBody = z.infer<typeof purgeDlqBodySchema>;