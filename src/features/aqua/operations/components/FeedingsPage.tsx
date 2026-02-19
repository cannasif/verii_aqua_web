import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { feedingsConfig } from '../config/page-configs';

export function FeedingsPage(): ReactElement {
  return <AquaCrudPage config={feedingsConfig} />;
}
