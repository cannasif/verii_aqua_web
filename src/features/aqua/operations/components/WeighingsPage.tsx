import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { weighingLinesConfig, weighingsConfig } from '../config/page-configs';

export function WeighingsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={weighingsConfig}
      lineConfig={weighingLinesConfig}
      lineForeignKey="weighingId"
      lineSectionTitle="aqua.pages.weighingLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
