import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { projectCageAssignmentsConfig } from '../config/page-configs';

export function ProjectCageAssignmentsPage(): ReactElement {
  return <AquaCrudPage config={projectCageAssignmentsConfig} />;
}
