/**
 * Client-side Zod validation schema for vocabulary forms
 * フォームバリデーションスキーマ（クライアント側）
 */
import { z } from 'zod';

// JLPT level and status enums / JLPTレベルとステータスenum
const VocabularyLevelEnum = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
const VocabularyStatusEnum = z.enum(['publish', 'hide', 'deleted']);

// フォームバリデーションスキーマ / Form validation schema
export const vocabularyFormSchema = z.object({
  meaning_vi: z.string().trim().min(1, 'Nghĩa TV là bắt buộc').max(500, 'Nghĩa TV tối đa 500 ký tự'),
  hiragana: z.string().trim().min(1, 'Hiragana là bắt buộc').max(200, 'Hiragana tối đa 200 ký tự'),
  romaji: z.string().max(200).optional().default(''),
  kanji: z.string().max(200).optional().default(''),
  sino_vi: z.string().max(200).optional().default(''),
  level: VocabularyLevelEnum.refine((v) => v !== undefined, { message: 'Cấp độ là bắt buộc' }),
  status: VocabularyStatusEnum.default('publish'),
  image_url: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'image_url phải là URL hợp lệ',
    })
    .default(''),
  note: z.string().max(2000, 'Note tối đa 2000 ký tự').optional().default(''),
  tags: z
    .array(z.string().max(50, 'Mỗi tag tối đa 50 ký tự'))
    .max(20, 'Tối đa 20 tags')
    .optional()
    .default([]),
  related_ids: z.array(z.number()).optional().default([]),
  synonym_ids: z.array(z.number()).optional().default([]),
  antonym_ids: z.array(z.number()).optional().default([]),
});

export type VocabularyFormValues = z.infer<typeof vocabularyFormSchema>;
