// 語彙バリデーションスキーマ / Vocabulary validation schemas
import { z } from 'zod';

// 語彙作成スキーマ / Create vocabulary schema
export const createVocabularySchema = z.object({
  meaning_vi: z.string().min(1).max(500),
  hiragana: z.string().min(1).max(200),
  romaji: z.string().max(200).optional(),
  kanji: z.string().max(200).optional(),
  sino_vietnamese: z.string().max(200).optional(),
  level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']),
  image_url: z.string().url().optional().or(z.literal('')),
  note: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(['publish', 'hide', 'deleted']),
  related_ids: z.array(z.number()).optional(),
  synonym_ids: z.array(z.number()).optional(),
  antonym_ids: z.array(z.number()).optional(),
});

// 語彙更新スキーマ (全フィールド任意) / Update vocabulary schema (all fields optional)
export const updateVocabularySchema = createVocabularySchema.partial();

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
