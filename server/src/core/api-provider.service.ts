/**
 * ApiProviderService — Factory for AI provider instances.
 *
 * Usage:
 * ```ts
 * const service = ApiProviderService.getInstance();
 * const gemini = service.getProvider('gemini');
 * const res = await gemini.generate('Hello');
 * ```
 */

import type { IAiProvider, ProviderType } from './providers/types';
import { GeminiProvider, type GeminiConfig } from './providers/gemini.provider';
import { ComfyProvider, type ComfyConfig } from './providers/comfy.provider';
import { ZaiProvider, type ZaiConfig } from './providers/zai.provider';
import { logger } from '@utils/logger.util';

/** Union of all provider config types. */
export type ProviderConfig = GeminiConfig | ComfyConfig | ZaiConfig;

export class ApiProviderService {
  private static instance: ApiProviderService;
  private providers = new Map<ProviderType, IAiProvider>();

  /** Map of provider constructors for factory registration. */
  private static registry: Record<
    ProviderType,
    new (config: any) => IAiProvider
  > = {
    gemini: GeminiProvider,
    comfy: ComfyProvider,
    zai: ZaiProvider,
  };

  private constructor() {}

  /** Get the singleton instance. */
  static getInstance(): ApiProviderService {
    if (!ApiProviderService.instance) {
      ApiProviderService.instance = new ApiProviderService();
    }
    return ApiProviderService.instance;
  }

  /**
   * Register (or re-register) a provider by type.
   * Throws if config is missing required fields.
   */
  registerProvider(type: ProviderType, config: ProviderConfig): void {
    const ProviderClass = ApiProviderService.registry[type];
    if (!ProviderClass) {
      throw new Error(`Unknown provider type: "${type}". Available: ${Object.keys(ApiProviderService.registry).join(', ')}`);
    }

    const provider = new ProviderClass(config);
    this.providers.set(type, provider);
    logger.info(`Provider registered: ${type}`);
  }

  /**
   * Get a registered provider instance.
   * Throws if the provider has not been registered yet.
   */
  getProvider(type: ProviderType): IAiProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(
        `Provider "${type}" is not registered. Call registerProvider() first.`,
      );
    }
    return provider;
  }

  /** Check if a provider is registered. */
  hasProvider(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  /** Unregister a provider. */
  unregisterProvider(type: ProviderType): void {
    this.providers.delete(type);
    logger.info(`Provider unregistered: ${type}`);
  }

  /** Get all registered provider names. */
  getRegisteredProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /** Reset all providers (useful in tests). */
  clear(): void {
    this.providers.clear();
  }
}
