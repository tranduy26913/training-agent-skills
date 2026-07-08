import { scriptsApiService } from '@services/scripts.service';
import type {
  AiModelInfo,
  CreateScriptDto,
  GenerateScriptDto,
  GenerateScriptResponse,
  Script,
  UpdateScriptDto,
} from '@apptypes/scripts.types';

export function useScripts() {
  return {
    getScripts(projectId: number): Promise<Script[]> {
      return scriptsApiService.getScripts(projectId);
    },
    getScript(id: number): Promise<Script> {
      return scriptsApiService.getById(id);
    },
    createScript(data: CreateScriptDto): Promise<Script> {
      return scriptsApiService.create(data);
    },
    updateScript(id: number, data: UpdateScriptDto): Promise<Script> {
      return scriptsApiService.update(id, data);
    },
    deleteScript(id: number): Promise<void> {
      return scriptsApiService.delete(id);
    },
    generateScript(data: GenerateScriptDto): Promise<GenerateScriptResponse> {
      return scriptsApiService.generate(data);
    },
    getAiModels(): Promise<AiModelInfo[]> {
      return scriptsApiService.getAiModels();
    },
  };
}
