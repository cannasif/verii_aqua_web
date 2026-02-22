import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type {
  ProjectDto,
  ProjectCageDto,
  StockDto,
  FishBatchDto,
  WeatherSeverityDto,
  WeatherTypeDto,
  NetOperationTypeDto,
  FeedingHeaderDto,
  MortalityHeaderDto,
  NetOperationHeaderDto,
  CreateFeedingPayload,
  CreateFeedingLinePayload,
  CreateMortalityPayload,
  CreateMortalityLinePayload,
  CreateDailyWeatherPayload,
  CreateNetOperationPayload,
  CreateNetOperationLinePayload,
} from '../types/quick-daily-entry-types';

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

export const aquaQuickDailyApi = {
  getProjects: async (): Promise<ProjectDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectDto>>>(`/api/aqua/Project?${query}`);
    const raw = ensureSuccess(response, 'Projeler yüklenemedi');
    return extractPagedItems(raw);
  },

  getProjectCages: async (projectId: number): Promise<ProjectCageDto[]> => {
    const query = buildPagedQuery(1, 500, [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectCageDto>>>(`/api/aqua/ProjectCage?${query}`);
    const raw = ensureSuccess(response, 'Proje kafesleri yüklenemedi');
    return extractPagedItems(raw);
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

  getFishBatches: async (projectId: number): Promise<FishBatchDto[]> => {
    const query = buildPagedQuery(1, 500, [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]);
    const response = await api.get<ApiResponse<PagedResultRaw<FishBatchDto>>>(`/api/aqua/FishBatch?${query}`);
    const raw = ensureSuccess(response, 'Batch listesi yüklenemedi');
    return extractPagedItems(raw);
  },

  getWeatherSeverities: async (): Promise<WeatherSeverityDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<WeatherSeverityDto>>>(`/api/aqua/WeatherSeverity?${query}`);
    const raw = ensureSuccess(response, 'Hava şiddetleri yüklenemedi');
    return extractPagedItems(raw);
  },

  getWeatherTypes: async (): Promise<WeatherTypeDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<WeatherTypeDto>>>(`/api/aqua/WeatherType?${query}`);
    const raw = ensureSuccess(response, 'Hava tipleri yüklenemedi');
    return extractPagedItems(raw);
  },

  getNetOperationTypes: async (): Promise<NetOperationTypeDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<NetOperationTypeDto>>>(`/api/aqua/NetOperationType?${query}`);
    const raw = ensureSuccess(response, 'Ağ işlem tipleri yüklenemedi');
    return extractPagedItems(raw);
  },

  findFeedingHeaderByProjectAndDate: async (
    projectId: number,
    feedingDate: string
  ): Promise<FeedingHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'FeedingDate', operator: 'eq', value: feedingDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<FeedingHeaderDto>>>(`/api/aqua/Feeding?${query}`);
    const raw = ensureSuccess(response, 'Besleme başlığı sorgulanamadı');
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  findMortalityHeaderByProjectAndDate: async (
    projectId: number,
    mortalityDate: string
  ): Promise<MortalityHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'MortalityDate', operator: 'eq', value: mortalityDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<MortalityHeaderDto>>>(`/api/aqua/Mortality?${query}`);
    const raw = ensureSuccess(response, 'Ölüm başlığı sorgulanamadı');
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  findNetOperationHeaderByProjectAndDate: async (
    projectId: number,
    operationDate: string
  ): Promise<NetOperationHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'OperationDate', operator: 'eq', value: operationDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<NetOperationHeaderDto>>>(`/api/aqua/NetOperation?${query}`);
    const raw = ensureSuccess(response, 'Ağ işlemi başlığı sorgulanamadı');
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  createFeeding: async (
    payload: CreateFeedingPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/Feeding',
      payload
    );
    return ensureSuccess(response, 'Besleme oluşturulamadı');
  },

  createFeedingLine: async (
    payload: CreateFeedingLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/FeedingLine',
      payload
    );
    return ensureSuccess(response, 'Besleme satırı oluşturulamadı');
  },

  createMortality: async (
    payload: CreateMortalityPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/Mortality',
      payload
    );
    return ensureSuccess(response, 'Ölüm kaydı oluşturulamadı');
  },

  createMortalityLine: async (
    payload: CreateMortalityLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/MortalityLine',
      payload
    );
    return ensureSuccess(response, 'Ölüm satırı oluşturulamadı');
  },

  createDailyWeather: async (
    payload: CreateDailyWeatherPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/DailyWeather',
      payload
    );
    return ensureSuccess(response, 'Hava durumu kaydı oluşturulamadı');
  },

  createNetOperation: async (
    payload: CreateNetOperationPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/NetOperation',
      payload
    );
    return ensureSuccess(response, 'Ağ işlemi oluşturulamadı');
  },

  createNetOperationLine: async (
    payload: CreateNetOperationLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/NetOperationLine',
      payload
    );
    return ensureSuccess(response, 'Ağ işlemi satırı oluşturulamadı');
  },
};
