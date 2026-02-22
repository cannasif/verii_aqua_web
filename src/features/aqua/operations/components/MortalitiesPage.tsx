import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { mortalitiesConfig, mortalityLinesConfig } from '../config/page-configs';

export function MortalitiesPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={mortalitiesConfig}
      lineConfig={mortalityLinesConfig}
      lineForeignKey="mortalityId"
      lineSectionTitle="aqua.pages.mortalityLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
