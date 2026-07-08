import { ApiProviderService } from './api-provider.service';
import { logger } from '@utils/logger.util';

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function registerConfiguredProviders(): void {
  const service = ApiProviderService.getInstance();

  if (hasValue(process.env.GEMINI_API_KEY)) {
    service.registerProvider('gemini', {
      apiKey: process.env.GEMINI_API_KEY,
      defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      baseUrl: process.env.GEMINI_BASE_URL || undefined,
    });
  }

  if (hasValue(process.env.ZAI_API_KEY)) {
    service.registerProvider('zai', {
      apiKey: process.env.ZAI_API_KEY,
      defaultModel: process.env.ZAI_MODEL || 'zai-default',
      baseUrl: process.env.ZAI_BASE_URL || undefined,
    });
  }

  if (hasValue(process.env.COMFY_BASE_URL)) {
    service.registerProvider('comfy', {
      baseUrl: process.env.COMFY_BASE_URL,
      defaultWorkflow: process.env.COMFY_WORKFLOW || 'comfy-default',
      apiKey: process.env.COMFY_API_KEY || undefined,
    });
  }

  const registered = service.getRegisteredProviders();
  logger.info(`AI providers registered: ${registered.length > 0 ? registered.join(', ') : 'none'}`);
}
