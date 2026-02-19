import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { AquaListParams, AquaListResponse } from '../types/aqua-crud';

function buildQuery(params: AquaListParams): string {
  const query = new URLSearchParams();
  if (params.pageNumber != null) query.append('pageNumber', String(params.pageNumber));
  if (params.pageSize != null) query.append('pageSize', String(params.pageSize));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDirection) query.append('sortDirection', params.sortDirection);
  if (params.filters) query.append('filters', JSON.stringify(params.filters));
  if (params.filterLogic) query.append('filterLogic', params.filterLogic);
  return query.toString();
}

function ensureSuccess<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success) {
    throw new Error(response.message || fallback);
  }

  if (response.data == null) {
    throw new Error(fallback);
  }

  return response.data;
}

export const aquaCrudApi = {
  async getList(endpoint: string, params: AquaListParams): Promise<AquaListResponse> {
    const query = buildQuery(params);
    const response = await api.get<ApiResponse<AquaListResponse>>(`/api/aqua/${endpoint}${query ? `?${query}` : ''}`);
    return ensureSuccess(response, 'Liste verisi alınamadı');
  },

  async create(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/api/aqua/${endpoint}`, payload);
    return ensureSuccess(response, 'Kayıt oluşturulamadı');
  },

  async update(endpoint: string, id: number, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/aqua/${endpoint}/${id}`, payload);
    return ensureSuccess(response, 'Kayıt güncellenemedi');
  },

  async remove(endpoint: string, id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/aqua/${endpoint}/${id}`);
    return ensureSuccess(response, 'Kayıt silinemedi');
  },

  async postDocument(slug: string, id: number): Promise<boolean> {
    const response = await api.post<ApiResponse<boolean>>(`/api/aqua/posting/${slug}/${id}`);
    return ensureSuccess(response, 'Posting işlemi başarısız');
  },
};
