import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { mortalitiesConfig } from '../config/page-configs';

export function MortalitiesPage(): ReactElement {
  return <AquaCrudPage config={mortalitiesConfig} />;
}
