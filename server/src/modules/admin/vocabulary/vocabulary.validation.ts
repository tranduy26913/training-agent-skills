/**
 * Vocabulary Validation Schemas
 * Zod schemas for vocabulary input validation
 * English and Japanese comments for clarity
 */

import { z } from 'zod';
import { VocabularyStatus, VocabLevel } from '@models/vocabularies.model';

/**
 * Validate kanji field
 * - Required, 1-255 characters
 * - Cannot be numbers only
 * 漢字フィールド�E検証
 */
const kanjiSchema = z
  .string({
    required_error: 'Kanji is required',
    invalid_type_error: 'Kanji must be a string',
  })
  .min(1, 'Kanji must be at least 1 character')
  .max(255, 'Kanji must be at most 255 characters')
  .refine(
    (val) => !/^\d+$/.test(val),
    {
      message: 'Kanji cannot be only numbers',
    }
  );

/**
 * Validate hiragana field
 * - Optional, 1-255 characters
 * - Only Hiragana, Katakana, and prolonged sound mark (ー)
 * ひらがなフィールド�E検証
 */
const hiraganaSchema = z
  .string({
    invalid_type_error: 'Hiragana must be a string',
  })
  .min(1, 'Hiragana must be at least 1 character')
  .max(255, 'Hiragana must be at most 255 characters')
  .regex(
    /^[\u3040-\u309F\u30A0-\u30FFー]*$/,
    {
      message: 'Hiragana must contain only Japanese characters (Hiragana, Katakana, or prolonged sound mark)',
    }
  )
  .nullable()
  .optional();

/**
 * Validate romaji field
 * - Optional, 1-255 characters
 * - Only lowercase/uppercase a-z
 * ローマ字フィールド�E検証
 */
const romajiSchema = z
  .string({
    invalid_type_error: 'Romaji must be a string',
  })
  .min(1, 'Romaji must be at least 1 character')
  .max(255, 'Romaji must be at most 255 characters')
  .regex(
    /^[a-zA-Z]+$/,
    {
      message: 'Romaji must contain only letters a-z',
    }
  )
  .nullable()
  .optional();

/**
 * Validate meaning_vi field
 * - Required, 1-1000 characters
 * ベトナム語�E意味フィールド�E検証
 */
const meaningViSchema = z
  .string({
    required_error: 'Meaning in Vietnamese is required',
    invalid_type_error: 'Meaning in Vietnamese must be a string',
  })
  .min(1, 'Meaning in Vietnamese must be at least 1 character')
  .max(1000, 'Meaning in Vietnamese must be at most 1000 characters');

/**
 * Validate on_yomi field
 * - Optional, 1-255 characters
 * 音読みフィールド�E検証
 */
const onYomiSchema = z
  .string({
    invalid_type_error: 'On-yomi must be a string',
  })
  .min(1, 'On-yomi must be at least 1 character')
  .max(255, 'On-yomi must be at most 255 characters')
  .nullable()
  .optional();

/**
 * Validate level field
 * - Optional, must be one of JLPT levels
 * JLPT レベルフィールド�E検証
 */
const levelSchema = z.nativeEnum(VocabLevel, {
  message: 'Level must be one of N5, N4, N3, N2, or N1',
}).nullable().optional();

/**
 * Validate media_url field
 * - Optional, must be valid URL format
 * メチE��ア URL フィルド�E検証
 */
const mediaUrlSchema = z
  .string({
    invalid_type_error: 'Media URL must be a string',
  })
  .url('Media URL must be a valid URL')
  .max(500, 'Media URL must be at most 500 characters')
  .nullable()
  .optional()
  .or(z.literal(''));

/**
 * Validate note field
 * - Optional, max 2000 characters
 * 備老E��ィールド�E検証
 */
const noteSchema = z
  .string({
    invalid_type_error: 'Note must be a string',
  })
  .max(2000, 'Note must be at most 2000 characters')
  .nullable()
  .optional();

/**
 * Validate tags field
 * - Optional, array of strings
 * - Max 10 tags
 * - Each tag max 50 characters
 * タグフィールド�E検証
 */
