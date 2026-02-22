import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { feedingLinesConfig, feedingsConfig } from '../config/page-configs';

export function FeedingsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={feedingsConfig}
      lineConfig={feedingLinesConfig}
      lineForeignKey="feedingId"
      lineSectionTitle="aqua.pages.feedingLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
