import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type {
  ProjectDto,
  StockDto,
  ProjectCageDto,
  CreateProjectPayload,
  CreateGoodsReceiptPayload,
  CreateGoodsReceiptLinePayload,
  CreateGoodsReceiptFishDistributionPayload,
  GoodsReceiptCreateResult,
  GoodsReceiptLineCreateResult,
} from '../types/quick-setup-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
}

interface StockListResponseItem {
  id: number;
  erpStockCode?: string;
  stockName?: string;
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

function extractPagedItems<T>(raw: PagedResultRaw<T>): T[] {
  return raw.items ?? raw.Items ?? raw.data ?? raw.Data ?? [];
}

function buildPagedQuery(
  pageNumber: number,
  pageSize: number,
  filters?: Array<{ column: string; operator: string; value: string }>
): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    sortBy: 'Id',
    sortDirection: 'asc',
  });

  if (filters && filters.length > 0) {
    query.append('filters', JSON.stringify(filters));
    query.append('filterLogic', 'and');
  }

  return query.toString();
}

function extractStockList(raw: PagedResultRaw<StockListResponseItem>): StockDto[] {
  return extractPagedItems(raw).map((item) => ({
    id: item.id,
    code: item.erpStockCode,
    name: item.stockName,
  }));
}

export const aquaQuickApi = {
  getProjects: async (): Promise<ProjectDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectDto>>>(`/api/aqua/Project?${query}`);
    const raw = ensureSuccess(response, 'Projeler yüklenemedi');
    return extractPagedItems(raw);
  },

  createProject: async (payload: CreateProjectPayload): Promise<ProjectDto> => {
    const response = await api.post<ApiResponse<ProjectDto>>('/api/aqua/Project', payload);
    return ensureSuccess(response, 'Proje oluşturulamadı');
  },

  getStocks: async (): Promise<StockDto[]> => {
    const query = new URLSearchParams({
      page: '1',
      pageSize: '500',
      sortBy: 'Id',
      sortDirection: 'asc',
      filters: '[]',
      filterLogic: 'and',
    });
    const response = await api.get<ApiResponse<PagedResultRaw<StockListResponseItem>>>(`/api/Stock?${query.toString()}`);
    const raw = ensureSuccess(response, 'Stoklar yüklenemedi');
    return extractStockList(raw);
  },

  getProjectCages: async (projectId: number): Promise<ProjectCageDto[]> => {
    const query = buildPagedQuery(1, 500, [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectCageDto>>>(`/api/aqua/ProjectCage?${query}`);
    const raw = ensureSuccess(response, 'Proje kafesleri yüklenemedi');
    return extractPagedItems(raw);
  },

  createGoodsReceipt: async (
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptCreateResult> => {
    const response = await api.post<ApiResponse<GoodsReceiptCreateResult>>(
      '/api/aqua/GoodsReceipt',
      payload
    );
    return ensureSuccess(response, 'Mal kabul oluşturulamadı');
  },

  createGoodsReceiptLine: async (
    payload: CreateGoodsReceiptLinePayload
  ): Promise<GoodsReceiptLineCreateResult> => {
    const response = await api.post<ApiResponse<GoodsReceiptLineCreateResult>>(
      '/api/aqua/GoodsReceiptLine',
      payload
    );
    return ensureSuccess(response, 'Mal kabul satırı oluşturulamadı');
  },

  createGoodsReceiptFishDistribution: async (
    payload: CreateGoodsReceiptFishDistributionPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/GoodsReceiptFishDistribution',
      payload
    );
    return ensureSuccess(response, 'Dağıtım oluşturulamadı');
  },

  postGoodsReceipt: async (id: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/goods-receipt/${id}`
    );
    return ensureSuccess(response, 'Post işlemi başarısız');
  },
};
