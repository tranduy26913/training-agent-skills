import { vocabulariesApiService } from '@services/vocabularies.service';
import type {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  Vocabulary,
  VocabularyFilters,
} from '@apptypes/vocabularies.types';

export function useVocabularies() {
  return {
    getVocabularies(filters?: VocabularyFilters): Promise<Vocabulary[]> {
      return vocabulariesApiService.getVocabularies(filters);
    },
    getVocabulary(id: number): Promise<Vocabulary> {
      return vocabulariesApiService.getById(id);
    },
    createVocabulary(data: CreateVocabularyDto): Promise<Vocabulary> {
      return vocabulariesApiService.create(data);
    },
    updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<Vocabulary> {
      return vocabulariesApiService.update(id, data);
    },
    deleteVocabulary(id: number): Promise<void> {
      return vocabulariesApiService.delete(id);
    },
  };
}
