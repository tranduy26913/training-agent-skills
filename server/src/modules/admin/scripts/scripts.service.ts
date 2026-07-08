import { ApiProviderService } from '@core/api-provider.service';
import { ServiceError } from '@models/common.model';
import { ScriptsRepository, type ScriptRow } from './scripts.repository';
import type { CreateScriptInput, GenerateScriptInput, UpdateScriptInput } from './scripts.validation';

export interface ScriptResponse {
  id: number;
  title: string;
  idea: string;
  characterCount: number;
  minScenes: number;
  vibe: string[];
  content: string | null;
  status: 'draft' | 'generated';
  projectId: number;
  projectName: string;
  ownerId: number;
  ownerName: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateScriptResponse {
  content: string;
  model: string;
  provider: string;
}

function toResponse(row: ScriptRow): ScriptResponse {
  return {
    id: row.id,
    title: row.title,
    idea: row.idea,
    characterCount: row.characterCount,
    minScenes: row.minScenes,
    vibe: Array.isArray(row.vibe) ? row.vibe.map(String) : [],
    content: row.content,
    status: row.status === 'generated' ? 'generated' : 'draft',
    projectId: row.projectId,
    projectName: row.project.name,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function stripMarkdownFence(content: string): string {
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function normalizeJsonContent(content: string | null | undefined, statusCode = 400): {
  content: string | null;
  status: 'draft' | 'generated';
} {
  if (content === undefined || content === null || content.trim() === '') {
    return { content: null, status: 'draft' };
  }

  const candidate = stripMarkdownFence(content);
  try {
    const parsed = JSON.parse(candidate);
    return { content: JSON.stringify(parsed, null, 2), status: 'generated' };
  } catch {
    throw new ServiceError('Content must be valid JSON', statusCode);
  }
}

function buildPrompt(data: GenerateScriptInput): string {
  return [
    'You are a professional video script writer.',
    'Return only valid JSON. Do not wrap the result in markdown.',
    `Title: ${data.title}`,
    `Idea: ${data.idea}`,
    `Character count: ${data.characterCount}`,
    `Minimum scenes: ${data.minScenes}`,
    `Vibe/style tags: ${data.vibe.join(', ')}`,
    'Suggested JSON shape: {"title": string, "characters": [], "scenes": []}.',
  ].join('\n');
}

export class ScriptsService {
  private repository: ScriptsRepository;
  private providerService: ApiProviderService;

  constructor(repository?: ScriptsRepository, providerService?: ApiProviderService) {
    this.repository = repository || new ScriptsRepository();
    this.providerService = providerService || ApiProviderService.getInstance();
  }

  async getScripts(projectId: number): Promise<ScriptResponse[]> {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new ServiceError('projectId is required', 400);
    }
    const rows = await this.repository.findByProject(projectId);
    return rows.map(toResponse);
  }

  async getScript(id: number): Promise<ScriptResponse> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ServiceError('Script not found', 404);
    }
    return toResponse(row);
  }

  async createScript(data: CreateScriptInput, ownerId: number): Promise<ScriptResponse> {
    const project = await this.repository.findProject(data.projectId);
    if (!project) {
      throw new ServiceError('Project not found', 404);
    }

    const normalized = normalizeJsonContent(data.content);
    const created = await this.repository.create({
      title: data.title,
      idea: data.idea,
      characterCount: data.characterCount,
      minScenes: data.minScenes,
      vibe: data.vibe,
      content: normalized.content,
      status: normalized.status,
      project: { connect: { id: data.projectId } },
      owner: { connect: { id: ownerId } },
    });

    await this.repository.createAuditLog({
      adminId: ownerId,
      targetUserId: ownerId,
      action: 'CREATE_SCRIPT',
      changedFields: { scriptId: created.id, title: data.title, projectId: data.projectId },
    });

    return this.getScript(created.id);
  }

  async updateScript(id: number, data: UpdateScriptInput, adminId: number): Promise<ScriptResponse> {
    const current = await this.getScript(id);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.idea !== undefined) updateData.idea = data.idea;
    if (data.characterCount !== undefined) updateData.characterCount = data.characterCount;
    if (data.minScenes !== undefined) updateData.minScenes = data.minScenes;
    if (data.vibe !== undefined) updateData.vibe = data.vibe;
    if (Object.prototype.hasOwnProperty.call(data, 'content')) {
      const normalized = normalizeJsonContent(data.content);
      updateData.content = normalized.content;
      updateData.status = normalized.status;
    }

    await this.repository.update(id, updateData);
    await this.repository.createAuditLog({
      adminId,
      targetUserId: current.ownerId,
      action: 'UPDATE_SCRIPT',
      changedFields: { scriptId: id, ...updateData },
    });

    return this.getScript(id);
  }

  async deleteScript(id: number, adminId: number): Promise<void> {
    const current = await this.getScript(id);
    await this.repository.createAuditLog({
      adminId,
      targetUserId: current.ownerId,
      action: 'DELETE_SCRIPT',
      changedFields: { scriptId: id, title: current.title },
    });
    await this.repository.softDelete(id);
  }

  async generateScript(data: GenerateScriptInput): Promise<GenerateScriptResponse> {
    try {
      const result = await this.providerService.generateWithModel(data.aiModel, buildPrompt(data));
      const normalized = normalizeJsonContent(result.content, 502);
      return {
        content: normalized.content ?? '',
        model: result.model,
        provider: result.provider,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Unknown AI model')) {
        throw new ServiceError('Unknown AI model', 400);
      }
      if (message.includes('not registered')) {
        throw new ServiceError('AI provider is not registered', 503);
      }
      throw new ServiceError('AI provider returned an error', 502);
    }
  }

  getAiModels() {
    return this.providerService.getAvailableModels();
  }
}
