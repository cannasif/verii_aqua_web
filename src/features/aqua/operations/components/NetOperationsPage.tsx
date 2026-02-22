import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { netOperationLinesConfig, netOperationsConfig } from '../config/page-configs';

export function NetOperationsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={netOperationsConfig}
      lineConfig={netOperationLinesConfig}
      lineForeignKey="netOperationId"
      lineSectionTitle="aqua.pages.netOperationLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
