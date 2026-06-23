/**
 * Core provider types for AI content generation.
 * Defines the contract that all AI providers must implement.
 */

/** Supported AI provider identifiers. */
export type ProviderType = 'gemini' | 'comfy' | 'zai';

/** Generic options passed to a provider's generate method. */
export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

/** Standardised response from any AI provider. */
export interface ProviderResponse {
  content: string;
  model: string;
  provider: ProviderType;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

/** Interface every AI provider must implement. */
export interface IAiProvider {
  /** Unique provider identifier matching ProviderType. */
  readonly name: ProviderType;

  /** Send a prompt and receive a complete response. */
  generate(prompt: string, options?: GenerateOptions): Promise<ProviderResponse>;

  /** Optional streaming support. */
  stream?(prompt: string, options?: GenerateOptions): AsyncIterable<ProviderResponse>;
}
