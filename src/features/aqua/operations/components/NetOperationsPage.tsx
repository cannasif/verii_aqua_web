import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { netOperationsConfig } from '../config/page-configs';

export function NetOperationsPage(): ReactElement {
  return <AquaCrudPage config={netOperationsConfig} />;
}
