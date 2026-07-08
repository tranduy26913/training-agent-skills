import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type {
  AiModelInfo,
  CreateScriptDto,
  GenerateScriptDto,
  GenerateScriptResponse,
  Script,
  UpdateScriptDto,
} from '@apptypes/scripts.types';

class ScriptsApiClient extends BaseApiClient<Script, CreateScriptDto, UpdateScriptDto> {
  constructor() {
    super('/admin/scripts');
  }

  async getScripts(projectId: number): Promise<Script[]> {
    const response: AxiosResponse<{ data: Script[] }> = await apiClient.get(this.basePath, {
      params: { projectId },
    });
    return response.data.data;
  }

  async getById(id: number): Promise<Script> {
    const response: AxiosResponse<{ data: Script }> = await apiClient.get(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(data: CreateScriptDto): Promise<Script> {
    const response: AxiosResponse<{ data: Script }> = await apiClient.post(this.basePath, data);
    return response.data.data;
  }

  async update(id: number, data: UpdateScriptDto): Promise<Script> {
    const response: AxiosResponse<{ data: Script }> = await apiClient.put(`${this.basePath}/${id}`, data);
    return response.data.data;
  }

  async generate(data: GenerateScriptDto): Promise<GenerateScriptResponse> {
    const response: AxiosResponse<{ data: GenerateScriptResponse }> = await apiClient.post(
      `${this.basePath}/generate`,
      data,
    );
    return response.data.data;
  }

  async getAiModels(): Promise<AiModelInfo[]> {
    const response: AxiosResponse<{ data: AiModelInfo[] }> = await apiClient.get('/admin/ai-models');
    return response.data.data;
  }
}

export const scriptsApiService = new ScriptsApiClient();
