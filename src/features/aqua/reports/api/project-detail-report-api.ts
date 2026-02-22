import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type {
  BatchCageBalanceDto,
  CageDailyRow,
  CageProjectReport,
  FeedingDistributionDto,
  FeedingDto,
  FeedingLineDto,
  GoodsReceiptFishDistributionDto,
  MortalityDto,
  MortalityLineDto,
  ProjectCageDto,
  ProjectDetailReport,
  ProjectDto,
} from '../types/project-detail-report-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
  totalCount?: number;
  TotalCount?: number;
}

interface FilterDescriptor {
  column: string;
  operator: string;
  value: string;
}

const PAGE_SIZE = 500;
const MAX_PAGE_GUARD = 100;

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

function extractTotalCount<T>(raw: PagedResultRaw<T>, fallbackCount: number): number {
  return raw.totalCount ?? raw.TotalCount ?? fallbackCount;
}

function buildPagedQuery(pageNumber: number, filters?: FilterDescriptor[]): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(PAGE_SIZE),
    sortBy: 'Id',
    sortDirection: 'asc',
  });

  if (filters && filters.length > 0) {
    query.append('filters', JSON.stringify(filters));
    query.append('filterLogic', 'and');
  }

  return query.toString();
}

async function getAllPagedItems<T>(endpoint: string, filters?: FilterDescriptor[]): Promise<T[]> {
  const result: T[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const query = buildPagedQuery(pageNumber, filters);
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`/api/aqua/${endpoint}?${query}`);
    const raw = ensureSuccess(response, `${endpoint} listesi alınamadı`);
    const pageItems = extractPagedItems(raw);
    const totalCount = extractTotalCount(raw, result.length + pageItems.length);

    result.push(...pageItems);

    if (pageItems.length === 0 || result.length >= totalCount || pageItems.length < PAGE_SIZE) {
      break;
    }
    pageNumber += 1;
  }

  return result;
}

function toDateOnly(input?: string): string {
  if (!input) return '';
  return input.length >= 10 ? input.slice(0, 10) : input;
}

