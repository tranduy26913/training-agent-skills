import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useVocabularies } from '@pages/vocabularies/composables/useVocabularies';
import type {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  Vocabulary,
  VocabularyFilters,
} from '@apptypes/vocabularies.types';

export const useVocabulariesStore = defineStore('vocabularies', () => {
  const {
    getVocabularies: apiGetVocabularies,
    getVocabulary: apiGetVocabulary,
    createVocabulary: apiCreateVocabulary,
    updateVocabulary: apiUpdateVocabulary,
    deleteVocabulary: apiDeleteVocabulary,
  } = useVocabularies();

  const vocabularies = ref<Vocabulary[]>([]);
  const currentVocabulary = ref<Vocabulary | null>(null);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);

  function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  }

  async function fetchVocabularies(filters?: VocabularyFilters): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      vocabularies.value = await apiGetVocabularies(filters);
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to fetch vocabularies');
    } finally {
      loading.value = false;
    }
  }

  async function fetchVocabulary(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentVocabulary.value = await apiGetVocabulary(id);
    } catch (err) {
      error.value = extractErrorMessage(err, 'Failed to fetch vocabulary');
      currentVocabulary.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function createVocabulary(data: CreateVocabularyDto): Promise<Vocabulary> {
    return apiCreateVocabulary(data);
  }

  async function updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<Vocabulary> {
    return apiUpdateVocabulary(id, data);
  }

  async function deleteVocabulary(id: number): Promise<void> {
    await apiDeleteVocabulary(id);
  }

  function clearCurrentVocabulary(): void {
    currentVocabulary.value = null;
  }

  return {
    vocabularies,
    currentVocabulary,
    loading,
    error,
    fetchVocabularies,
    fetchVocabulary,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    clearCurrentVocabulary,
  };
});
