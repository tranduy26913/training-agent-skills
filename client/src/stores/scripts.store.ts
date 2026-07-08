import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useScripts } from '@pages/scripts/composables/useScripts';
import type {
  AiModelInfo,
  CreateScriptDto,
  GenerateScriptDto,
  GenerateScriptResponse,
  Script,
  UpdateScriptDto,
} from '@apptypes/scripts.types';

export const useScriptsStore = defineStore('scripts', () => {
  const {
    getScripts: apiGetScripts,
    getScript: apiGetScript,
    createScript: apiCreateScript,
    updateScript: apiUpdateScript,
    deleteScript: apiDeleteScript,
    generateScript: apiGenerateScript,
    getAiModels: apiGetAiModels,
  } = useScripts();

  const scripts = ref<Script[]>([]);
  const currentScript = ref<Script | null>(null);
  const aiModels = ref<AiModelInfo[]>([]);
  const loading = shallowRef(false);
  const generating = shallowRef(false);
  const error = shallowRef<string | null>(null);

  function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  }

  async function fetchScripts(projectId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      scripts.value = await apiGetScripts(projectId);
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to fetch scripts');
    } finally {
      loading.value = false;
    }
  }

  async function fetchScript(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentScript.value = await apiGetScript(id);
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to fetch script');
    } finally {
      loading.value = false;
    }
  }

  async function fetchAiModels(): Promise<void> {
    error.value = null;
    try {
      aiModels.value = await apiGetAiModels();
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to fetch AI models');
      aiModels.value = [];
    }
  }

  async function createScript(data: CreateScriptDto): Promise<Script> {
    return apiCreateScript(data);
  }

  async function updateScript(id: number, data: UpdateScriptDto): Promise<Script> {
    return apiUpdateScript(id, data);
  }

  async function deleteScript(id: number): Promise<void> {
    await apiDeleteScript(id);
  }

  async function generateScript(data: GenerateScriptDto): Promise<GenerateScriptResponse> {
    generating.value = true;
    error.value = null;
    try {
      return await apiGenerateScript(data);
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to generate script');
      throw err;
    } finally {
      generating.value = false;
    }
  }

  function clearCurrentScript(): void {
    currentScript.value = null;
  }

  return {
    scripts,
    currentScript,
    aiModels,
    loading,
    generating,
    error,
    fetchScripts,
    fetchScript,
    fetchAiModels,
    createScript,
    updateScript,
    deleteScript,
    generateScript,
    clearCurrentScript,
  };
});
