import type { AquaCrudConfig } from '@/features/aqua/shared/types/aqua-crud';

export const batchMovementsConfig: AquaCrudConfig = {
  key: 'batchMovements',
  title: 'aqua.pages.batchMovements.title',
  description: 'aqua.pages.batchMovements.description',
  endpoint: 'BatchMovement',
  readOnly: true,
  listStaleTimeMs: 30000,
  fields: [],
  columns: [
    { key: 'fishBatchId', label: 'aqua.fields.fishBatchId' },
    { key: 'projectCageId', label: 'aqua.fields.projectCageId' },
    { key: 'movementType', label: 'aqua.fields.movementType' },
    { key: 'signedCount', label: 'aqua.fields.signedCount' },
    { key: 'signedBiomassGram', label: 'aqua.fields.signedBiomassGram' },
    { key: 'movementDate', label: 'aqua.fields.movementDate' },
  ],
};

export const cageBalancesConfig: AquaCrudConfig = {
  key: 'cageBalances',
  title: 'aqua.pages.cageBalances.title',
  description: 'aqua.pages.cageBalances.description',
  endpoint: 'BatchCageBalance',
  readOnly: true,
  listStaleTimeMs: 15000,
  fields: [],
  columns: [
    { key: 'fishBatchId', label: 'aqua.fields.fishBatchId' },
    { key: 'projectCageId', label: 'aqua.fields.projectCageId' },
    { key: 'liveCount', label: 'aqua.fields.liveCount' },
    { key: 'averageGram', label: 'aqua.fields.averageGram' },
    { key: 'biomassGram', label: 'aqua.fields.biomassGram' },
    { key: 'asOfDate', label: 'aqua.fields.asOfDate' },
  ],
};
