/**
 * ComfyProvider — connects to a ComfyUI workflow server.
 */

import type { IAiProvider, GenerateOptions, ProviderResponse } from './types';

export interface ComfyConfig {
  baseUrl: string;
  defaultWorkflow?: string;
  apiKey?: string;
}

export class ComfyProvider implements IAiProvider {
  readonly name = 'comfy' as const;
  private config: ComfyConfig;

  constructor(config: ComfyConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl ?? 'http://localhost:8188',
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ProviderResponse> {
    const workflow = options?.model ?? this.config.defaultWorkflow ?? 'default';
    const url = `${this.config.baseUrl}/prompt`;

    const body: Record<string, unknown> = {
      prompt,
      workflow,
      ...(options ?? {}),
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ComfyUI API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      content: JSON.stringify(data),
      model: workflow,
      provider: 'comfy',
      raw: data,
    };
  }
}
