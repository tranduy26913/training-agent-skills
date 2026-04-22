// ベースAPIクライアント / Base API client with common CRUD operations
import apiClient from './api.service';
import type { AxiosResponse } from 'axios';
import type { PaginatedData } from '@/types/api.types';

/**
 * ベースAPIクライアントクラス / Base API client class
 * 共通のCRUD操作を提供する / Provides common CRUD operations for any resource
 */
export class BaseApiClient<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
> {
  constructor(protected readonly basePath: string) {}

  // 一覧取得（ページネーション付き） / Get paginated list
  async getList(params?: Record<string, unknown>): Promise<PaginatedData<TEntity>> {
    const query = this.buildQueryString(params);
    const response: AxiosResponse<PaginatedData<TEntity>> = await apiClient.get(
      `${this.basePath}${query}`,
    );
    return response.data;
  }

  // 単一取得 / Get single entity by ID
  async getById(id: number): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.get(
      `${this.basePath}/${id}`,
    );
    return response.data;
  }

  // 作成 / Create new entity
  async create(data: TCreateDto): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.post(
      this.basePath,
      data,
    );
    return response.data;
  }

  // 更新 / Update existing entity by ID
  async update(id: number, data: TUpdateDto): Promise<TEntity> {
    const response: AxiosResponse<TEntity> = await apiClient.put(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data;
  }

  // 削除 / Delete entity by ID
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // クエリ文字列構築 / Build URL query string from params object
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
