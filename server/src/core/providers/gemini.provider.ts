/**
 * GeminiProvider — connects to Google Gemini API.
 */

import type { IAiProvider, GenerateOptions, ProviderResponse } from './types';

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class GeminiProvider implements IAiProvider {
  readonly name = 'gemini' as const;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.0-flash',
      ...config,
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ProviderResponse> {
    const model = options?.model ?? this.config.defaultModel!;
    const url = `${this.config.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;

    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const candidate = (data as any)?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? '';

    return {
      content,
      model,
      provider: 'gemini',
      raw: data,
    };
  }
}
