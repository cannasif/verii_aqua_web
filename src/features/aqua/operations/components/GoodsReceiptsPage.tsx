import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { goodsReceiptsConfig } from '../config/page-configs';

export function GoodsReceiptsPage(): ReactElement {
  return <AquaCrudPage config={goodsReceiptsConfig} />;
}
