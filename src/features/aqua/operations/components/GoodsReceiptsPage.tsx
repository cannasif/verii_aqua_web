import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { goodsReceiptLinesConfig, goodsReceiptsConfig } from '../config/page-configs';

export function GoodsReceiptsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={goodsReceiptsConfig}
      lineConfig={goodsReceiptLinesConfig}
      lineForeignKey="goodsReceiptId"
      lineSectionTitle="aqua.pages.goodsReceiptLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
