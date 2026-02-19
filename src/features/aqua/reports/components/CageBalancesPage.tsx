import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { cageBalancesConfig } from '../config/page-configs';

export function CageBalancesPage(): ReactElement {
  return <AquaCrudPage config={cageBalancesConfig} />;
}
