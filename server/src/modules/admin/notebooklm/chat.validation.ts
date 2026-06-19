// チャチE��機�EのバリチE�EションスキーチE/ Validation schemas for chat feature
import { z } from 'zod';

// [CR-NBLM-LLM-001] LLMプロバイダーの列挙垁E/ LLM provider enum for validation
const llmProviderEnum = z.enum(['ollama', 'mock', 'gemini']);

// セチE��ョン作�EスキーチE/ Schema for creating a chat session
export const createSessionSchema = z.object({
  title: z.string().trim().max(255, 'Title must be at most 255 characters').optional(),
  llmProvider: llmProviderEnum.optional().default('ollama'),
});

// セチE��ョン更新スキーチE/ Schema for updating a chat session
export const updateSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  llmProvider: llmProviderEnum.optional().default('ollama'),
});

// メチE��ージ送信スキーチE/ Schema for sending a chat message
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be at most 10000 characters'),
  llmProvider: llmProviderEnum.optional(),
});

// セチE��ョン一覧クエリスキーチE/ Schema for listing sessions query params
export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

// 型推論エクスポ�EチE/ Inferred type exports
// z.input を使用してフォーム入力型(任意フィールド含む)を取征E/ Use z.input for types with optional fields before defaults
export type CreateSessionInput = z.input<typeof createSessionSchema>;
export type UpdateSessionInput = z.input<typeof updateSessionSchema>;
export type SendMessageInput = z.input<typeof sendMessageSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
