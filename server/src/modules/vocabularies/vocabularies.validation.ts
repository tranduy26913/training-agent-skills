// 語彙バリデーションスキーマ / Vocabulary module Zod validation schemas
import { z } from 'zod';

// 語彙作成スキーマ / Schema for creating/updating a vocabulary
export const createVocabularySchema = z.object({
  meaning_vi: z.string().min(1, 'meaning_vi is required').max(500, 'meaning_vi must be at most 500 characters'),
  hiragana: z.string().max(200, 'hiragana must be at most 200 characters').optional(),
  romaji: z.string().max(200, 'romaji must be at most 200 characters').optional(),
  kanji: z.string().max(200, 'kanji must be at most 200 characters').optional(),
  sino_vietnamese: z.string().max(200, 'sino_vietnamese must be at most 200 characters').optional(),
  level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1'], { message: 'level must be one of N5, N4, N3, N2, N1' }),
  media_url: z.string().url('media_url must be a valid URL').max(500).optional().or(z.literal('')),
  note: z.string().max(5000, 'note must be at most 5000 characters').optional(),
  status: z.enum(['publish', 'hide', 'delete'], { message: 'status must be one of publish, hide, delete' }),
  tags: z.array(z.string().max(100, 'each tag must be at most 100 characters')).optional(),
  related_ids: z.array(z.number().int().positive()).optional(),
  synonym_ids: z.array(z.number().int().positive()).optional(),
  antonym_ids: z.array(z.number().int().positive()).optional(),
});

// 語彙更新スキーマ / Same shape as create schema
export const updateVocabularySchema = createVocabularySchema;

// レポートステータス更新スキーマ / Schema for patching report status
export const updateReportStatusSchema = z.object({
  status: z.enum(['resolved', 'pending'], { message: 'status must be resolved or pending' }),
});

// タグ提案クエリスキーマ / Schema for tag suggest query
export const suggestTagsSchema = z.object({
  q: z.string().min(1, 'q is required'),
});

// 語彙検索クエリスキーマ / Schema for vocabulary search query
export const searchVocabSchema = z.object({
  q: z.string().min(1, 'q is required'),
  exclude: z.string().optional(),
});

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
