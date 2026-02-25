import { type ReactElement, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Fish,
  Scale,
  UtensilsCrossed,
  FileText,
  LayoutGrid,
  History,
  ChevronDown,
  Droplets,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageDailyRow, CageProjectReport } from '../types/project-detail-report-types';

const REPORT_QUERY_KEY = ['aqua', 'reports', 'project-detail'] as const;
type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
}

interface ReportConsistency {
  expectedCurrentFish: number;
  isConsistent: boolean;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function ReportGuideCard({ t }: { t: (key: string, options?: Record<string, unknown>) => string }): ReactElement {
  return (
    <Card className="border-teal-200/70 bg-linear-to-r from-teal-50 via-white to-cyan-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800">
          {t('aqua.projectDetailReport.readGuideTitle', { defaultValue: 'Raporu Nasıl Okurum?' })}
        </CardTitle>
        <CardDescription>
          {t('aqua.projectDetailReport.readGuideDescription', {
            defaultValue:
              'Kartlar proje toplamını, alt açılır satırlar ise kafes bazlı günlük hareketleri gösterir.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-white/80 p-2">
          {t('aqua.projectDetailReport.readGuideCurrentFish', {
            defaultValue: 'Mevcut Balık: Başlangıçtan ölüm ve sevkiyatlar düşülmüş canlı adettir.',
          })}
        </div>
        <div className="rounded-md border border-slate-200 bg-white/80 p-2">
          {t('aqua.projectDetailReport.readGuideShipment', {
            defaultValue: 'Sevk Miktarı: solda adet, sağda gram biyokütle toplamıdır.',
          })}
        </div>
        <div className="rounded-md border border-slate-200 bg-white/80 p-2">
          {t('aqua.projectDetailReport.readGuideDelta', {
            defaultValue: 'Delta kolonları gün içi net değişimi gösterir (+/-).',
          })}
        </div>
        <div className="rounded-md border border-slate-200 bg-white/80 p-2">
          {t('aqua.projectDetailReport.readGuideButtons', {
            defaultValue: 'Transfer/Sevkiyat/Dönüşüm butonuna tıklayınca o günün detay satırları açılır.',
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CageSummaryCards({ cage, t }: { cage: CageProjectReport; t: (key: string) => string }): ReactElement {
  const stockRatio =
    cage.initialFishCount > 0
      ? clampPercent((cage.currentFishCount / cage.initialFishCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-200/80 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <Fish className="size-3.5 text-emerald-600" />
          {t('aqua.projectDetailReport.initialFish')} / {t('aqua.projectDetailReport.currentFish')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-0 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-emerald-700/90">{t('aqua.projectDetailReport.initialFish')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{formatNumber(cage.initialFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-sky-500/10 to-sky-500/5 shadow-sm ring-1 ring-sky-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-sky-700/90">{t('aqua.projectDetailReport.currentFish')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">{formatNumber(cage.currentFishCount)}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-200/60">
                <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-rose-500/10 to-rose-500/5 shadow-sm ring-1 ring-rose-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-700/90">{t('aqua.projectDetailReport.totalDead')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatNumber(cage.totalDeadCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-teal-500/10 to-teal-500/5 shadow-sm ring-1 ring-teal-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-teal-700/90">{t('aqua.projectDetailReport.totalCountDelta')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-teal-800">{formatNumber(cage.totalCountDelta)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-indigo-200/80 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <Scale className="size-3.5 text-indigo-600" />
          {t('aqua.projectDetailReport.initialAverageGram')} / {t('aqua.projectDetailReport.currentAverageGram')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-0 bg-linear-to-br from-indigo-500/10 to-indigo-500/5 shadow-sm ring-1 ring-indigo-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-indigo-700/90">{t('aqua.projectDetailReport.initialAverageGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-800">{formatNumber(cage.initialAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-violet-500/10 to-violet-500/5 shadow-sm ring-1 ring-violet-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-violet-700/90">{t('aqua.projectDetailReport.currentAverageGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-violet-800">{formatNumber(cage.currentAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-cyan-500/10 to-cyan-500/5 shadow-sm ring-1 ring-cyan-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-cyan-700/90">{t('aqua.projectDetailReport.initialBiomassGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-800">{formatNumber(cage.initialBiomassGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-blue-500/10 to-blue-500/5 shadow-sm ring-1 ring-blue-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-blue-700/90">{t('aqua.projectDetailReport.currentBiomassGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-blue-800">{formatNumber(cage.currentBiomassGram)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-amber-200/80 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <UtensilsCrossed className="size-3.5 text-amber-600" />
          {t('aqua.projectDetailReport.totalFeedGram')} / {t('aqua.projectDetailReport.totalBiomassDelta')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-linear-to-br from-amber-500/10 to-amber-500/5 shadow-sm ring-1 ring-amber-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-amber-700/90">{t('aqua.projectDetailReport.totalFeedGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{formatNumber(cage.totalFeedGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-linear-to-br from-fuchsia-500/10 to-fuchsia-500/5 shadow-sm ring-1 ring-fuchsia-500/20">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-fuchsia-700/90">{t('aqua.projectDetailReport.totalBiomassDelta')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-fuchsia-800">{formatNumber(cage.totalBiomassDelta)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectSummaryCards({
  activeCageCount,
  inactiveCageCount,
  totalInitialFish,
  totalCurrentFish,
  totalDead,
  totalFeedGram,
  totalCurrentBiomass,
  avgCurrentGram,
  totalShipmentFish,
  totalShipmentBiomass,
  lastShipmentDate,
  t,
}: {
  activeCageCount: number;
  inactiveCageCount: number;
  totalInitialFish: number;
  totalCurrentFish: number;
  totalDead: number;
  totalFeedGram: number;
  totalCurrentBiomass: number;
  avgCurrentGram: number;
  totalShipmentFish: number;
  totalShipmentBiomass: number;
  lastShipmentDate: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  const stockRatio =
    totalInitialFish > 0 ? clampPercent((totalCurrentFish / totalInitialFish) * 100) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-cyan-200/60 bg-linear-to-br from-cyan-500/10 to-cyan-500/5 ring-1 ring-cyan-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-cyan-700/90">
            {t('aqua.projectDetailReport.activeCages', { defaultValue: 'Aktif Kafes' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-800">{formatNumber(activeCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200/60 bg-linear-to-br from-slate-500/10 to-slate-500/5 ring-1 ring-slate-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-slate-700/90">
            {t('aqua.projectDetailReport.inactiveCages', { defaultValue: 'Pasif Kafes' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{formatNumber(inactiveCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-emerald-200/60 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 ring-1 ring-emerald-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-emerald-700/90">
            {t('aqua.projectDetailReport.initialFishTotal', { defaultValue: 'Başlangıç Toplam Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{formatNumber(totalInitialFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-sky-200/60 bg-linear-to-br from-sky-500/10 to-sky-500/5 ring-1 ring-sky-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-sky-700/90">
            {t('aqua.projectDetailReport.currentFishTotal', { defaultValue: 'Mevcut Toplam Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">{formatNumber(totalCurrentFish)}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-200/60">
            <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-rose-200/60 bg-linear-to-br from-rose-500/10 to-rose-500/5 ring-1 ring-rose-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-rose-700/90">
            {t('aqua.projectDetailReport.totalDead', { defaultValue: 'Toplam Ölüm' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatNumber(totalDead)}</p>
        </CardContent>
      </Card>
      <Card className="border-amber-200/60 bg-linear-to-br from-amber-500/10 to-amber-500/5 ring-1 ring-amber-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-amber-700/90">
            {t('aqua.projectDetailReport.totalFeedGram', { defaultValue: 'Toplam Besleme (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{formatNumber(totalFeedGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-blue-200/60 bg-linear-to-br from-blue-500/10 to-blue-500/5 ring-1 ring-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-blue-700/90">
            {t('aqua.projectDetailReport.currentBiomassTotal', { defaultValue: 'Mevcut Toplam Biyokütle (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-blue-800">{formatNumber(totalCurrentBiomass)}</p>
        </CardContent>
      </Card>
      <Card className="border-violet-200/60 bg-linear-to-br from-violet-500/10 to-violet-500/5 ring-1 ring-violet-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-violet-700/90">
            {t('aqua.projectDetailReport.currentAvgGramTotal', { defaultValue: 'Mevcut Ortalama Gram' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-violet-800">{formatNumber(avgCurrentGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-orange-200/60 bg-linear-to-br from-orange-500/10 to-orange-500/5 ring-1 ring-orange-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-orange-700/90">
            {t('aqua.projectDetailReport.totalShipmentFish', { defaultValue: 'Toplam Sevk Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-orange-800">{formatNumber(totalShipmentFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-rose-200/60 bg-linear-to-br from-rose-500/10 to-rose-500/5 ring-1 ring-rose-500/20">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-rose-700/90">
            {t('aqua.projectDetailReport.totalShipmentBiomass', { defaultValue: 'Toplam Sevk Biyokütle (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatNumber(totalShipmentBiomass)}</p>
          <p className="mt-1 text-xs text-rose-700/80">
            {t('aqua.projectDetailReport.lastShipmentDate', { defaultValue: 'Son Sevk Tarihi' })}: {lastShipmentDate}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCurrentSnapshotCards({
  projectCode,
  projectName,
  snapshotDate,
  liveRatePercent,
  aliveFishCount,
  deadFishCount,
  missingFeedCageCountToday,
  activeCageCount,
  totalShipmentFish,
  totalShipmentBiomass,
  lastShipmentDate,
  consistency,
  t,
}: {
  projectCode: string;
  projectName: string;
  snapshotDate: string;
  liveRatePercent: number;
  aliveFishCount: number;
  deadFishCount: number;
  missingFeedCageCountToday: number;
  activeCageCount: number;
  totalShipmentFish: number;
  totalShipmentBiomass: number;
  lastShipmentDate: string;
  consistency: ReportConsistency;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  const safeRate = clampPercent(liveRatePercent);
  const hasSnapshotDate = snapshotDate !== '-';
  const activeWithFeedCount = hasSnapshotDate
    ? Math.max(0, activeCageCount - missingFeedCageCountToday)
    : 0;

  return (
    <Card className="border-cyan-200/70 bg-linear-to-r from-cyan-50 via-white to-indigo-50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              {t('aqua.projectDetailReport.currentSnapshotTitle', { defaultValue: 'Ana Detay (Şu Anki Anlık Durum)' })}
            </CardTitle>
            <CardDescription className="mt-1">
              {projectCode} — {projectName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-cyan-300 text-cyan-700">
            {t('aqua.projectDetailReport.snapshotDate', { defaultValue: 'Anlık tarih' })}: {snapshotDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-emerald-200/70 bg-emerald-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-emerald-700">
                {t('aqua.projectDetailReport.liveRate', { defaultValue: 'Canlılık Oranı' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                {formatNumber(safeRate)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-sky-200/70 bg-sky-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-sky-700">
                {t('aqua.projectDetailReport.aliveFishNow', { defaultValue: 'Şu An Canlı Balık' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">{formatNumber(aliveFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200/70 bg-rose-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-700">
                {t('aqua.projectDetailReport.totalDead', { defaultValue: 'Toplam Ölüm' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatNumber(deadFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200/70 bg-amber-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-amber-700">
                {t('aqua.projectDetailReport.cagesFedToday', { defaultValue: 'Bugün Beslenen Aktif Kafes' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">
                {formatNumber(activeWithFeedCount)} / {formatNumber(activeCageCount)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${safeRate}%` }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-orange-200/70 bg-orange-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-orange-700">
                {t('aqua.projectDetailReport.totalShipmentFish', { defaultValue: 'Toplam Sevk Balık' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-orange-800">{formatNumber(totalShipmentFish)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200/70 bg-rose-50/70">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-700">
                {t('aqua.projectDetailReport.totalShipmentBiomass', { defaultValue: 'Toplam Sevk Biyokütle (Gram)' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatNumber(totalShipmentBiomass)}</p>
              <p className="mt-1 text-xs text-rose-700/80">
                {t('aqua.projectDetailReport.lastShipmentDate', { defaultValue: 'Son Sevk Tarihi' })}: {lastShipmentDate}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="border-slate-200/70 bg-white/70">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-700">
                {t('aqua.projectDetailReport.consistencyFormula', {
                  defaultValue: 'Hesap kontrolü: Başlangıç - Ölüm - Sevk = Mevcut',
                })}
              </p>
              <Badge
                className={
                  consistency.isConsistent
                    ? 'bg-emerald-600 hover:bg-emerald-600'
                    : 'bg-rose-600 hover:bg-rose-600'
                }
              >
                {consistency.isConsistent
                  ? t('aqua.projectDetailReport.consistent', { defaultValue: 'Tutarlı' })
                  : t('aqua.projectDetailReport.inconsistent', { defaultValue: 'Tutarsız' })}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold tabular-nums text-slate-800">
              {formatNumber(aliveFishCount)} = {formatNumber(consistency.expectedCurrentFish)}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export function ProjectDetailReportPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
  });

  const openDetailDialog = (cage: CageProjectReport, row: CageDailyRow, type: DetailType): void => {
    const titleMap: Record<DetailType, string> = {
      feeding: t('aqua.projectDetailReport.feedingDetails', { defaultValue: 'Besleme Detayı' }),
      netOperation: t('aqua.projectDetailReport.netOps'),
      transfer: t('aqua.projectDetailReport.transfers'),
      stockConvert: t('aqua.projectDetailReport.stockConverts'),
      shipment: t('aqua.projectDetailReport.shipments'),
    };
    const detailMap: Record<DetailType, string[]> = {
      feeding: row.feedDetails,
      netOperation: row.netOperationDetails,
      transfer: row.transferDetails,
      stockConvert: row.stockConvertDetails,
      shipment: row.shipmentDetails,
    };
    const items = detailMap[type];
    if (items.length === 0) return;

    setDetailDialog({
      open: true,
      title: `${titleMap[type]} - ${cage.cageLabel}`,
      description: `${t('aqua.projectDetailReport.date')}: ${row.date}`,
      items,
    });
  };

  const projectsQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, 'projects'] as const,
    queryFn: () => projectDetailReportApi.getProjects(),
    staleTime: 5 * 60 * 1000,
  });

  const reportQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, projectId] as const,
    queryFn: () => projectDetailReportApi.getProjectDetailReport(projectId!),
    enabled: projectId != null,
    staleTime: 30 * 1000,
  });

  const sortedProjects = useMemo(() => {
    const list = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
    return [...list].sort((a, b) => String(a.projectCode ?? '').localeCompare(String(b.projectCode ?? '')));
  }, [projectsQuery.data]);

  const projectOptions = useMemo(
    () =>
      sortedProjects.map((project) => ({
        value: String(project.id),
        label: `${project.projectCode ?? ''} - ${project.projectName ?? ''}`,
      })),
    [sortedProjects]
  );

  const projectSummary = useMemo(() => {
    if (!reportQuery.data) return null;
    const cages = reportQuery.data.cages;
    const totalInitialFish = cages.reduce((acc, x) => acc + Number(x.initialFishCount ?? 0), 0);
    const totalCurrentFish = cages.reduce((acc, x) => acc + Number(x.currentFishCount ?? 0), 0);
    const totalDead = cages.reduce((acc, x) => acc + Number(x.totalDeadCount ?? 0), 0);
    const totalFeedGram = cages.reduce((acc, x) => acc + Number(x.totalFeedGram ?? 0), 0);
    const totalCurrentBiomass = cages.reduce((acc, x) => acc + Number(x.currentBiomassGram ?? 0), 0);
    const totalShipmentFish = cages.reduce(
      (acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentFishCount ?? 0), 0),
      0
    );
    const totalShipmentBiomass = cages.reduce(
      (acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentBiomassGram ?? 0), 0),
      0
    );
    const shipmentDates = cages
      .flatMap((x) => x.dailyRows)
      .filter((row) => row.shipmentCount > 0 || row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0)
      .map((row) => row.date)
      .sort((a, b) => b.localeCompare(a));
    const avgCurrentGram = totalCurrentFish > 0 ? totalCurrentBiomass / totalCurrentFish : 0;
    const expectedCurrentFish = Math.max(0, totalInitialFish - totalDead - totalShipmentFish);
    const isConsistent = expectedCurrentFish === totalCurrentFish;

    return {
      activeCageCount: cages.length,
      inactiveCageCount: reportQuery.data.cageHistory.length,
      totalInitialFish,
      totalCurrentFish,
      totalDead,
      totalFeedGram,
      totalCurrentBiomass,
      avgCurrentGram,
      totalShipmentFish,
      totalShipmentBiomass,
      lastShipmentDate: shipmentDates[0] ?? '-',
      expectedCurrentFish,
      isConsistent,
    };
  }, [reportQuery.data]);

  const projectCurrentSnapshot = useMemo(() => {
    if (!reportQuery.data || !projectSummary) return null;
    const cages = reportQuery.data.cages;
    const latestDate = cages
      .flatMap((x) => x.dailyRows.map((r) => r.date))
      .sort((a, b) => b.localeCompare(a))[0];
    const snapshotDate = latestDate || '-';
    const liveRatePercent =
      projectSummary.totalInitialFish > 0
        ? (projectSummary.totalCurrentFish / projectSummary.totalInitialFish) * 100
        : 0;

    return {
      projectCode: reportQuery.data.project.projectCode ?? '',
      projectName: reportQuery.data.project.projectName ?? '',
      snapshotDate,
      liveRatePercent,
      aliveFishCount: projectSummary.totalCurrentFish,
      deadFishCount: projectSummary.totalDead,
      missingFeedCageCountToday:
        latestDate != null
          ? cages.filter((cage) => cage.missingFeedingDays.includes(latestDate)).length
          : 0,
      activeCageCount: projectSummary.activeCageCount,
      totalShipmentFish: projectSummary.totalShipmentFish,
      totalShipmentBiomass: projectSummary.totalShipmentBiomass,
      lastShipmentDate: projectSummary.lastShipmentDate,
      consistency: {
        expectedCurrentFish: projectSummary.expectedCurrentFish,
        isConsistent: projectSummary.isConsistent,
      },
    };
  }, [projectSummary, reportQuery.data]);

  return (
    <div className="min-h-[60vh] space-y-6 pb-8">
      <Card className="relative overflow-hidden border-0 bg-linear-to-br from-slate-900 via-slate-800 to-cyan-900 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.25),transparent)]" />
        <CardHeader className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-400/30">
                <FileText className="size-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-white">
                  {t('aqua.projectDetailReport.pageTitle')}
                </CardTitle>
                <CardDescription className="mt-0.5 text-slate-300">
                  {t('aqua.projectDetailReport.description')}
                </CardDescription>
              </div>
            </div>
            <div className="min-w-[280px] max-w-sm rounded-lg bg-white/10 p-2 ring-1 ring-white/10 backdrop-blur-sm">
              <Combobox
                options={projectOptions}
                value={projectId != null ? String(projectId) : ''}
                onValueChange={(v) => setProjectId(v ? Number(v) : null)}
                placeholder={t('aqua.projectDetailReport.selectProject')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.noResults')}
                disabled={projectsQuery.isLoading}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {projectId == null && (
        <Card className="border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/80 text-slate-500">
              <LayoutGrid className="size-7" />
            </div>
            <p className="text-center text-sm font-medium text-slate-600">
              {t('aqua.projectDetailReport.pickProjectFirst')}
            </p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isLoading && projectId != null && (
        <Card className="border-slate-200">
          <CardContent className="flex items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-rose-700">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-600">
              !
            </span>
            {(reportQuery.error as Error).message}
          </CardContent>
        </Card>
      )}

      {reportQuery.data && (
        <Card className="overflow-hidden border-slate-200 shadow-md">
          <CardHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                <Droplets className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {reportQuery.data.project.projectCode} — {reportQuery.data.project.projectName}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {t('aqua.projectDetailReport.totalCages', { defaultValue: 'Toplam Aktif Kafes' })}: {reportQuery.data.cages.length}
                </CardDescription>
              </div>
              <Badge className="ml-auto bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                {reportQuery.data.cages.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-4 pb-4 pt-4">
              <ReportGuideCard t={t} />
            </div>
            {projectCurrentSnapshot && (
              <div className="border-b border-slate-100 bg-white px-4 pb-4 pt-4">
                <ProjectCurrentSnapshotCards
                  projectCode={projectCurrentSnapshot.projectCode}
                  projectName={projectCurrentSnapshot.projectName}
                  snapshotDate={projectCurrentSnapshot.snapshotDate}
                  liveRatePercent={projectCurrentSnapshot.liveRatePercent}
                  aliveFishCount={projectCurrentSnapshot.aliveFishCount}
                  deadFishCount={projectCurrentSnapshot.deadFishCount}
                  missingFeedCageCountToday={projectCurrentSnapshot.missingFeedCageCountToday}
                  activeCageCount={projectCurrentSnapshot.activeCageCount}
                  totalShipmentFish={projectCurrentSnapshot.totalShipmentFish}
                  totalShipmentBiomass={projectCurrentSnapshot.totalShipmentBiomass}
                  lastShipmentDate={projectCurrentSnapshot.lastShipmentDate}
                  consistency={projectCurrentSnapshot.consistency}
                  t={t}
                />
              </div>
            )}

            {projectSummary && (
              <div className="border-b border-slate-100 bg-slate-50/40 px-4 pb-4 pt-4">
                <Card className="border-indigo-200/70 bg-linear-to-r from-indigo-50 via-white to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      {t('aqua.projectDetailReport.mainSummaryTitle', { defaultValue: 'Ana Detay (Anlık Durum)' })}
                    </CardTitle>
                    <CardDescription>
                      {t('aqua.projectDetailReport.mainSummaryDescription', {
                        defaultValue: 'Projedeki aktif kafeslerin toplam anlık durumu.',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProjectSummaryCards
                      activeCageCount={projectSummary.activeCageCount}
                      inactiveCageCount={projectSummary.inactiveCageCount}
                      totalInitialFish={projectSummary.totalInitialFish}
                      totalCurrentFish={projectSummary.totalCurrentFish}
                      totalDead={projectSummary.totalDead}
                      totalFeedGram={projectSummary.totalFeedGram}
                      totalCurrentBiomass={projectSummary.totalCurrentBiomass}
                      avgCurrentGram={projectSummary.avgCurrentGram}
                      totalShipmentFish={projectSummary.totalShipmentFish}
                      totalShipmentBiomass={projectSummary.totalShipmentBiomass}
                      lastShipmentDate={projectSummary.lastShipmentDate}
                      t={t}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {reportQuery.data.cages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <LayoutGrid className="size-7" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('aqua.projectDetailReport.noActiveCages', { defaultValue: 'Aktif kafes bulunamadı.' })}
                </p>
              </div>
            ) : (
              <div className="px-4 pt-4">
              <Accordion type="single" collapsible className="w-full">
                {reportQuery.data.cages.map((cage, idx) => (
                  <AccordionItem
                    key={cage.projectCageId}
                    value={`cage-${cage.projectCageId}`}
                    className="border-slate-100 px-4 data-[state=open]:border-b-0"
                  >
                    <AccordionTrigger className="rounded-lg py-5 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-slate-50/80">
                      <div className="flex w-full flex-wrap items-center justify-between gap-3 pr-4">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-sm font-bold text-cyan-700">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">{cage.cageLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('aqua.projectDetailReport.currentVsInitial')}:{' '}
                              {formatNumber(cage.currentFishCount)} / {formatNumber(cage.initialFishCount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {t('aqua.projectDetailReport.dead')}: {formatNumber(cage.totalDeadCount)}
                          </Badge>
                          <Badge variant="outline" className={cage.missingFeedingDays.length > 0 ? 'border-amber-300 text-amber-700' : ''}>
                            {t('aqua.projectDetailReport.missingFeedDays')}: {cage.missingFeedingDays.length}
                          </Badge>
                          <ChevronDown className="size-4 text-slate-400" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-5 pt-1">
                      <CageSummaryCards cage={cage} t={t} />

                      <Card className="border-amber-200/60 bg-amber-50/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <UtensilsCrossed className="size-4 text-amber-600" />
                            {t('aqua.projectDetailReport.missingFeedingDates')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {cage.missingFeedingDays.length === 0 ? (
                            <p className="text-sm font-medium text-emerald-700">
                              {t('aqua.projectDetailReport.noMissingFeedDay')}
                            </p>
                          ) : (
                            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                              {cage.missingFeedingDays.slice(0, 90).map((day) => (
                                <Badge key={day} variant="destructive" className="font-medium">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Calendar className="size-4 text-slate-600" />
                            {t('aqua.projectDetailReport.dailyDetails')}
                          </CardTitle>
                          <CardDescription>{t('aqua.projectDetailReport.dailyDetailsHint')}</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.date')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.feedGram')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">
                                  {t('aqua.projectDetailReport.feedStocks', { defaultValue: 'Yem Stokları' })}
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.deadCount')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.countDelta')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.biomassDelta')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.weather')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.netOps')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.transfers')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.shipments')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.shipmentQty')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.stockConverts')}</TableHead>
                                <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.feedStatus')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {cage.dailyRows.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
                                  {t('common.noData')}
                                </TableCell>
                              </TableRow>
                            )}
                            {cage.dailyRows.slice(0, 45).map((row, rowIdx) => (
                              <TableRow
                                key={`${cage.projectCageId}-${row.date}`}
                                className={rowIdx % 2 === 1 ? 'bg-slate-50/50' : ''}
                              >
                                <TableCell className="font-medium tabular-nums">{row.date}</TableCell>
                                <TableCell className="tabular-nums">{formatNumber(row.feedGram)}</TableCell>
                                <TableCell>
                                  {row.feedDetails.length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 font-medium"
                                      onClick={() => openDetailDialog(cage, row, 'feeding')}
                                    >
                                      {t('aqua.projectDetailReport.stockCountShort', {
                                        defaultValue: '{{count}} stok',
                                        count: row.feedStockCount,
                                      })}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {t('aqua.projectDetailReport.stockCountShort', {
                                        defaultValue: '{{count}} stok',
                                        count: row.feedStockCount,
                                      })}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums">{formatNumber(row.deadCount)}</TableCell>
                                <TableCell className="tabular-nums">{formatNumber(row.countDelta)}</TableCell>
                                <TableCell className="tabular-nums">{formatNumber(row.biomassDelta)}</TableCell>
                                <TableCell className="max-w-[260px] truncate text-slate-600">{row.weather}</TableCell>
                                <TableCell>
                                  {row.netOperationCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 font-medium"
                                      onClick={() => openDetailDialog(cage, row, 'netOperation')}
                                    >
                                      {formatNumber(row.netOperationCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.transferCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 font-medium"
                                      onClick={() => openDetailDialog(cage, row, 'transfer')}
                                    >
                                      {formatNumber(row.transferCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.shipmentCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 font-medium"
                                      onClick={() => openDetailDialog(cage, row, 'shipment')}
                                    >
                                      {formatNumber(row.shipmentCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0
                                    ? `${formatNumber(row.shipmentFishCount)} / ${formatNumber(row.shipmentBiomassGram)}g`
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {row.stockConvertCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 font-medium"
                                      onClick={() => openDetailDialog(cage, row, 'stockConvert')}
                                    >
                                      {formatNumber(row.stockConvertCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.fed ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                      {t('aqua.projectDetailReport.fed')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">{t('aqua.projectDetailReport.notFed')}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              </div>
            )}

            {reportQuery.data.cageHistory.length > 0 && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-4">
                <Card className="border-slate-200 bg-slate-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <History className="size-4 text-slate-600" />
                      {t('aqua.projectDetailReport.cageHistoryTitle', { defaultValue: 'Kafes Geçmişi (Buydu/Bu Oldu)' })}
                    </CardTitle>
                    <CardDescription>
                      {t('aqua.projectDetailReport.cageHistoryDescription', {
                        defaultValue: 'Projede daha önce kullanılmış ancak şu an aktif olmayan kafesler.',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                          <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.cage', { defaultValue: 'Kafes' })}</TableHead>
                          <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.assignedDate', { defaultValue: 'Atanma Tarihi' })}</TableHead>
                          <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.releasedDate', { defaultValue: 'Ayrılma Tarihi' })}</TableHead>
                          <TableHead className="font-semibold text-slate-700">{t('aqua.projectDetailReport.status', { defaultValue: 'Durum' })}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportQuery.data.cageHistory.map((item) => (
                          <TableRow key={`history-${item.projectCageId}`} className="border-slate-100">
                            <TableCell className="font-medium">{item.cageLabel}</TableCell>
                            <TableCell className="tabular-nums">{item.assignedDate ? item.assignedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell className="tabular-nums">{item.releasedDate ? item.releasedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{t('aqua.projectDetailReport.inactive', { defaultValue: 'Pasif' })}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden border-slate-200 bg-slate-50/50 p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-800">
                {detailDialog.title}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500 tabular-nums">
                {detailDialog.description}
              </DialogDescription>
            </div>
          </DialogHeader>
          {detailDialog.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('aqua.projectDetailReport.noOperationDetail')}
            </p>
          ) : (
            <div className="border-t border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('aqua.projectDetailReport.detailRecords', { count: detailDialog.items.length })}
              </div>
              <div className="max-h-60 overflow-y-auto px-1 py-2 custom-scrollbar">
                {detailDialog.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 odd:bg-slate-50/50"
                  >
                    <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1 font-mono text-[13px] leading-snug text-slate-700 break-all">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
