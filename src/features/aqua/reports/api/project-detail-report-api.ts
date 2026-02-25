import { api } from '@/lib/axios';
import { calculateBiomassGram, calculateIncrementedAverageGram, roundGram } from '@/features/aqua/shared/batch-math';
import type { ApiResponse } from '@/types/api';
import type {
  BatchCageBalanceDto,
  BatchMovementDto,
  CageDailyRow,
  CageProjectReport,
  DailyWeatherDto,
  FeedingDistributionDto,
  FeedingDto,
  FeedingLineDto,
  NetOperationDto,
  NetOperationLineDto,
  StockConvertDto,
  StockConvertLineDto,
  ShipmentDto,
  ShipmentLineDto,
  TransferDto,
  TransferLineDto,
  WeighingDto,
  WeighingLineDto,
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

interface StockListItem {
  id: number;
  stockCode?: string;
  erpStockCode?: string;
  stockName?: string;
}

const PAGE_SIZE = 500;
const MAX_PAGE_GUARD = 100;
const POSTED_STATUS = 1;

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

async function getAllPagedItemsByPath<T>(path: string, filters?: FilterDescriptor[]): Promise<T[]> {
  const result: T[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const query = buildPagedQuery(pageNumber, filters);
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`${path}?${query}`);
    const raw = ensureSuccess(response, `${path} listesi alınamadı`);
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

function isActiveProjectCage(releasedDate?: string | null): boolean {
  if (!releasedDate) return true;
  const parsed = new Date(releasedDate);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getUTCFullYear() <= 1901;
}

function appendDetail(
  target: Map<number, Map<string, string[]>>,
  cageId: number,
  date: string,
  detail: string
): void {
  const byDate = target.get(cageId) ?? new Map<string, string[]>();
  const list = byDate.get(date) ?? [];
  list.push(detail);
  byDate.set(date, list);
  target.set(cageId, byDate);
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

function formatStockTransition(
  fromStockId: number | undefined,
  toStockId: number | undefined,
  stockLabelById: Map<number, string>
): string | null {
  if (fromStockId == null && toStockId == null) return null;
  const fromText =
    fromStockId != null ? stockLabelById.get(fromStockId) ?? String(fromStockId) : '?';
  const toText = toStockId != null ? stockLabelById.get(toStockId) ?? String(toStockId) : '?';
  return `stock:${fromText} -> ${toText}`;
}

function computeReport(
  project: ProjectDto,
  projectCages: ProjectCageDto[],
  feedings: FeedingDto[],
  feedingLines: FeedingLineDto[],
  feedingDistributions: FeedingDistributionDto[],
  mortalities: MortalityDto[],
  mortalityLines: MortalityLineDto[],
  batchCageBalances: BatchCageBalanceDto[],
  dailyWeathers: DailyWeatherDto[],
  netOperations: NetOperationDto[],
  netOperationLines: NetOperationLineDto[],
  transfers: TransferDto[],
  transferLines: TransferLineDto[],
  shipments: ShipmentDto[],
  shipmentLines: ShipmentLineDto[],
  weighings: WeighingDto[],
  weighingLines: WeighingLineDto[],
  stockConverts: StockConvertDto[],
  stockConvertLines: StockConvertLineDto[],
  batchMovements: BatchMovementDto[],
  stocks: StockListItem[]
): ProjectDetailReport {
  const activeProjectCages = projectCages.filter((x) => isActiveProjectCage(x.releasedDate));
  const inactiveProjectCages = projectCages.filter((x) => !isActiveProjectCage(x.releasedDate));
  const projectHasEnded = Boolean(project.endDate);
  // Closed projects should still show full historical cage activity.
  const reportProjectCages =
    activeProjectCages.length > 0 && !projectHasEnded ? activeProjectCages : projectCages;
  const reportCageIdSet = new Set(reportProjectCages.map((x) => x.id));
  const cageIds = reportCageIdSet;
  const postedFeedingIds = new Set<number>(
    feedings.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const feedingIdToDate = new Map<number, string>(
    feedings
      .filter((x) => postedFeedingIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.feedingDate)])
  );
  const feedingLineIdToFeedingId = new Map<number, number>(
    feedingLines.map((x) => [x.id, x.feedingId])
  );
  const feedingLineById = new Map<number, FeedingLineDto>(feedingLines.map((x) => [x.id, x]));
  const feedingById = new Map<number, FeedingDto>(feedings.map((x) => [x.id, x]));
  const postedMortalityIds = new Set<number>(
    mortalities.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const mortalityIdToDate = new Map<number, string>(
    mortalities
      .filter((x) => postedMortalityIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.mortalityDate)])
  );
  const postedNetOperationIds = new Set<number>(
    netOperations.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const netOperationIdToDate = new Map<number, string>(
    netOperations
      .filter((x) => postedNetOperationIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.operationDate)])
  );
  const postedTransferIds = new Set<number>(
    transfers.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const transferIdToDate = new Map<number, string>(
    transfers
      .filter((x) => postedTransferIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.transferDate)])
  );
  const postedWeighingIds = new Set<number>(
    weighings.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const weighingIdToDate = new Map<number, string>(
    weighings
      .filter((x) => postedWeighingIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.weighingDate)])
  );
  const postedStockConvertIds = new Set<number>(
    stockConverts.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const stockConvertIdToDate = new Map<number, string>(
    stockConverts
      .filter((x) => postedStockConvertIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.convertDate)])
  );
  const netOperationById = new Map<number, NetOperationDto>(
    netOperations.filter((x) => postedNetOperationIds.has(x.id)).map((x) => [x.id, x])
  );
  const transferById = new Map<number, TransferDto>(
    transfers.filter((x) => postedTransferIds.has(x.id)).map((x) => [x.id, x])
  );
  const postedShipmentIds = new Set<number>(
    shipments.filter((x) => (x.status ?? POSTED_STATUS) === POSTED_STATUS).map((x) => x.id)
  );
  const shipmentIdToDate = new Map<number, string>(
    shipments
      .filter((x) => postedShipmentIds.has(x.id))
      .map((x) => [x.id, toDateOnly(x.shipmentDate)])
  );
  const shipmentById = new Map<number, ShipmentDto>(
    shipments.filter((x) => postedShipmentIds.has(x.id)).map((x) => [x.id, x])
  );
  const weighingById = new Map<number, WeighingDto>(
    weighings.filter((x) => postedWeighingIds.has(x.id)).map((x) => [x.id, x])
  );
  const stockConvertById = new Map<number, StockConvertDto>(
    stockConverts.filter((x) => postedStockConvertIds.has(x.id)).map((x) => [x.id, x])
  );
  const stockLabelById = new Map<number, string>(stocks.map((x) => {
    const code = x.erpStockCode ?? x.stockCode;
    const name = x.stockName;
    const label = [code, name].filter((part): part is string => Boolean(part && part.trim().length > 0)).join(' - ');
    return [x.id, label || String(x.id)] as const;
  }));
  const stockConvertMovementsByRefId = new Map<number, BatchMovementDto[]>();
  for (const movement of batchMovements) {
    if (movement.movementType !== 3) continue;
    if (movement.referenceId == null) continue;
    const list = stockConvertMovementsByRefId.get(movement.referenceId) ?? [];
    list.push(movement);
    stockConvertMovementsByRefId.set(movement.referenceId, list);
  }
  const cageLabelById = new Map<number, string>(
    projectCages.map((x) => [x.id, x.cageCode ?? x.cageName ?? String(x.id)])
  );

  const initialByCage = new Map<number, number>();
  const initialBiomassByCage = new Map<number, number>();
  const mortalityByCage = new Map<number, number>();
  for (const row of batchMovements) {
    const cageId = row.projectCageId;
    if (!cageId || !cageIds.has(cageId)) continue;

    if (row.movementType === 5) {
      const count = Number(row.signedCount ?? 0);
      const biomass = Number(row.signedBiomassGram ?? 0);
      if (count > 0) {
        initialByCage.set(cageId, (initialByCage.get(cageId) ?? 0) + count);
      }
      if (biomass > 0) {
        initialBiomassByCage.set(cageId, (initialBiomassByCage.get(cageId) ?? 0) + biomass);
      }
    }

    if (row.movementType === 1) {
      const dead = Math.max(0, -Number(row.signedCount ?? 0));
      if (dead > 0) {
        mortalityByCage.set(cageId, (mortalityByCage.get(cageId) ?? 0) + dead);
      }
    }
  }

  const latestBalanceByBatchAndCage = new Map<string, BatchCageBalanceDto>();
  for (const row of batchCageBalances) {
    if (!cageIds.has(row.projectCageId)) continue;

    const balanceKey = `${row.projectCageId}:${row.fishBatchId}`;
    const prev = latestBalanceByBatchAndCage.get(balanceKey);
    if (!prev) {
      latestBalanceByBatchAndCage.set(balanceKey, row);
      continue;
    }

    const prevDate = new Date(prev.asOfDate).getTime();
    const nextDate = new Date(row.asOfDate).getTime();
    if (nextDate > prevDate || (nextDate === prevDate && row.id > prev.id)) {
      latestBalanceByBatchAndCage.set(balanceKey, row);
    }
  }

  const currentCountByCage = new Map<number, number>();
  const currentBiomassByCage = new Map<number, number>();
  for (const row of latestBalanceByBatchAndCage.values()) {
    currentCountByCage.set(
      row.projectCageId,
      (currentCountByCage.get(row.projectCageId) ?? 0) + Number(row.liveCount ?? 0)
    );
    currentBiomassByCage.set(
      row.projectCageId,
      (currentBiomassByCage.get(row.projectCageId) ?? 0) + Number(row.biomassGram ?? 0)
    );
  }

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
  const feedDetailsByCageDate = new Map<number, Map<string, string[]>>();
  const feedStocksByCageDate = new Map<number, Map<string, Set<number>>>();
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

    const feedingLine = feedingLineById.get(row.feedingLineId);
    const feedingHeader = feedingById.get(feedingId);
    const stockId = feedingLine?.stockId;
    const stockText = stockId != null ? stockLabelById.get(stockId) ?? String(stockId) : '?';
    const detailParts = [
      feedingHeader?.feedingNo ?? `#${feedingId}`,
      feedingHeader?.feedingSlot != null ? `slot:${feedingHeader.feedingSlot}` : null,
      `stock:${stockText}`,
      `feed:${feed}g`,
      feedingHeader?.note,
    ].filter((x): x is string => x != null && x.length > 0);
    appendDetail(feedDetailsByCageDate, row.projectCageId, date, detailParts.join(' | '));

    const stocksByDate = feedStocksByCageDate.get(row.projectCageId) ?? new Map<string, Set<number>>();
    const stockSet = stocksByDate.get(date) ?? new Set<number>();
    if (stockId != null) {
      stockSet.add(stockId);
    }
    stocksByDate.set(date, stockSet);
    feedStocksByCageDate.set(row.projectCageId, stocksByDate);
  }

  const weatherByDate = new Map<string, string>();
  for (const row of dailyWeathers) {
    const date = toDateOnly(row.weatherDate);
    const parts = [
      row.weatherSeverityName,
      row.weatherTypeName,
      row.temperatureC != null ? `${row.temperatureC}C` : null,
      row.windKnot != null ? `${row.windKnot}kt` : null,
    ].filter((x): x is string => x != null && x.length > 0);
    if (parts.length > 0) {
      weatherByDate.set(date, parts.join(' | '));
    }
  }

  const netOpsByCageDate = new Map<number, Map<string, number>>();
  const netOpDetailsByCageDate = new Map<number, Map<string, string[]>>();
  for (const row of netOperationLines) {
    if (!cageIds.has(row.projectCageId)) continue;
    if (!postedNetOperationIds.has(row.netOperationId)) continue;
    const date = netOperationIdToDate.get(row.netOperationId);
    if (!date) continue;
    const byDate = netOpsByCageDate.get(row.projectCageId) ?? new Map<string, number>();
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
    netOpsByCageDate.set(row.projectCageId, byDate);

    const header = netOperationById.get(row.netOperationId);
    const detailParts = [
      header?.operationNo ?? `#${row.netOperationId}`,
      header?.operationTypeName,
      row.note ?? header?.note,
    ].filter((x): x is string => x != null && x.length > 0);
    appendDetail(netOpDetailsByCageDate, row.projectCageId, date, detailParts.join(' | '));
  }

  const transferByCageDate = new Map<number, Map<string, number>>();
  const transferDetailsByCageDate = new Map<number, Map<string, string[]>>();
  for (const row of transferLines) {
    if (!postedTransferIds.has(row.transferId)) continue;
    const date = transferIdToDate.get(row.transferId);
    if (!date) continue;
    const transferHeader = transferById.get(row.transferId);
    const fromLabel = cageLabelById.get(row.fromProjectCageId) ?? String(row.fromProjectCageId);
    const toLabel = cageLabelById.get(row.toProjectCageId) ?? String(row.toProjectCageId);
    const detailParts = [
      transferHeader?.transferNo ?? `#${row.transferId}`,
      `${fromLabel} -> ${toLabel}`,
      row.fishCount != null ? `count:${row.fishCount}` : null,
      row.averageGram != null ? `avg:${row.averageGram}g` : null,
      row.biomassGram != null ? `biomass:${row.biomassGram}g` : null,
      transferHeader?.note,
    ].filter((x): x is string => x != null && x.length > 0);
    const detail = detailParts.join(' | ');

    if (cageIds.has(row.fromProjectCageId)) {
      const byDate = transferByCageDate.get(row.fromProjectCageId) ?? new Map<string, number>();
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
      transferByCageDate.set(row.fromProjectCageId, byDate);
      appendDetail(transferDetailsByCageDate, row.fromProjectCageId, date, detail);
    }
    if (cageIds.has(row.toProjectCageId)) {
      const byDate = transferByCageDate.get(row.toProjectCageId) ?? new Map<string, number>();
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
      transferByCageDate.set(row.toProjectCageId, byDate);
      if (row.toProjectCageId !== row.fromProjectCageId) {
        appendDetail(transferDetailsByCageDate, row.toProjectCageId, date, detail);
      }
    }
  }

  const weighingByCageDate = new Map<number, Map<string, number>>();
  const weighingDetailsByCageDate = new Map<number, Map<string, string[]>>();
  for (const row of weighingLines) {
    if (!cageIds.has(row.projectCageId)) continue;
    if (!postedWeighingIds.has(row.weighingId)) continue;
    const date = weighingIdToDate.get(row.weighingId);
    if (!date) continue;
    const byDate = weighingByCageDate.get(row.projectCageId) ?? new Map<string, number>();
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
    weighingByCageDate.set(row.projectCageId, byDate);

    const header = weighingById.get(row.weighingId);
    const detailParts = [
      header?.weighingNo ?? `#${row.weighingId}`,
      row.measuredCount != null ? `count:${row.measuredCount}` : null,
      row.measuredAverageGram != null ? `avg:${row.measuredAverageGram}g` : null,
      row.measuredBiomassGram != null ? `biomass:${row.measuredBiomassGram}g` : null,
      header?.note,
    ].filter((x): x is string => x != null && x.length > 0);
    appendDetail(weighingDetailsByCageDate, row.projectCageId, date, detailParts.join(' | '));
  }

  const shipmentByCageDate = new Map<number, Map<string, number>>();
  const shipmentDetailsByCageDate = new Map<number, Map<string, string[]>>();
  const shipmentFishByCageDate = new Map<number, Map<string, number>>();
  const shipmentBiomassByCageDate = new Map<number, Map<string, number>>();
  for (const row of shipmentLines) {
    if (!postedShipmentIds.has(row.shipmentId)) continue;
    if (!cageIds.has(row.fromProjectCageId)) continue;
    const date = shipmentIdToDate.get(row.shipmentId);
    if (!date) continue;

    const header = shipmentById.get(row.shipmentId);
    const fromLabel = cageLabelById.get(row.fromProjectCageId) ?? String(row.fromProjectCageId);
    const fishCount = Number(row.fishCount ?? 0);
    const biomass = Number(row.biomassGram ?? 0);
    const detailParts = [
      header?.shipmentNo ?? `#${row.shipmentId}`,
      `${fromLabel} -> ${header?.targetWarehouse ?? 'ColdStorage'}`,
      fishCount > 0 ? `count:${fishCount}` : null,
      row.averageGram != null ? `avg:${row.averageGram}g` : null,
      biomass > 0 ? `biomass:${biomass}g` : null,
      header?.note,
    ].filter((x): x is string => x != null && x.length > 0);

    const byDate = shipmentByCageDate.get(row.fromProjectCageId) ?? new Map<string, number>();
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
    shipmentByCageDate.set(row.fromProjectCageId, byDate);

    const fishByDate = shipmentFishByCageDate.get(row.fromProjectCageId) ?? new Map<string, number>();
    fishByDate.set(date, (fishByDate.get(date) ?? 0) + fishCount);
    shipmentFishByCageDate.set(row.fromProjectCageId, fishByDate);

    const biomassByDate = shipmentBiomassByCageDate.get(row.fromProjectCageId) ?? new Map<string, number>();
    biomassByDate.set(date, (biomassByDate.get(date) ?? 0) + biomass);
    shipmentBiomassByCageDate.set(row.fromProjectCageId, biomassByDate);

    appendDetail(shipmentDetailsByCageDate, row.fromProjectCageId, date, detailParts.join(' | '));
  }

  const convertByCageDate = new Map<number, Map<string, number>>();
  const convertDetailsByCageDate = new Map<number, Map<string, string[]>>();
  for (const row of stockConvertLines) {
    if (!postedStockConvertIds.has(row.stockConvertId)) continue;
    const date = stockConvertIdToDate.get(row.stockConvertId);
    if (!date) continue;
    const convertHeader = stockConvertById.get(row.stockConvertId);
    const fromLabel = cageLabelById.get(row.fromProjectCageId) ?? String(row.fromProjectCageId);
    const toLabel = cageLabelById.get(row.toProjectCageId) ?? String(row.toProjectCageId);
    const movementCandidates = stockConvertMovementsByRefId.get(row.stockConvertId) ?? [];
    const matchedMovement =
      movementCandidates.find(
        (x) =>
          x.fromProjectCageId === row.fromProjectCageId &&
          x.toProjectCageId === row.toProjectCageId &&
          Number(x.signedCount ?? 0) < 0
      ) ??
      movementCandidates.find(
        (x) =>
          x.fromProjectCageId === row.fromProjectCageId &&
          x.toProjectCageId === row.toProjectCageId
      ) ??
      movementCandidates[0];
    const fromAverageGram = Number(row.averageGram ?? matchedMovement?.fromAverageGram ?? 0);
    const gramIncrease = Number(row.newAverageGram ?? 0);
    const toAverageGram =
      row.newAverageGram != null
        ? calculateIncrementedAverageGram(fromAverageGram, gramIncrease)
        : Number(matchedMovement?.toAverageGram ?? fromAverageGram);
    const fromBiomass = Number(row.biomassGram ?? (row.fishCount != null ? row.fishCount * fromAverageGram : 0));
    const toBiomass = row.fishCount != null ? calculateBiomassGram(row.fishCount, toAverageGram) : 0;
    const biomassIncrease = roundGram(toBiomass - fromBiomass);

    const detailParts = [
      convertHeader?.convertNo ?? `#${row.stockConvertId}`,
      `${fromLabel} -> ${toLabel}`,
      formatStockTransition(matchedMovement?.fromStockId, matchedMovement?.toStockId, stockLabelById),
      row.fishCount != null ? `count:${row.fishCount}` : null,
      row.averageGram != null || row.newAverageGram != null ? `avg:${fromAverageGram}g + ${gramIncrease}g = ${toAverageGram}g` : null,
      row.biomassGram != null ? `biomass:${fromBiomass}g -> ${toBiomass}g` : null,
      row.biomassGram != null ? `increase:${biomassIncrease}g` : null,
      convertHeader?.note,
    ].filter((x): x is string => x != null && x.length > 0);
    const detail = detailParts.join(' | ');

    if (cageIds.has(row.fromProjectCageId)) {
      const byDate = convertByCageDate.get(row.fromProjectCageId) ?? new Map<string, number>();
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
      convertByCageDate.set(row.fromProjectCageId, byDate);
      appendDetail(convertDetailsByCageDate, row.fromProjectCageId, date, detail);
    }
    if (cageIds.has(row.toProjectCageId)) {
      const byDate = convertByCageDate.get(row.toProjectCageId) ?? new Map<string, number>();
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
      convertByCageDate.set(row.toProjectCageId, byDate);
      if (row.toProjectCageId !== row.fromProjectCageId) {
        appendDetail(convertDetailsByCageDate, row.toProjectCageId, date, detail);
      }
    }
  }

  const movementCountDeltaByCageDate = new Map<number, Map<string, number>>();
  const movementBiomassDeltaByCageDate = new Map<number, Map<string, number>>();
  for (const row of batchMovements) {
    const cageId = row.projectCageId;
    if (!cageId || !cageIds.has(cageId)) continue;
    const date = toDateOnly(row.movementDate);

    const countByDate = movementCountDeltaByCageDate.get(cageId) ?? new Map<string, number>();
    countByDate.set(date, (countByDate.get(date) ?? 0) + Number(row.signedCount ?? 0));
    movementCountDeltaByCageDate.set(cageId, countByDate);

    const biomassByDate = movementBiomassDeltaByCageDate.get(cageId) ?? new Map<string, number>();
    biomassByDate.set(date, (biomassByDate.get(date) ?? 0) + Number(row.signedBiomassGram ?? 0));
    movementBiomassDeltaByCageDate.set(cageId, biomassByDate);
  }

  const startDateRaw = toDateOnly(project.startDate);
  const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
  const today = new Date();
  const allDates = enumerateDates(startDate, today);

  const cages: CageProjectReport[] = reportProjectCages.map((projectCage) => {
    const cageId = projectCage.id;
    const feedByDate = dailyFeedByCage.get(cageId) ?? new Map<string, number>();
    const feedDetailsByDate = feedDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();
    const feedStocksByDate = feedStocksByCageDate.get(cageId) ?? new Map<string, Set<number>>();
    const deadByDate = dailyDeadByCage.get(cageId) ?? new Map<string, number>();
    const countDeltaByDate = movementCountDeltaByCageDate.get(cageId) ?? new Map<string, number>();
    const biomassDeltaByDate = movementBiomassDeltaByCageDate.get(cageId) ?? new Map<string, number>();
    const netOpByDate = netOpsByCageDate.get(cageId) ?? new Map<string, number>();
    const netOpDetailsByDate = netOpDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();
    const transferByDate = transferByCageDate.get(cageId) ?? new Map<string, number>();
    const transferDetailsByDate = transferDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();
    const shipmentByDate = shipmentByCageDate.get(cageId) ?? new Map<string, number>();
    const shipmentDetailsByDate = shipmentDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();
    const shipmentFishByDate = shipmentFishByCageDate.get(cageId) ?? new Map<string, number>();
    const shipmentBiomassByDate = shipmentBiomassByCageDate.get(cageId) ?? new Map<string, number>();
    const weighingByDate = weighingByCageDate.get(cageId) ?? new Map<string, number>();
    const weighingDetailsByDate = weighingDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();
    const convertByDate = convertByCageDate.get(cageId) ?? new Map<string, number>();
    const convertDetailsByDate = convertDetailsByCageDate.get(cageId) ?? new Map<string, string[]>();

    const dailyRowsMap = new Map<string, CageDailyRow>();
    const activityDates = new Set<string>([
      ...feedByDate.keys(),
      ...deadByDate.keys(),
      ...countDeltaByDate.keys(),
      ...biomassDeltaByDate.keys(),
      ...netOpByDate.keys(),
      ...transferByDate.keys(),
      ...shipmentByDate.keys(),
      ...weighingByDate.keys(),
      ...convertByDate.keys(),
      ...weatherByDate.keys(),
    ]);

    for (const date of activityDates) {
      dailyRowsMap.set(date, {
        date,
        feedGram: feedByDate.get(date) ?? 0,
        feedStockCount: feedStocksByDate.get(date)?.size ?? 0,
        feedDetails: feedDetailsByDate.get(date) ?? [],
        deadCount: deadByDate.get(date) ?? 0,
        countDelta: countDeltaByDate.get(date) ?? 0,
        biomassDelta: biomassDeltaByDate.get(date) ?? 0,
        weather: weatherByDate.get(date) ?? '-',
        netOperationCount: netOpByDate.get(date) ?? 0,
        netOperationDetails: netOpDetailsByDate.get(date) ?? [],
        transferCount: transferByDate.get(date) ?? 0,
        transferDetails: transferDetailsByDate.get(date) ?? [],
        shipmentCount: shipmentByDate.get(date) ?? 0,
        shipmentDetails: shipmentDetailsByDate.get(date) ?? [],
        shipmentFishCount: shipmentFishByDate.get(date) ?? 0,
        shipmentBiomassGram: shipmentBiomassByDate.get(date) ?? 0,
        weighingCount: weighingByDate.get(date) ?? 0,
        weighingDetails: weighingDetailsByDate.get(date) ?? [],
        stockConvertCount: convertByDate.get(date) ?? 0,
        stockConvertDetails: convertDetailsByDate.get(date) ?? [],
        fed: (feedByDate.get(date) ?? 0) > 0,
      });
    }

    const dailyRows = Array.from(dailyRowsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const missingFeedingDays = allDates.filter((date) => (feedByDate.get(date) ?? 0) <= 0);

    const initialFish = initialByCage.get(cageId) ?? 0;
    const initialBiomass = initialBiomassByCage.get(cageId) ?? 0;
    const initialAvgGram = initialFish > 0 ? initialBiomass / initialFish : 0;
    const totalCountDelta = Array.from(countDeltaByDate.values()).reduce((acc, val) => acc + val, 0);
    const totalBiomassDelta = Array.from(biomassDeltaByDate.values()).reduce((acc, val) => acc + val, 0);

    const totalDead = mortalityByCage.get(cageId) ?? 0;
    const currentFishFromBalance = currentCountByCage.get(cageId);
    const currentBiomassFromBalance = currentBiomassByCage.get(cageId);

    const fallbackCurrentFish = Math.max(0, initialFish - totalDead);
    const fallbackCurrentBiomass = Math.max(0, initialBiomass - totalDead * initialAvgGram);
    const currentFishFromMovement = Math.max(0, totalCountDelta);
    const currentBiomassFromMovement = Math.max(0, totalBiomassDelta);
    const hasMovementSnapshot = countDeltaByDate.size > 0 || biomassDeltaByDate.size > 0;

    const currentFish = hasMovementSnapshot
      ? currentFishFromMovement
      : (currentFishFromBalance ?? fallbackCurrentFish);
    const currentBiomass = hasMovementSnapshot
      ? currentBiomassFromMovement
      : (currentBiomassFromBalance ?? fallbackCurrentBiomass);
    const currentAvgGram = currentFish > 0 ? currentBiomass / currentFish : 0;

    return {
      projectCageId: cageId,
      cageLabel: projectCage.cageCode ?? projectCage.cageName ?? String(cageId),
      initialFishCount: initialFish,
      initialAverageGram: Number(initialAvgGram.toFixed(3)),
      initialBiomassGram: Number(initialBiomass.toFixed(3)),
      currentFishCount: Math.max(0, currentFish),
      currentAverageGram: Number(currentAvgGram.toFixed(3)),
      currentBiomassGram: Number(Math.max(0, currentBiomass).toFixed(3)),
      totalDeadCount: totalDead,
      totalFeedGram: Array.from(feedByDate.values()).reduce((acc, val) => acc + val, 0),
      totalCountDelta,
      totalBiomassDelta: Number(totalBiomassDelta.toFixed(3)),
      missingFeedingDays,
      dailyRows,
    };
  });

  const cageHistory = inactiveProjectCages
    .filter((x) => !reportCageIdSet.has(x.id))
    .map((x) => ({
      projectCageId: x.id,
      cageLabel: x.cageCode ?? x.cageName ?? String(x.id),
      assignedDate: x.assignedDate ?? null,
      releasedDate: x.releasedDate ?? null,
    }))
    .sort((a, b) => String(b.releasedDate ?? '').localeCompare(String(a.releasedDate ?? '')));

  return { project, cages, cageHistory };
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

    const [projectCages, feedings, feedingLines, feedingDistributions, mortalities, mortalityLines, batchCageBalances, dailyWeathers, netOperations, netOperationLines, transfers, transferLines, shipments, shipmentLines, weighings, weighingLines, stockConverts, stockConvertLines, batchMovements, stocks] =
      await Promise.all([
        getAllPagedItems<ProjectCageDto>('ProjectCage', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<FeedingDto>('Feeding', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<FeedingLineDto>('FeedingLine'),
        getAllPagedItems<FeedingDistributionDto>('FeedingDistribution'),
        getAllPagedItems<MortalityDto>('Mortality', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<MortalityLineDto>('MortalityLine'),
        getAllPagedItems<BatchCageBalanceDto>('BatchCageBalance'),
        getAllPagedItems<DailyWeatherDto>('DailyWeather', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<NetOperationDto>('NetOperation', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<NetOperationLineDto>('NetOperationLine'),
        getAllPagedItems<TransferDto>('Transfer', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<TransferLineDto>('TransferLine'),
        getAllPagedItems<ShipmentDto>('Shipment', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<ShipmentLineDto>('ShipmentLine'),
        getAllPagedItems<WeighingDto>('Weighing', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<WeighingLineDto>('WeighingLine'),
        getAllPagedItems<StockConvertDto>('StockConvert', [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]),
        getAllPagedItems<StockConvertLineDto>('StockConvertLine'),
        getAllPagedItems<BatchMovementDto>('BatchMovement'),
        getAllPagedItemsByPath<StockListItem>('/api/Stock'),
      ]);

    return computeReport(
      project,
      projectCages,
      feedings,
      feedingLines,
      feedingDistributions,
      mortalities,
      mortalityLines,
      batchCageBalances,
      dailyWeathers,
      netOperations,
      netOperationLines,
      transfers,
      transferLines,
      shipments,
      shipmentLines,
      weighings,
      weighingLines,
      stockConverts,
      stockConvertLines,
      batchMovements,
      stocks
    );
  },
};
