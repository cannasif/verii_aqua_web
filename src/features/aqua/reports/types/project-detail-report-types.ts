export interface ProjectDto {
  id: number;
  projectCode?: string;
  projectName?: string;
  startDate?: string;
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
  feedingDate: string;
}

export interface FeedingLineDto {
  id: number;
  feedingId: number;
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
}

export interface StockConvertLineDto {
  id: number;
  stockConvertId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount?: number;
  averageGram?: number;
  biomassGram?: number;
}

export interface BatchMovementDto {
  id: number;
  projectCageId?: number;
  movementDate: string;
  movementType: number;
  signedCount: number;
  signedBiomassGram: number;
}

export interface CageDailyRow {
  date: string;
  feedGram: number;
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
