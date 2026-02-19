import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { cagesConfig } from '../config/page-configs';

export function CagesPage(): ReactElement {
  return <AquaCrudPage config={cagesConfig} />;
}
