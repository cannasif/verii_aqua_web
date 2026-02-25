export interface ProjectDto {
  id: number;
  projectCode?: string;
  projectName?: string;
  startDate?: string;
  endDate?: string | null;
  status?: number;
}

export interface ProjectCageDto {
  id: number;
  projectId: number;
  cageCode?: string;
  cageName?: string;
  assignedDate?: string | null;
  releasedDate?: string | null;
}

export interface CageHistoryItem {
  projectCageId: number;
  cageLabel: string;
  assignedDate?: string | null;
  releasedDate?: string | null;
}

export interface FeedingDto {
  id: number;
  projectId: number;
  feedingNo?: string;
  feedingDate: string;
  feedingSlot?: number;
  note?: string;
  status?: number;
}

export interface FeedingLineDto {
  id: number;
  feedingId: number;
  stockId?: number;
}

export interface FeedingDistributionDto {
  id: number;
  feedingLineId: number;
  projectCageId: number;
  feedGram: number;
}

export interface MortalityDto {
  id: number;
  projectId: number;
  mortalityDate: string;
  status?: number;
}

export interface MortalityLineDto {
  id: number;
  mortalityId: number;
  projectCageId: number;
  deadCount: number;
}

export interface GoodsReceiptFishDistributionDto {
  id: number;
  goodsReceiptLineId: number;
  fishBatchId: number;
  projectCageId: number;
  fishCount: number;
}

export interface BatchCageBalanceDto {
  id: number;
  fishBatchId: number;
  projectCageId: number;
  liveCount: number;
  averageGram: number;
  biomassGram: number;
  asOfDate: string;
}

export interface GoodsReceiptLineDto {
  id: number;
  fishAverageGram?: number;
}

export interface FishBatchDto {
  id: number;
  currentAverageGram?: number;
}

export interface DailyWeatherDto {
  id: number;
  projectId: number;
  weatherDate: string;
  weatherTypeName?: string;
  weatherSeverityName?: string;
  temperatureC?: number;
  windKnot?: number;
}

export interface NetOperationDto {
  id: number;
  projectId: number;
  operationNo?: string;
  operationTypeName?: string;
  note?: string;
  operationDate: string;
  status?: number;
}

export interface NetOperationLineDto {
  id: number;
  netOperationId: number;
  projectCageId: number;
  fishBatchId?: number;
  note?: string;
}

export interface TransferDto {
  id: number;
  projectId: number;
  transferNo?: string;
  note?: string;
  transferDate: string;
  status?: number;
}

export interface TransferLineDto {
  id: number;
  transferId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount?: number;
  averageGram?: number;
  biomassGram?: number;
}

export interface WeighingDto {
  id: number;
  projectId: number;
  weighingNo?: string;
  note?: string;
  weighingDate: string;
  status?: number;
}

export interface WeighingLineDto {
  id: number;
  weighingId: number;
  projectCageId: number;
  measuredCount?: number;
  measuredAverageGram?: number;
  measuredBiomassGram?: number;
}

export interface StockConvertDto {
  id: number;
  projectId: number;
  convertNo?: string;
  note?: string;
  convertDate: string;
  status?: number;
}

export interface StockConvertLineDto {
  id: number;
  stockConvertId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount?: number;
  averageGram?: number;
  newAverageGram?: number;
  biomassGram?: number;
}

export interface ShipmentDto {
  id: number;
  projectId: number;
  shipmentNo?: string;
  targetWarehouse?: string;
  note?: string;
  shipmentDate: string;
  status?: number;
}

export interface ShipmentLineDto {
  id: number;
  shipmentId: number;
  fishBatchId?: number;
  fromProjectCageId: number;
  fishCount?: number;
  averageGram?: number;
  biomassGram?: number;
}

export interface BatchMovementDto {
  id: number;
  projectCageId?: number;
  fromProjectCageId?: number;
  toProjectCageId?: number;
  fromStockId?: number;
  toStockId?: number;
  fromAverageGram?: number;
  toAverageGram?: number;
  referenceId?: number;
  movementDate: string;
  movementType: number;
  signedCount: number;
  signedBiomassGram: number;
}

export interface CageDailyRow {
  date: string;
  feedGram: number;
  feedStockCount: number;
  feedDetails: string[];
  deadCount: number;
  countDelta: number;
  biomassDelta: number;
  weather: string;
  netOperationCount: number;
  netOperationDetails: string[];
  transferCount: number;
  transferDetails: string[];
  weighingCount: number;
  weighingDetails: string[];
  stockConvertCount: number;
  stockConvertDetails: string[];
  shipmentCount: number;
  shipmentDetails: string[];
  shipmentFishCount: number;
  shipmentBiomassGram: number;
  fed: boolean;
}

export interface CageProjectReport {
  projectCageId: number;
  cageLabel: string;
  initialFishCount: number;
  initialAverageGram: number;
  initialBiomassGram: number;
  currentFishCount: number;
  currentAverageGram: number;
  currentBiomassGram: number;
  totalDeadCount: number;
  totalFeedGram: number;
  totalCountDelta: number;
  totalBiomassDelta: number;
  missingFeedingDays: string[];
  dailyRows: CageDailyRow[];
}

export interface ProjectDetailReport {
  project: ProjectDto;
  cages: CageProjectReport[];
  cageHistory: CageHistoryItem[];
}
