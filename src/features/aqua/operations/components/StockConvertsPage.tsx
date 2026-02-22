import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { stockConvertLinesConfig, stockConvertsConfig } from '../config/page-configs';

export function StockConvertsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={stockConvertsConfig}
      lineConfig={stockConvertLinesConfig}
      lineForeignKey="stockConvertId"
      lineSectionTitle="aqua.pages.stockConvertLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
