import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { weatherTypesConfig } from '../config/page-configs';

export function WeatherTypesPage(): ReactElement {
  return <AquaCrudPage config={weatherTypesConfig} />;
}
