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

      <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0a18]/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="border-b border-slate-200 dark:border-white/10 px-5 py-4 bg-transparent shrink-0">
          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {t(lineSectionTitle)}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedHeaderId == null
              ? t('aqua.common.noData')
              : t(lineSectionDescription, { id: selectedHeaderId })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1">
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