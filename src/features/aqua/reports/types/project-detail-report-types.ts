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
  projectCageId: number;
  fishCount: number;
}

export interface BatchCageBalanceDto {
  id: number;
  projectCageId: number;
  liveCount: number;
  asOfDate: string;
}

export interface CageDailyRow {
  date: string;
  feedGram: number;
  deadCount: number;
  fed: boolean;
}

export interface CageProjectReport {
  projectCageId: number;
  cageLabel: string;
  initialFishCount: number;
  currentFishCount: number;
  totalDeadCount: number;
  totalFeedGram: number;
  missingFeedingDays: string[];
  dailyRows: CageDailyRow[];
}

export interface ProjectDetailReport {
  project: ProjectDto;
  cages: CageProjectReport[];
}
