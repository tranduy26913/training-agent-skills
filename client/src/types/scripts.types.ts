export type ScriptStatus = 'draft' | 'generated';

export interface Script {
  id: number;
  title: string;
  idea: string;
  characterCount: number;
  minScenes: number;
  vibe: string[];
  content: string | null;
  status: ScriptStatus;
  projectId: number;
  projectName: string;
  ownerId: number;
  ownerName: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScriptDto {
  title: string;
  idea: string;
  characterCount: number;
  minScenes: number;
  vibe: string[];
  content?: string | null;
  status?: ScriptStatus;
  projectId: number;
}

export interface UpdateScriptDto {
  title?: string;
  idea?: string;
  characterCount?: number;
  minScenes?: number;
  vibe?: string[];
  content?: string | null;
  status?: ScriptStatus;
}

export interface GenerateScriptDto {
  title: string;
  idea: string;
  characterCount: number;
  minScenes: number;
  vibe: string[];
  aiModel: string;
}

export interface GenerateScriptResponse {
  content: string;
  model: string;
  provider: string;
}

export interface AiModelInfo {
  provider: string;
  models: string[];
}
