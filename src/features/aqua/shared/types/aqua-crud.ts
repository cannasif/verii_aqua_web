import type { PagedParams, PagedResponse } from '@/types/api';

export type AquaFieldType = 'text' | 'number' | 'date' | 'datetime' | 'textarea' | 'select';

export interface AquaFieldOption {
  label: string;
  value: string | number;
}

export interface AquaFieldLookupConfig {
  endpoint: string;
  labelKey?: string;
  labelKeys?: string[];
  labelSeparator?: string;
  valueKey: string;
  staleTimeMs: number;
}

export interface AquaFieldConfig {
  key: string;
  label: string;
  type: AquaFieldType;
  required?: boolean;
  placeholder?: string;
  options?: AquaFieldOption[];
  lookup?: AquaFieldLookupConfig;
}

export interface AquaColumnConfig {
  key: string;
  label: string;
}

export interface AquaCrudConfig {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  listStaleTimeMs: number;
  fields: AquaFieldConfig[];
  columns?: AquaColumnConfig[];
  defaultValues?: Record<string, unknown>;
  readOnly?: boolean;
  postingSlug?: 'goods-receipt' | 'transfer' | 'mortality' | 'weighing' | 'stock-convert' | 'net-operation';
}

export interface AquaCrudContextFilter {
  fieldKey: string;
  value: number | null;
  lockValue?: boolean;
  hideFieldInForm?: boolean;
}

export interface AquaListParams extends PagedParams {}

export type AquaListResponse = PagedResponse<Record<string, unknown>>;