const tagsSchema = z
  .array(
    z
      .string({
        invalid_type_error: 'Each tag must be a string',
      })
      .min(1, 'Each tag must be at least 1 character')
      .max(50, 'Each tag must be at most 50 characters')
  )
  .max(10, 'Maximum 10 tags allowed')
  .nullable()
  .optional();

/**
 * Validate status field
 * - Optional, default 'Publish'
 * - Must be one of VocabularyStatus
 * スチE�Eタスフィールド�E検証
 */
const statusSchema = z.nativeEnum(VocabularyStatus, {
  message: 'Status must be Publish, Hide, or Delete',
}).nullable().optional();

/**
 * Validate relations field
 * - Optional, object with related, synonyms, antonyms arrays
 * - Each array contains vocabulary IDs (numbers)
 * 関連付けフィールド�E検証
 */
const relationsSchema = z
  .object({
    related: z.array(z.number().int().positive('Vocabulary ID must be positive')).optional(),
    synonyms: z.array(z.number().int().positive('Vocabulary ID must be positive')).optional(),
    antonyms: z.array(z.number().int().positive('Vocabulary ID must be positive')).optional(),
  })
  .nullable()
  .optional();

// ============================================================================
// Create Vocabulary Schema
// ============================================================================

/**
 * Schema for creating a new vocabulary
 * 新しい語彙を作�EするためのスキーチE
 */
export const createVocabularySchema = z.object({
  kanji: kanjiSchema,
  hiragana: hiraganaSchema,
  romaji: romajiSchema,
  meaning_vi: meaningViSchema,
  on_yomi: onYomiSchema,
  level: levelSchema,
  media_url: mediaUrlSchema,
  note: noteSchema,
  tags: tagsSchema,
  status: statusSchema,
  relations: relationsSchema,
});

// ============================================================================
// Update Vocabulary Schema
// ============================================================================

/**
 * Schema for updating an existing vocabulary
 * 既存�E語彙を更新するためのスキーチE
 * All fields are optional for partial updates
 */
export const updateVocabularySchema = z.object({
  kanji: kanjiSchema.optional(),
  hiragana: hiraganaSchema.optional(),
  romaji: romajiSchema.optional(),
  meaning_vi: meaningViSchema.optional(),
  on_yomi: onYomiSchema.optional(),
  level: levelSchema.optional(),
  media_url: mediaUrlSchema.optional(),
  note: noteSchema.optional(),
  tags: tagsSchema.optional(),
  status: statusSchema.optional(),
  relations: relationsSchema.optional(),
});

// ============================================================================
// Vocabulary Filter Schema
// ============================================================================

/**
 * Schema for vocabulary filter query parameters
 * 語彙フィルタークエリパラメータのスキーチE
 */
export const vocabularyFilterSchema = z.object({
  kanji: z.string().optional(),
  level: z.nativeEnum(VocabLevel).optional(),
  status: z.nativeEnum(VocabularyStatus).optional(),
  tag: z.string().optional(),
  createdBy: z.coerce.number().int().positive().optional(),
});

// ============================================================================
// Resolve Report Schema
// ============================================================================

/**
 * Schema for resolving a vocabulary report
 * 語彙レポ�Eトを解決するためのスキーチE
 */
export const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed'], {
    message: 'Report status must be resolved or dismissed',
  }),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
export type VocabularyFilterInput = z.infer<typeof vocabularyFilterSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate create vocabulary DTO
 * 作�E語彁EDTO を検証
 */
export function validateCreateVocabularyDto(data: unknown): CreateVocabularyInput {
  return createVocabularySchema.parse(data);
}

/**
 * Validate update vocabulary DTO
 * 更新語彁EDTO を検証
 */
export function validateUpdateVocabularyDto(data: unknown): UpdateVocabularyInput {
  return updateVocabularySchema.parse(data);
}

/**
 * Validate vocabulary filter
 * 語彙フィルターを検証
 */
export function validateVocabularyFilter(data: unknown): VocabularyFilterInput {
  return vocabularyFilterSchema.parse(data);
}

/**
 * Validate resolve report DTO
 * レポ�Eト解決 DTO を検証
 */
export function validateResolveReportDto(data: unknown): ResolveReportInput {
  return resolveReportSchema.parse(data);
}
