import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { transferLinesConfig, transfersConfig } from '../config/page-configs';

export function TransfersPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={transfersConfig}
      lineConfig={transferLinesConfig}
      lineForeignKey="transferId"
      lineSectionTitle="aqua.pages.transferLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
