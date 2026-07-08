import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  Vocabulary,
  VocabularyFilters,
} from '@apptypes/vocabularies.types';

class VocabulariesApiClient extends BaseApiClient<Vocabulary, CreateVocabularyDto, UpdateVocabularyDto> {
  constructor() {
    super('/admin/vocabularies');
  }

  async getVocabularies(filters: VocabularyFilters = {}): Promise<Vocabulary[]> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
    const response: AxiosResponse<{ data: Vocabulary[] }> = await apiClient.get(this.basePath, { params });
    return response.data.data;
  }

  async getById(id: number): Promise<Vocabulary> {
    const response: AxiosResponse<{ data: Vocabulary }> = await apiClient.get(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(data: CreateVocabularyDto): Promise<Vocabulary> {
    const response: AxiosResponse<{ data: Vocabulary }> = await apiClient.post(this.basePath, data);
    return response.data.data;
  }

  async update(id: number, data: UpdateVocabularyDto): Promise<Vocabulary> {
    const response: AxiosResponse<{ data: Vocabulary }> = await apiClient.put(`${this.basePath}/${id}`, data);
    return response.data.data;
  }
}

export const vocabulariesApiService = new VocabulariesApiClient();
