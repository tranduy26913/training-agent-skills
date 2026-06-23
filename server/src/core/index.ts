/**
 * Core module — AI provider abstraction layer.
 *
 * Provides a unified factory (ApiProviderService) and concrete providers
 * for Gemini, ComfyUI, and Zai APIs.
 */

export { ApiProviderService } from './api-provider.service';
export type { ProviderConfig } from './api-provider.service';

export {
  // Types
  type IAiProvider,
  type ProviderType,
  type GenerateOptions,
  type ProviderResponse,
  // Providers
  GeminiProvider,
  type GeminiConfig,
  ComfyProvider,
  type ComfyConfig,
  ZaiProvider,
  type ZaiConfig,
} from './providers';
