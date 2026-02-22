import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AquaCrudConfig } from '@/features/aqua/shared/types/aqua-crud';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AquaHeaderLineCrudPageProps {
  headerConfig: AquaCrudConfig;
  lineConfig: AquaCrudConfig;
  lineForeignKey: string;
  lineSectionTitle: string;
  lineSectionDescription: string;
}

export function AquaHeaderLineCrudPage({
  headerConfig,
  lineConfig,
  lineForeignKey,
  lineSectionTitle,
  lineSectionDescription,
}: AquaHeaderLineCrudPageProps): ReactElement {
  const { t } = useTranslation();
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<Record<string, unknown> | null>(null);

  const selectedHeaderId = useMemo(() => {
    if (!selectedHeaderRow) return null;
    const id = Number(selectedHeaderRow.id ?? selectedHeaderRow.Id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [selectedHeaderRow]);

  return (
    <div className="space-y-6">
      <AquaCrudPage
        config={headerConfig}
        rowSelectionEnabled
        selectedRowId={selectedHeaderId}
        onRowSelect={setSelectedHeaderRow}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t(lineSectionTitle)}</CardTitle>
          <CardDescription>
            {selectedHeaderId == null
              ? t('aqua.common.noData')
              : t(lineSectionDescription, { id: selectedHeaderId })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AquaCrudPage
            config={lineConfig}
            hidePageHeader
            disablePageTitleSync
            contextFilter={{
              fieldKey: lineForeignKey,
              value: selectedHeaderId,
              lockValue: true,
              hideFieldInForm: true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
