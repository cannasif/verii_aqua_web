export interface ProjectDto {
  id: number;
  projectCode: string;
  projectName: string;
  startDate: string;
}

export interface StockDto {
  id: number;
  code?: string;
  name?: string;
}

export interface ProjectCageDto {
  id: number;
  cageId: number;
  projectId: number;
  cageCode?: string;
  cageName?: string;
}

export interface GoodsReceiptCreateResult {
  id: number;
}

export interface GoodsReceiptLineCreateResult {
  id: number;
}

export interface FishBatchCreateResult {
  id: number;
}

export interface CreateProjectPayload {
  projectCode: string;
  projectName: string;
  startDate: string;
}

export interface CreateGoodsReceiptPayload {
  projectId: number;
  receiptNo: string;
  receiptDate: string;
}

export const GOODS_RECEIPT_ITEM_TYPE_FISH = 1;

export interface CreateGoodsReceiptLinePayload {
  goodsReceiptId: number;
  stockId: number;
  itemType?: number;
  fishCount?: number;
  qtyUnit?: number;
}

export interface CreateGoodsReceiptFishDistributionPayload {
  goodsReceiptLineId: number;
  projectCageId: number;
  fishBatchId: number;
  fishCount: number;
}

export interface CreateFishBatchPayload {
  projectId: number;
  batchCode: string;
  fishStockId: number;
  currentAverageGram: number;
  startDate: string;
  sourceGoodsReceiptLineId?: number;
}

export interface CageAllocationRow {
  projectCageId: number;
  cageCode?: string;
  cageName?: string;
  fishCount: number;
}
