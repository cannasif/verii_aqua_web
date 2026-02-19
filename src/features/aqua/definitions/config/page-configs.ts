import type { AquaCrudConfig } from '@/features/aqua/shared/types/aqua-crud';

const documentStatusOptions = [
  { label: 'aqua.status.draft', value: 0 },
  { label: 'aqua.status.posted', value: 1 },
  { label: 'aqua.status.cancelled', value: 2 },
];

export const projectsConfig: AquaCrudConfig = {
  key: 'projects',
  title: 'aqua.pages.projects.title',
  description: 'aqua.pages.projects.description',
  endpoint: 'Project',
  listStaleTimeMs: 60000,
  fields: [
    { key: 'projectCode', label: 'aqua.fields.projectCode', type: 'text', required: true },
    { key: 'projectName', label: 'aqua.fields.projectName', type: 'text', required: true },
    { key: 'startDate', label: 'aqua.fields.startDate', type: 'date', required: true },
    { key: 'endDate', label: 'aqua.fields.endDate', type: 'date' },
    { key: 'status', label: 'aqua.fields.status', type: 'select', required: true, options: documentStatusOptions },
    { key: 'note', label: 'aqua.fields.note', type: 'textarea' },
  ],
  columns: [
    { key: 'projectCode', label: 'aqua.fields.projectCode' },
    { key: 'projectName', label: 'aqua.fields.projectName' },
    { key: 'startDate', label: 'aqua.fields.startDate' },
    { key: 'status', label: 'aqua.fields.status' },
  ],
  defaultValues: { status: 0 },
};

export const cagesConfig: AquaCrudConfig = {
  key: 'cages',
  title: 'aqua.pages.cages.title',
  description: 'aqua.pages.cages.description',
  endpoint: 'Cage',
  listStaleTimeMs: 60000,
  fields: [
    { key: 'cageCode', label: 'aqua.fields.cageCode', type: 'text', required: true },
    { key: 'cageName', label: 'aqua.fields.cageName', type: 'text', required: true },
    { key: 'capacityCount', label: 'aqua.fields.capacityCount', type: 'number' },
    { key: 'capacityGram', label: 'aqua.fields.capacityGram', type: 'number' },
  ],
  columns: [
    { key: 'cageCode', label: 'aqua.fields.cageCode' },
    { key: 'cageName', label: 'aqua.fields.cageName' },
    { key: 'capacityCount', label: 'aqua.fields.capacityCount' },
    { key: 'capacityGram', label: 'aqua.fields.capacityGram' },
  ],
};

export const projectCageAssignmentsConfig: AquaCrudConfig = {
  key: 'projectCageAssignments',
  title: 'aqua.pages.projectCageAssignments.title',
  description: 'aqua.pages.projectCageAssignments.description',
  endpoint: 'ProjectCage',
  listStaleTimeMs: 45000,
  fields: [
    { key: 'projectId', label: 'aqua.fields.projectId', type: 'number', required: true },
    { key: 'cageId', label: 'aqua.fields.cageId', type: 'number', required: true },
    { key: 'assignedDate', label: 'aqua.fields.assignedDate', type: 'date', required: true },
    { key: 'releasedDate', label: 'aqua.fields.releasedDate', type: 'date' },
  ],
  columns: [
    { key: 'projectId', label: 'aqua.fields.projectId' },
    { key: 'cageId', label: 'aqua.fields.cageId' },
    { key: 'assignedDate', label: 'aqua.fields.assignedDate' },
    { key: 'releasedDate', label: 'aqua.fields.releasedDate' },
  ],
};

export const weatherSeveritiesConfig: AquaCrudConfig = {
  key: 'weatherSeverities',
  title: 'aqua.pages.weatherSeverities.title',
  description: 'aqua.pages.weatherSeverities.description',
  endpoint: 'WeatherSeverity',
  listStaleTimeMs: 120000,
  fields: [
    { key: 'code', label: 'aqua.fields.code', type: 'text', required: true },
    { key: 'name', label: 'aqua.fields.name', type: 'text', required: true },
    { key: 'score', label: 'aqua.fields.score', type: 'number', required: true },
  ],
  columns: [
    { key: 'code', label: 'aqua.fields.code' },
    { key: 'name', label: 'aqua.fields.name' },
    { key: 'score', label: 'aqua.fields.score' },
  ],
};

export const weatherTypesConfig: AquaCrudConfig = {
  key: 'weatherTypes',
  title: 'aqua.pages.weatherTypes.title',
  description: 'aqua.pages.weatherTypes.description',
  endpoint: 'WeatherType',
  listStaleTimeMs: 120000,
  fields: [
    { key: 'code', label: 'aqua.fields.code', type: 'text', required: true },
    { key: 'name', label: 'aqua.fields.name', type: 'text', required: true },
  ],
  columns: [
    { key: 'code', label: 'aqua.fields.code' },
    { key: 'name', label: 'aqua.fields.name' },
  ],
};

export const netOperationTypesConfig: AquaCrudConfig = {
  key: 'netOperationTypes',
  title: 'aqua.pages.netOperationTypes.title',
  description: 'aqua.pages.netOperationTypes.description',
  endpoint: 'NetOperationType',
  listStaleTimeMs: 120000,
  fields: [
    { key: 'code', label: 'aqua.fields.code', type: 'text', required: true },
    { key: 'name', label: 'aqua.fields.name', type: 'text', required: true },
  ],
  columns: [
    { key: 'code', label: 'aqua.fields.code' },
    { key: 'name', label: 'aqua.fields.name' },
  ],
};
