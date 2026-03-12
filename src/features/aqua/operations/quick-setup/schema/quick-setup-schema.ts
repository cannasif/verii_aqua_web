import { z } from 'zod';

export const projectFormSchema = z.object({
  projectCode: z.string().min(1, 'common.required'),
  projectName: z.string().min(1, 'common.required'),
  startDate: z.string().min(1, 'common.required'),
});

export const goodsReceiptFormSchema = z.object({
  receiptNo: z.string().min(1, 'common.required'),
  receiptDate: z.string().min(1, 'common.required'),
});

export const fishLineFormSchema = z.object({
  stockId: z.coerce.number().int().positive('common.required'),
  fishCount: z.coerce.number().int().min(1, 'common.required'),
  currentAverageGram: z.coerce.number().min(0, 'common.required'),
});

export const feedLineFormSchema = z.object({
  stockId: z.coerce.number().int().min(0),
  qtyUnit: z.coerce.number().min(0),
});

export function isDistributionValid(
  allocations: { fishCount: number }[],
  totalFishCount: number
): boolean {
  const allIntegers = allocations.every((row) => Number.isInteger(row.fishCount) && row.fishCount >= 0);
  if (!allIntegers) return false;
  const sum = allocations.reduce((acc, row) => acc + row.fishCount, 0);
  return sum === totalFishCount;
}

export type ProjectFormSchema = z.infer<typeof projectFormSchema>;
export type GoodsReceiptFormSchema = z.infer<typeof goodsReceiptFormSchema>;
export type FishLineFormSchema = z.infer<typeof fishLineFormSchema>;
export type FeedLineFormSchema = z.infer<typeof feedLineFormSchema>;
