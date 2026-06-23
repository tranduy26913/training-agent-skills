// Base API client with common CRUD operations.
import apiClient from './api.service';
import type { AxiosResponse } from 'axios';
import type { PaginatedData } from '@apptypes/api.types';

/**
 * Base API client class.
 * Provides common CRUD operations for any resource.
 */
export class BaseApiClient<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
> {
  constructor(protected readonly basePath: string) {}

  // Get paginated list.
  async getList(params?: Record<string, unknown>): Promise<PaginatedData<TEntity>> {
    const query = this.buildQueryString(params);
    const response: AxiosResponse<PaginatedData<TEntity>> = await apiClient.get(
      `${this.basePath}${query}`,
    );
    return response.data;
  }

  // Get single entity by ID.
  async getById(id: number): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.get(
      `${this.basePath}/${id}`,
    );
    return response.data;
  }

  // Create a new entity.
  async create(data: TCreateDto): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.post(
      this.basePath,
      data,
    );
    return response.data;
  }

  // Update an existing entity by ID.
  async update(id: number, data: TUpdateDto): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.put(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data;
  }

  // Delete an entity by ID.
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // Build a URL query string from a params object.
  protected buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const str = searchParams.toString();
    return str ? `?${str}` : '';
  }
}