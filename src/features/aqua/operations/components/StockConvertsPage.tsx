import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { stockConvertsConfig } from '../config/page-configs';

export function StockConvertsPage(): ReactElement {
  return <AquaCrudPage config={stockConvertsConfig} />;
}
