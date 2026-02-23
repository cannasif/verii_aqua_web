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
  CreateFishBatchPayload,
  GoodsReceiptCreateResult,
  ExistingGoodsReceiptContext,
  GoodsReceiptLineCreateResult,
  FishBatchCreateResult,
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

interface CageListResponseItem {
  id: number;
  cageCode?: string;
  cageName?: string;
}

interface GoodsReceiptListResponseItem {
  id: number;
  projectId?: number | null;
  status?: number | null;
  receiptNo?: string;
  receiptDate?: string;
}

interface GoodsReceiptLineListResponseItem {
  id: number;
  goodsReceiptId: number;
  itemType: number;
  stockId: number;
  qtyUnit?: number | null;
  gramPerUnit?: number | null;
  totalGram?: number | null;
  fishBatchId?: number | null;
  fishCount?: number | null;
  fishAverageGram?: number | null;
  fishTotalGram?: number | null;
}

interface FishBatchResponseItem {
  id: number;
  batchCode?: string;
}

interface ProjectListResponseItem {
  id: number;
}

function isActiveProjectCage(releasedDate?: string | null): boolean {
  if (!releasedDate) return true;
  const parsed = new Date(releasedDate);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getUTCFullYear() <= 1901;
}

function getNumberField(obj: Record<string, unknown>, camel: string, pascal: string): number {
  const raw = obj[camel] ?? obj[pascal];
  return Number(raw ?? 0);
}

function getStringField(
  obj: Record<string, unknown>,
  camel: string,
  pascal: string
): string | null {
  const raw = obj[camel] ?? obj[pascal];
  if (raw == null) return null;
  return String(raw);
}

function normalizeProjectCage(item: Record<string, unknown>): ProjectCageDto {
  return {
    id: getNumberField(item, 'id', 'Id'),
    projectId: getNumberField(item, 'projectId', 'ProjectId'),
    cageId: getNumberField(item, 'cageId', 'CageId'),
    cageCode: getStringField(item, 'cageCode', 'CageCode') ?? undefined,
    cageName: getStringField(item, 'cageName', 'CageName') ?? undefined,
    releasedDate: getStringField(item, 'releasedDate', 'ReleasedDate'),
  };
}

function normalizeCage(item: Record<string, unknown>): CageListResponseItem {
  return {
    id: getNumberField(item, 'id', 'Id'),
    cageCode: getStringField(item, 'cageCode', 'CageCode') ?? undefined,
    cageName: getStringField(item, 'cageName', 'CageName') ?? undefined,
  };
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
  filters?: Array<{ column: string; operator: string; value: string }>,
  sortDirection: 'asc' | 'desc' = 'asc'
): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    sortBy: 'Id',
    sortDirection,
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

