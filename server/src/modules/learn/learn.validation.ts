// 学習バリデーションスキーマ / FlashCard learning module Zod validation schemas
import { z } from 'zod';

// JLPT語彙レベル / Valid JLPT vocabulary levels
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

// 進捗ステータス / Valid progress statuses
const PROGRESS_STATUSES = ['new', 'learning', 'known'] as const;

// 語彙一覧クエリスキーマ / Schema for GET /api/learn/vocabularies query params
export const getVocabulariesQuerySchema = z.object({
  level: z.enum(JLPT_LEVELS, { message: 'level must be one of N5, N4, N3, N2, N1' }),
  progress_status: z.enum(['all', ...PROGRESS_STATUSES]).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

// バッチ進捗更新スキーマ / Schema for POST /api/learn/progress/batch body
export const batchUpdateProgressSchema = z.object({
  updates: z
    .array(
      z.object({
        vocabulary_id: z.number().int().positive('vocabulary_id must be a positive integer'),
        status: z.enum(PROGRESS_STATUSES, { message: 'status must be new, learning, or known' }),
      })
    )
    .min(1, 'updates must not be empty')
    .max(200, 'updates must not exceed 200 items'),
});

export type GetVocabulariesQuery = z.infer<typeof getVocabulariesQuerySchema>;
export type BatchUpdateProgressInput = z.infer<typeof batchUpdateProgressSchema>;
