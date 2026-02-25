import { z } from 'zod';

export const feedingQuickFormSchema = z.object({
  feedingSlot: z.coerce.number().int().min(0),
  stockId: z.coerce.number().int().positive('common.required'),
  qtyUnit: z.coerce.number().min(0, 'common.required'),
  gramPerUnit: z.coerce.number().min(0, 'common.required'),
});

export const mortalityQuickFormSchema = z.object({
  deadCount: z.coerce.number().int().min(1, 'common.required'),
});

export const weatherQuickFormSchema = z.object({
  weatherSeverityId: z.coerce.number().int().positive('common.required'),
  weatherTypeId: z.coerce.number().int().positive('common.required'),
  description: z.string().optional(),
});

export const netOperationQuickFormSchema = z.object({
  netOperationTypeId: z.coerce.number().int().positive('common.required'),
  fishBatchId: z.coerce.number().int().min(0),
  description: z.string().optional(),
});

export const transferQuickFormSchema = z.object({
  toProjectCageId: z.coerce.number().int().positive('common.required'),
  fishCount: z.coerce.number().int().positive('common.required'),
  description: z.string().optional(),
});

export const stockChangeQuickFormSchema = z.object({
  toFishBatchId: z.coerce.number().int().positive('common.required'),
  fishCount: z.coerce.number().int().positive('common.required'),
  newAverageGram: z.coerce.number().positive('common.required'),
  description: z.string().optional(),
});

export type FeedingQuickFormSchema = z.infer<typeof feedingQuickFormSchema>;
export type MortalityQuickFormSchema = z.infer<typeof mortalityQuickFormSchema>;
export type WeatherQuickFormSchema = z.infer<typeof weatherQuickFormSchema>;
export type NetOperationQuickFormSchema = z.infer<typeof netOperationQuickFormSchema>;
export type TransferQuickFormSchema = z.infer<typeof transferQuickFormSchema>;
export type StockChangeQuickFormSchema = z.infer<typeof stockChangeQuickFormSchema>;