function enumerateDates(startDate: Date, endDate: Date): string[] {
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const result: string[] = [];

  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function aggregateByDate(rows: Map<string, CageDailyRow>, date: string, feedGram: number, deadCount: number): void {
  const existing = rows.get(date);
  if (existing) {
    existing.feedGram += feedGram;
    existing.deadCount += deadCount;
    existing.fed = existing.feedGram > 0;
    return;
  }

  rows.set(date, {
    date,
    feedGram,
    deadCount,
    fed: feedGram > 0,
  });
}

function computeReport(
  project: ProjectDto,
  projectCages: ProjectCageDto[],
  feedings: FeedingDto[],
  feedingLines: FeedingLineDto[],
  feedingDistributions: FeedingDistributionDto[],
  mortalities: MortalityDto[],
  mortalityLines: MortalityLineDto[],
  goodsReceiptDistributions: GoodsReceiptFishDistributionDto[],
  batchCageBalances: BatchCageBalanceDto[]
): ProjectDetailReport {
  const cageIds = new Set(projectCages.map((x) => x.id));
  const feedingIdToDate = new Map<number, string>(
    feedings.map((x) => [x.id, toDateOnly(x.feedingDate)])
  );
  const feedingLineIdToFeedingId = new Map<number, number>(
    feedingLines.map((x) => [x.id, x.feedingId])
  );
  const mortalityIdToDate = new Map<number, string>(
    mortalities.map((x) => [x.id, toDateOnly(x.mortalityDate)])
  );

  const initialByCage = new Map<number, number>();
  for (const row of goodsReceiptDistributions) {
    if (!cageIds.has(row.projectCageId)) continue;
    initialByCage.set(row.projectCageId, (initialByCage.get(row.projectCageId) ?? 0) + Number(row.fishCount ?? 0));
  }

  const latestBalanceByCage = new Map<number, BatchCageBalanceDto>();
  for (const row of batchCageBalances) {
    if (!cageIds.has(row.projectCageId)) continue;
    const prev = latestBalanceByCage.get(row.projectCageId);
    if (!prev) {
      latestBalanceByCage.set(row.projectCageId, row);
      continue;
    }

    const prevDate = new Date(prev.asOfDate).getTime();
    const nextDate = new Date(row.asOfDate).getTime();
    if (nextDate > prevDate || (nextDate === prevDate && row.id > prev.id)) {
      latestBalanceByCage.set(row.projectCageId, row);
    }
  }

  const mortalityByCage = new Map<number, number>();
  const dailyDeadByCage = new Map<number, Map<string, number>>();
  for (const row of mortalityLines) {
    if (!cageIds.has(row.projectCageId)) continue;
    const date = mortalityIdToDate.get(row.mortalityId);
    if (!date) continue;

    const dead = Number(row.deadCount ?? 0);
    mortalityByCage.set(row.projectCageId, (mortalityByCage.get(row.projectCageId) ?? 0) + dead);

    const byDate = dailyDeadByCage.get(row.projectCageId) ?? new Map<string, number>();
    byDate.set(date, (byDate.get(date) ?? 0) + dead);
    dailyDeadByCage.set(row.projectCageId, byDate);
  }

  const dailyFeedByCage = new Map<number, Map<string, number>>();
  for (const row of feedingDistributions) {
    if (!cageIds.has(row.projectCageId)) continue;
    const feedingId = feedingLineIdToFeedingId.get(row.feedingLineId);
    if (!feedingId) continue;
    const date = feedingIdToDate.get(feedingId);
    if (!date) continue;

    const feed = Number(row.feedGram ?? 0);
    const byDate = dailyFeedByCage.get(row.projectCageId) ?? new Map<string, number>();
    byDate.set(date, (byDate.get(date) ?? 0) + feed);
    dailyFeedByCage.set(row.projectCageId, byDate);
  }

  const startDateRaw = toDateOnly(project.startDate);
  const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
  const today = new Date();
  const allDates = enumerateDates(startDate, today);

  const cages: CageProjectReport[] = projectCages.map((projectCage) => {
    const cageId = projectCage.id;
    const feedByDate = dailyFeedByCage.get(cageId) ?? new Map<string, number>();
    const deadByDate = dailyDeadByCage.get(cageId) ?? new Map<string, number>();

    const dailyRowsMap = new Map<string, CageDailyRow>();
    for (const [date, feedGram] of feedByDate) {
      aggregateByDate(dailyRowsMap, date, feedGram, 0);
    }
    for (const [date, deadCount] of deadByDate) {
      aggregateByDate(dailyRowsMap, date, 0, deadCount);
    }

    const dailyRows = Array.from(dailyRowsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const missingFeedingDays = allDates.filter((date) => (feedByDate.get(date) ?? 0) <= 0);

    const initialFish = initialByCage.get(cageId) ?? 0;
    const totalDead = mortalityByCage.get(cageId) ?? 0;
    const latestBalance = latestBalanceByCage.get(cageId);
    const currentFishFromBalance = latestBalance ? Number(latestBalance.liveCount ?? 0) : null;
    const fallbackCurrent = Math.max(0, initialFish - totalDead);
    const currentFish = currentFishFromBalance != null ? currentFishFromBalance : fallbackCurrent;

    return {
      projectCageId: cageId,
      cageLabel: projectCage.cageCode ?? projectCage.cageName ?? String(cageId),
      initialFishCount: initialFish,
      currentFishCount: Math.max(0, currentFish),
      totalDeadCount: totalDead,
      totalFeedGram: Array.from(feedByDate.values()).reduce((acc, val) => acc + val, 0),
      missingFeedingDays,
      dailyRows,
    };
  });

  return { project, cages };
}

export const projectDetailReportApi = {
  getProjects: async (): Promise<ProjectDto[]> => {
    return getAllPagedItems<ProjectDto>('Project');
  },

  getProjectDetailReport: async (projectId: number): Promise<ProjectDetailReport> => {
    const projects = await getAllPagedItems<ProjectDto>('Project', [
      { column: 'Id', operator: 'eq', value: String(projectId) },
    ]);
    const project = projects[0];
    if (!project) {
      throw new Error('Proje bulunamadı');
    }

    const [projectCages, feedings, feedingLines, feedingDistributions, mortalities, mortalityLines, goodsReceiptDistributions, batchCageBalances] =
      await Promise.all([
        getAllPagedItems<ProjectCageDto>('ProjectCage', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<FeedingDto>('Feeding', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<FeedingLineDto>('FeedingLine'),
        getAllPagedItems<FeedingDistributionDto>('FeedingDistribution'),
        getAllPagedItems<MortalityDto>('Mortality', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<MortalityLineDto>('MortalityLine'),
        getAllPagedItems<GoodsReceiptFishDistributionDto>('GoodsReceiptFishDistribution'),
        getAllPagedItems<BatchCageBalanceDto>('BatchCageBalance'),
      ]);

    return computeReport(
      project,
      projectCages,
      feedings,
      feedingLines,
      feedingDistributions,
      mortalities,
      mortalityLines,
      goodsReceiptDistributions,
      batchCageBalances
    );
  },
};
