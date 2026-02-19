import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { weatherSeveritiesConfig } from '../config/page-configs';

export function WeatherSeveritiesPage(): ReactElement {
  return <AquaCrudPage config={weatherSeveritiesConfig} />;
}
