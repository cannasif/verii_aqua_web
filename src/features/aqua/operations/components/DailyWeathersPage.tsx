import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { dailyWeathersConfig } from '../config/page-configs';

export function DailyWeathersPage(): ReactElement {
  return <AquaCrudPage config={dailyWeathersConfig} />;
}