async function getAllAquaItems<T>(endpoint: string, pageSize = 500): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`/api/aqua/${endpoint}?${buildPagedQuery(page, pageSize)}`);
    const raw = ensureSuccess(response, `${endpoint} listesi yüklenemedi`);
    const items = extractPagedItems(raw);
    all.push(...items);

    if (items.length < pageSize) break;
    page += 1;
  }

  return all;
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
    const [allCages, allAssignments, allProjects] = await Promise.all([
      getAllAquaItems<CageListResponseItem>('Cage'),
      getAllAquaItems<ProjectCageDto>('ProjectCage'),
      getAllAquaItems<ProjectListResponseItem>('Project'),
    ]);
    const normalizedCages = (allCages as unknown as Record<string, unknown>[])
      .map(normalizeCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0);
    const normalizedAssignments = (allAssignments as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0);
    const existingProjectIds = new Set(
      (allProjects as unknown as Record<string, unknown>[])
        .map((x) => getNumberField(x, 'id', 'Id'))
        .filter((x) => Number.isFinite(x) && x > 0)
    );
    const cageById = new Map<number, CageListResponseItem>(normalizedCages.map((x) => [x.id, x]));

    const activeAssignments = normalizedAssignments.filter((x) => {
      if (!isActiveProjectCage(x.releasedDate)) return false;
      const assignedProjectId = Number(x.projectId);
      return assignedProjectId === projectId || existingProjectIds.has(assignedProjectId);
    });
    const ownActiveProjectCages = activeAssignments
      .filter((x) => Number(x.projectId) === projectId)
      .map((x) => {
        const cage = cageById.get(Number(x.cageId));
        return {
          ...x,
          cageCode: x.cageCode ?? cage?.cageCode,
          cageName: x.cageName ?? cage?.cageName,
        };
      });
    const globallyAssignedActiveCageIds = new Set(activeAssignments.map((x) => Number(x.cageId)));

    const availableCages = normalizedCages.filter(
      (x) => !globallyAssignedActiveCageIds.has(Number(x.id))
    );
    if (availableCages.length === 0) {
      return ownActiveProjectCages;
    }

    const assignedDate = new Date().toISOString().slice(0, 10);
    const createdProjectCages: ProjectCageDto[] = [];
    for (const cage of availableCages) {
      try {
        const createResponse = await api.post<ApiResponse<ProjectCageDto>>('/api/aqua/ProjectCage', {
          projectId,
          cageId: cage.id,
          assignedDate,
          releasedDate: null,
        });
        const created = ensureSuccess(createResponse, 'Proje kafesi oluşturulamadı');
        createdProjectCages.push({
          ...created,
          cageCode: created.cageCode ?? cage.cageCode,
          cageName: created.cageName ?? cage.cageName,
          releasedDate: created.releasedDate ?? null,
        });
      } catch {
        // Ignore per-cage create failures (already assigned / validation), we'll return current active rows.
      }
    }

    const finalAssignments = await getAllAquaItems<ProjectCageDto>('ProjectCage');
    const finalActive = (finalAssignments as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0)
      .filter((x) => Number(x.projectId) === projectId && isActiveProjectCage(x.releasedDate));
    const normalizedFinalActive = finalActive.map((x) => {
      const cage = cageById.get(Number(x.cageId));
      return {
        ...x,
        cageCode: x.cageCode ?? cage?.cageCode,
        cageName: x.cageName ?? cage?.cageName,
      };
    });
    return normalizedFinalActive.length > 0
      ? normalizedFinalActive
      : [...ownActiveProjectCages, ...createdProjectCages];
  },

  getExistingGoodsReceiptContext: async (projectId: number): Promise<ExistingGoodsReceiptContext | null> => {
    const draftReceiptQuery = buildPagedQuery(1, 200, undefined, 'desc');
    const receiptResponse = await api.get<ApiResponse<PagedResultRaw<GoodsReceiptListResponseItem>>>(
      `/api/aqua/GoodsReceipt?${draftReceiptQuery}`
    );
    const receiptRaw = ensureSuccess(receiptResponse, 'Mal kabul bilgisi yüklenemedi');
    const receipts = extractPagedItems(receiptRaw).filter(
      (x) => Number(x.projectId ?? 0) === projectId && Number(x.status ?? -1) !== 2
    );
    const receipt = receipts.find((x) => Number(x.status ?? -1) === 0) ?? receipts[0];
    if (!receipt) return null;

    const fishLineQuery = buildPagedQuery(1, 1, [
      { column: 'GoodsReceiptId', operator: 'eq', value: String(receipt.id) },
      { column: 'ItemType', operator: 'eq', value: '1' },
    ], 'desc');
    const lineResponse = await api.get<ApiResponse<PagedResultRaw<GoodsReceiptLineListResponseItem>>>(
      `/api/aqua/GoodsReceiptLine?${fishLineQuery}`
    );
    const lineRaw = ensureSuccess(lineResponse, 'Mal kabul satır bilgisi yüklenemedi');
    const line = extractPagedItems(lineRaw)[0];
    const fishCount = Number(line?.fishCount ?? 0);
    const averageFromLine = Number(line?.fishAverageGram ?? 0);
    const averageFromFishTotal = fishCount > 0 ? Number(line?.fishTotalGram ?? 0) / fishCount : 0;
    const averageFromUnit = Number(line?.gramPerUnit ?? 0);
    const resolvedAverageGram = averageFromLine > 0
      ? averageFromLine
      : averageFromFishTotal > 0
        ? averageFromFishTotal
        : averageFromUnit > 0
          ? averageFromUnit
          : null;
    let fishBatchCode: string | null = null;
    if (line?.fishBatchId != null) {
      try {
        const fishBatchResponse = await api.get<ApiResponse<FishBatchResponseItem>>(
          `/api/aqua/FishBatch/${line.fishBatchId}`
        );
        const fishBatch = ensureSuccess(fishBatchResponse, 'Balık batch bilgisi yüklenemedi');
        fishBatchCode = fishBatch.batchCode ?? null;
      } catch {
        fishBatchCode = null;
      }
    }

    return {
      receiptId: receipt.id,
      receiptNo: receipt.receiptNo ?? `#${receipt.id}`,
      receiptDate: receipt.receiptDate?.slice(0, 10) ?? '',
      status: Number(receipt.status ?? 0),
      fishStockId: line?.stockId ?? null,
      fishAverageGram: resolvedAverageGram,
      fishLineId: line?.id ?? null,
      fishBatchId: line?.fishBatchId ?? null,
      fishBatchCode,
      fishCount,
    };
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

  updateGoodsReceipt: async (
    id: number,
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptCreateResult> => {
    const response = await api.put<ApiResponse<GoodsReceiptCreateResult>>(
      `/api/aqua/GoodsReceipt/${id}`,
      {
        ...payload,
        status: 0,
      }
    );
    return ensureSuccess(response, 'Mal kabul güncellenemedi');
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

  getGoodsReceiptLineById: async (id: number): Promise<GoodsReceiptLineListResponseItem> => {
    const response = await api.get<ApiResponse<GoodsReceiptLineListResponseItem>>(
      `/api/aqua/GoodsReceiptLine/${id}`
    );
    return ensureSuccess(response, 'Mal kabul satırı yüklenemedi');
  },

  updateGoodsReceiptLine: async (
    id: number,
    payload: CreateGoodsReceiptLinePayload
  ): Promise<GoodsReceiptLineCreateResult> => {
    const response = await api.put<ApiResponse<GoodsReceiptLineCreateResult>>(
      `/api/aqua/GoodsReceiptLine/${id}`,
      payload
    );
    return ensureSuccess(response, 'Mal kabul satırı güncellenemedi');
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

  createFishBatch: async (
    payload: CreateFishBatchPayload
  ): Promise<FishBatchCreateResult> => {
    const response = await api.post<ApiResponse<FishBatchCreateResult>>(
      '/api/aqua/FishBatch',
      payload
    );
    return ensureSuccess(response, 'Balık batch oluşturulamadı');
  },

  updateFishBatch: async (
    id: number,
    payload: CreateFishBatchPayload
  ): Promise<FishBatchCreateResult> => {
    const response = await api.put<ApiResponse<FishBatchCreateResult>>(
      `/api/aqua/FishBatch/${id}`,
      payload
    );
    return ensureSuccess(response, 'Balık batch güncellenemedi');
  },

  postGoodsReceipt: async (id: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/goods-receipt/${id}`
    );
    return ensureSuccess(response, 'Post işlemi başarısız');
  },
};
