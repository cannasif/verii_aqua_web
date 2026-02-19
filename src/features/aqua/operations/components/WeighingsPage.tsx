import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { weighingsConfig } from '../config/page-configs';

export function WeighingsPage(): ReactElement {
  return <AquaCrudPage config={weighingsConfig} />;
}
