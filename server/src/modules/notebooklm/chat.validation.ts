// チャット機能のバリデーションスキーマ / Validation schemas for chat feature
import { z } from 'zod';

// [CR-NBLM-LLM-001] LLMプロバイダーの列挙型 / LLM provider enum for validation
const llmProviderEnum = z.enum(['ollama', 'mock', 'gemini']);

// セッション作成スキーマ / Schema for creating a chat session
export const createSessionSchema = z.object({
  title: z.string().trim().max(255, 'Title must be at most 255 characters').optional(),
  llmProvider: llmProviderEnum.optional().default('ollama'),
});

// セッション更新スキーマ / Schema for updating a chat session
export const updateSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  llmProvider: llmProviderEnum.optional().default('ollama'),
});

// メッセージ送信スキーマ / Schema for sending a chat message
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be at most 10000 characters'),
});

// セッション一覧クエリスキーマ / Schema for listing sessions query params
export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

// 型推論エクスポート / Inferred type exports
// z.input を使用してフォーム入力型(任意フィールド含む)を取得 / Use z.input for types with optional fields before defaults
export type CreateSessionInput = z.input<typeof createSessionSchema>;
export type UpdateSessionInput = z.input<typeof updateSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
