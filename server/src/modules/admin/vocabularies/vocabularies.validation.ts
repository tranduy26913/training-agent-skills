import { z } from 'zod';

export const VOCABULARY_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'Other'] as const;
export const VOCABULARY_STATUSES = ['draft', 'published', 'archived'] as const;

const optionalString = (max: number, message: string) =>
  z.string().trim().max(max, message).nullable().optional();

const tagsSchema = z
  .array(z.string().trim().min(1).max(50, 'Each tag must be at most 50 characters'))
  .max(10, 'Maximum 10 tags allowed')
  .optional()
  .default([]);

const hiraganaSchema = optionalString(255, 'Hiragana must be at most 255 characters').refine(
  (value) => !value || /^[\u3040-\u30ff\u3400-\u9fff\sー々〆〤]+$/u.test(value),
  'Hiragana/Kana must contain Japanese characters',
);

const romajiSchema = optionalString(255, 'Romaji must be at most 255 characters').refine(
  (value) => !value || /^[a-zA-Z\s'-]+$/.test(value),
  'Romaji can only contain latin characters',
);

const mediaUrlSchema = optionalString(500, 'Media URL must be at most 500 characters').refine((value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, 'Media URL must be valid');

export const createVocabularySchema = z.object({
  kanji: z
    .string()
    .trim()
    .min(1, 'Kanji/Kana is required')
    .max(255, 'Kanji/Kana must be at most 255 characters')
    .refine((value) => !/^\d+$/.test(value), 'Kanji/Kana cannot contain only numbers'),
  hiragana: hiraganaSchema,
  romaji: romajiSchema,
  meaningVi: z.string().trim().min(1, 'Vietnamese meaning is required').max(1000, 'Meaning must be at most 1000 characters'),
  onYomi: optionalString(255, 'On-yomi must be at most 255 characters'),
  level: z.enum(VOCABULARY_LEVELS).default('N5'),
  mediaUrl: mediaUrlSchema,
  note: optionalString(2000, 'Note must be at most 2000 characters'),
  example: optionalString(1000, 'Example must be at most 1000 characters'),
  tags: tagsSchema,
  status: z.enum(VOCABULARY_STATUSES).default('draft'),
});

export const updateVocabularySchema = createVocabularySchema.partial();

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
