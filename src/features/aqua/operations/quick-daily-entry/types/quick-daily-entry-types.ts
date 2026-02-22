export interface ProjectDto {
  id: number;
  projectCode: string;
  projectName: string;
}

export interface ProjectCageDto {
  id: number;
  cageId: number;
  projectId: number;
  cageCode?: string;
  cageName?: string;
}

export interface StockDto {
  id: number;
  code?: string;
  name?: string;
}

export interface FishBatchDto {
  id: number;
  fishStockId?: number;
  currentAverageGram?: number;
}

export interface WeatherSeverityDto {
  id: number;
  code?: string;
  name?: string;
}

export interface WeatherTypeDto {
  id: number;
  code?: string;
  name?: string;
}

export interface NetOperationTypeDto {
  id: number;
  code?: string;
  name?: string;
}

export interface FeedingHeaderDto {
  id: number;
  projectId: number;
  feedingDate: string;
  feedingSlot?: number;
}

export interface MortalityHeaderDto {
  id: number;
  projectId: number;
  mortalityDate: string;
}

export interface NetOperationHeaderDto {
  id: number;
  projectId: number;
  operationDate: string;
  operationTypeId?: number;
}

export interface CreateFeedingPayload {
  projectId: number;
  feedingNo: string;
  feedingDate: string;
  feedingSlot: number;
  sourceType?: number;
  status?: number;
}

export interface CreateFeedingLinePayload {
  feedingId: number;
  stockId: number;
  qtyUnit: number;
  gramPerUnit: number;
  totalGram: number;
}

export interface CreateMortalityPayload {
  projectId: number;
  mortalityDate: string;
  status?: number;
  note?: string;
}

export interface CreateMortalityLinePayload {
  mortalityId: number;
  fishBatchId: number;
  projectCageId: number;
  deadCount: number;
}

export interface CreateDailyWeatherPayload {
  projectId: number;
  weatherDate: string;
  weatherSeverityId: number;
  weatherTypeId: number;
  note?: string;
}

export interface CreateNetOperationPayload {
  projectId: number;
  operationTypeId: number;
  operationNo: string;
  operationDate: string;
  status?: number;
  note?: string;
}

export interface CreateNetOperationLinePayload {
  netOperationId: number;
  projectCageId: number;
  fishBatchId?: number;
  quantity: number;
  unitGram?: number;
  note?: string;
}
