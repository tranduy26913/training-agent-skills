/**
 * ZaiProvider — connects to Zai AI API.
 */

import type { IAiProvider, GenerateOptions, ProviderResponse } from './types';

export interface ZaiConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class ZaiProvider implements IAiProvider {
  static readonly AVAILABLE_MODELS = ['zai-default', 'zai-pro'];

  readonly name = 'zai' as const;
  private config: ZaiConfig;

  constructor(config: ZaiConfig) {
    this.config = {
      baseUrl: 'https://api.zai.example.com/v1',
      defaultModel: 'zai-default',
      ...config,
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ProviderResponse> {
    const model = options?.model ?? this.config.defaultModel!;
    const url = `${this.config.baseUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: options?.stream ?? false,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Zai API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const choice = (data as any)?.choices?.[0];
    const content = choice?.message?.content ?? '';

    return {
      content,
      model,
      provider: 'zai',
      usage: data?.usage
        ? {
            promptTokens: (data.usage as any).prompt_tokens,
            completionTokens: (data.usage as any).completion_tokens,
            totalTokens: (data.usage as any).total_tokens,
          }
        : undefined,
      raw: data,
    };
  }
}
