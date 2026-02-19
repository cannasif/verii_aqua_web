import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { projectsConfig } from '../config/page-configs';

export function ProjectsPage(): ReactElement {
  return <AquaCrudPage config={projectsConfig} />;
}
