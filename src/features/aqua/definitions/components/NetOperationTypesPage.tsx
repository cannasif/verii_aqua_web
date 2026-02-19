import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { netOperationTypesConfig } from '../config/page-configs';

export function NetOperationTypesPage(): ReactElement {
  return <AquaCrudPage config={netOperationTypesConfig} />;
}
