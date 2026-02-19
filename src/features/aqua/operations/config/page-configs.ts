import type { AquaCrudConfig } from '@/features/aqua/shared/types/aqua-crud';

const documentStatusOptions = [
  { label: 'aqua.status.draft', value: 0 },
  { label: 'aqua.status.posted', value: 1 },
  { label: 'aqua.status.cancelled', value: 2 },
];

export const goodsReceiptsConfig: AquaCrudConfig = {
  key: 'goodsReceipts',
  title: 'aqua.pages.goodsReceipts.title',
  description: 'aqua.pages.goodsReceipts.description',
  endpoint: 'GoodsReceipt',
  postingSlug: 'goods-receipt',
  listStaleTimeMs: 15000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number' },
    { key: 'receiptNo', label: 'aqua.fields.receiptNo', type: 'text', required: true },
    { key: 'receiptDate', label: 'aqua.fields.receiptDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'supplierId', label: 'aqua.fields.supplierId', type: 'number' },
    { key: 'warehouseId', label: 'aqua.fields.warehouseId', type: 'number' },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'receiptNo', label: 'aqua.fields.receiptNo' },
    { key: 'receiptDate', label: 'aqua.fields.receiptDate' },
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const feedingsConfig: AquaCrudConfig = {
  key: 'feedings',
  title: 'aqua.pages.feedings.title',
  description: 'aqua.pages.feedings.description',
  endpoint: 'Feeding',
  listStaleTimeMs: 10000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'feedingNo', label: 'aqua.fields.feedingNo', type: 'text', required: true },
    { key: 'feedingDate', label: 'aqua.fields.feedingDate', type: 'datetime', required: true },
    {
      key: 'feedingSlot',
      label: 'aqua.fields.feedingSlot',
      type: 'select',
      required: true,
      options: [
        { label: 'aqua.feedingSlot.morning', value: 0 },
        { label: 'aqua.feedingSlot.evening', value: 1 },
      ],
    },
    {
      key: 'sourceType',
      label: 'aqua.fields.sourceType',
      type: 'select',
      required: true,
      options: [
        { label: 'aqua.sourceType.manual', value: 0 },
        { label: 'aqua.sourceType.planned', value: 1 },
        { label: 'aqua.sourceType.auto', value: 2 },
      ],
    },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'feedingNo', label: 'aqua.fields.feedingNo' },
    { key: 'feedingDate', label: 'aqua.fields.feedingDate' },
    { key: 'feedingSlot', label: 'aqua.fields.feedingSlot' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { feedingSlot: 0, sourceType: 0, status: 0 },
};

export const mortalitiesConfig: AquaCrudConfig = {
  key: 'mortalities',
  title: 'aqua.pages.mortalities.title',
  description: 'aqua.pages.mortalities.description',
  endpoint: 'Mortality',
  postingSlug: 'mortality',
  listStaleTimeMs: 10000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'mortalityDate', label: 'aqua.fields.mortalityDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'mortalityDate', label: 'aqua.fields.mortalityDate' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const transfersConfig: AquaCrudConfig = {
  key: 'transfers',
  title: 'aqua.pages.transfers.title',
  description: 'aqua.pages.transfers.description',
  endpoint: 'Transfer',
  postingSlug: 'transfer',
  listStaleTimeMs: 10000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'transferNo', label: 'aqua.fields.transferNo', type: 'text', required: true },
    { key: 'transferDate', label: 'aqua.fields.transferDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'transferNo', label: 'aqua.fields.transferNo' },
    { key: 'transferDate', label: 'aqua.fields.transferDate' },
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const weighingsConfig: AquaCrudConfig = {
  key: 'weighings',
  title: 'aqua.pages.weighings.title',
  description: 'aqua.pages.weighings.description',
  endpoint: 'Weighing',
  postingSlug: 'weighing',
  listStaleTimeMs: 10000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'weighingNo', label: 'aqua.fields.weighingNo', type: 'text', required: true },
    { key: 'weighingDate', label: 'aqua.fields.weighingDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'weighingNo', label: 'aqua.fields.weighingNo' },
    { key: 'weighingDate', label: 'aqua.fields.weighingDate' },
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const stockConvertsConfig: AquaCrudConfig = {
  key: 'stockConverts',
  title: 'aqua.pages.stockConverts.title',
  description: 'aqua.pages.stockConverts.description',
  endpoint: 'StockConvert',
  postingSlug: 'stock-convert',
  listStaleTimeMs: 10000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'convertNo', label: 'aqua.fields.convertNo', type: 'text', required: true },
    { key: 'convertDate', label: 'aqua.fields.convertDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'convertNo', label: 'aqua.fields.convertNo' },
    { key: 'convertDate', label: 'aqua.fields.convertDate' },
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const dailyWeathersConfig: AquaCrudConfig = {
  key: 'dailyWeathers',
  title: 'aqua.pages.dailyWeathers.title',
  description: 'aqua.pages.dailyWeathers.description',
  endpoint: 'DailyWeather',
  listStaleTimeMs: 30000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'weatherDate', label: 'aqua.fields.weatherDate', type: 'date', required: true },
    { key: 'weatherTypeId', label: 'aqua.fields.weatherTypeId', type: 'number', required: true },
    { key: 'weatherSeverityId', label: 'aqua.fields.weatherSeverityId', type: 'number', required: true },
    { key: 'temperatureC', label: 'aqua.fields.temperatureC', type: 'number' },
    { key: 'windKnot', label: 'aqua.fields.windKnot', type: 'number' },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'weatherDate', label: 'aqua.fields.weatherDate' },
    { key: 'weatherTypeId', label: 'aqua.fields.weatherTypeId' },
    { key: 'weatherSeverityId', label: 'aqua.fields.weatherSeverityId' },
  ],
};

export const netOperationsConfig: AquaCrudConfig = {
  key: 'netOperations',
  title: 'aqua.pages.netOperations.title',
  description: 'aqua.pages.netOperations.description',
  endpoint: 'NetOperation',
  postingSlug: 'net-operation',
  listStaleTimeMs: 15000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'operationTypeId', label: 'aqua.fields.operationTypeId', type: 'number', required: true },
    { key: 'operationNo', label: 'aqua.fields.operationNo', type: 'text', required: true },
    { key: 'operationDate', label: 'aqua.fields.operationDate', type: 'date', required: true },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'operationNo', label: 'aqua.fields.operationNo' },
    { key: 'operationDate', label: 'aqua.fields.operationDate' },
    { key: 'operationTypeId', label: 'aqua.fields.operationTypeId' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};
