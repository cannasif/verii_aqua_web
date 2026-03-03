import { type MouseEvent, type ReactElement, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, Fish, Layers, Loader2, Skull, UtensilsCrossed, Waves } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/PageLoader';
import { aquaDashboardApi } from '../api/aqua-dashboard-api';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageProjectReport } from '../types/project-detail-report-types';

const DASHBOARD_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'summaries'] as const;
const PROJECT_DETAIL_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'project-detail'] as const;
const PROJECTS_PER_PAGE = 3;
type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function CageCard({
  cage,
  t,
  onClick,
  isSelected = false,
  clickable = false,
}: {
  cage: {
    projectCageId: number;
    cageLabel: string;
    currentFishCount: number;
    totalDeadCount: number;
    totalFeedGram: number;
    currentBiomassGram: number;
  };
  t: (key: string, opts?: { defaultValue?: string }) => string;
  onClick?: () => void;
  isSelected?: boolean;
  clickable?: boolean;
}): ReactElement {
  return (
    <Card
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (!onClick) return;
        // Prevent parent project card click from overriding selected cage.
        event.stopPropagation();
        onClick();
      }}
      className={`overflow-hidden border-2 bg-linear-to-b from-cyan-500/15 via-slate-900/90 to-cyan-900/30 shadow-lg transition ${
        isSelected ? 'border-cyan-300/80 shadow-cyan-500/25' : 'border-cyan-500/30'
      } ${clickable ? 'cursor-pointer hover:border-cyan-400/50 hover:shadow-cyan-500/15' : ''}`}
    >
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-cyan-500/25 bg-cyan-500/15 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-xl border-2 border-cyan-400/50 bg-cyan-500/25 shadow-inner">
              <Waves className="size-6 text-cyan-200" />
            </div>
            <span className="font-semibold text-white drop-shadow-sm">{cage.cageLabel}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/25 border border-emerald-400/30 px-3 py-1.5">
            <Fish className="size-5 text-emerald-200" />
            <span className="text-sm font-bold text-emerald-100">{formatNumber(cage.currentFishCount)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/70 border border-white/5 px-2.5 py-2">
            <Skull className="size-4 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                {t('aqua.dashboard.totalDead', { defaultValue: 'Toplam Ölüm' })}
              </p>
              <p className="truncate text-sm font-medium text-rose-200">{formatNumber(cage.totalDeadCount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/70 border border-white/5 px-2.5 py-2">
            <UtensilsCrossed className="size-4 shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                {t('aqua.dashboard.totalFeed', { defaultValue: 'Toplam Besleme (g)' })}
              </p>
              <p className="truncate text-sm font-medium text-amber-200">{formatNumber(cage.totalFeedGram)} g</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-slate-800/70 border border-white/5 px-2.5 py-2">
            <Layers className="size-4 shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                {t('aqua.dashboard.currentBiomass', { defaultValue: 'Mevcut Biyokütle (g)' })}
              </p>
              <p className="truncate text-sm font-medium text-indigo-200">{formatNumber(cage.currentBiomassGram)} g</p>
            </div>
          </div>
        </div>
        <div className="h-6 w-full overflow-hidden rounded-b-md">
          <svg viewBox="0 0 200 24" className="w-full h-full text-cyan-500/40" preserveAspectRatio="none">
            <path fill="currentColor" d="M0 12 Q50 4 100 12 T200 12 V24 H0 Z" />
            <path fill="currentColor" opacity="0.6" d="M0 16 Q50 10 100 16 T200 16 V24 H0 Z" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

export function AquaDashboardPage(): ReactElement {
  const { t } = useTranslation('common');
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PER_PAGE);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
  });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const summariesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: aquaDashboardApi.getActiveProjectSummaries,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const summaries = summariesQuery.data ?? [];
  const visibleSummaries = summaries.slice(0, visibleCount);
  const hasMore = visibleCount < summaries.length;
  const selectedProjectSummary = summaries.find((project) => project.projectId === selectedProjectId) ?? null;

  const detailQuery = useQuery({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, selectedProjectId],
    queryFn: async () => projectDetailReportApi.getProjectDetailReport(selectedProjectId as number),
    enabled: selectedProjectId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    setVisibleCount(PROJECTS_PER_PAGE);
  }, [summaries.length]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PROJECTS_PER_PAGE, summaries.length));
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, summaries.length]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedCageId(null);
      return;
    }

    const fromSummary = selectedProjectSummary?.cages[0]?.projectCageId ?? null;
    if (fromSummary != null) {
      setSelectedCageId((prev) => prev ?? fromSummary);
    }
  }, [selectedProjectId, selectedProjectSummary]);

  useEffect(() => {
    if (!detailQuery.data?.cages?.length) return;
    if (selectedCageId == null) {
      setSelectedCageId(detailQuery.data.cages[0].projectCageId);
      return;
    }
    const exists = detailQuery.data.cages.some((cage) => cage.projectCageId === selectedCageId);
    if (!exists) {
      setSelectedCageId(detailQuery.data.cages[0].projectCageId);
    }
  }, [detailQuery.data, selectedCageId]);

  const openProjectDetail = (projectId: number, cageId?: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(cageId ?? null);
    setIsProjectDialogOpen(true);
  };

  const openDetailDialog = (cage: CageProjectReport, type: DetailType): ((date: string, items: string[]) => void) => {
    const titleMap: Record<DetailType, string> = {
      feeding: t('aqua.projectDetailReport.feedingDetails', { defaultValue: 'Besleme Detayı' }),
      netOperation: t('aqua.projectDetailReport.netOps', { defaultValue: 'Ağ İşlemi' }),
      transfer: t('aqua.projectDetailReport.transfers', { defaultValue: 'Transfer' }),
      stockConvert: t('aqua.projectDetailReport.stockConverts', { defaultValue: 'Stok Dönüşüm' }),
      shipment: t('aqua.projectDetailReport.shipments', { defaultValue: 'Sevkiyat' }),
    };

    return (date: string, items: string[]) => {
      if (items.length === 0) return;
      setDetailDialog({
        open: true,
        title: `${titleMap[type]} - ${cage.cageLabel}`,
        description: `${t('aqua.projectDetailReport.date', { defaultValue: 'Tarih' })}: ${date}`,
        items,
      });
    };
  };

  const selectedCageFromDetail: CageProjectReport | null =
    detailQuery.data?.cages.find((cage) => cage.projectCageId === selectedCageId) ??
    detailQuery.data?.cages[0] ??
    null;

  const openCageDailyDialog = (projectCageId: number): void => {
    setSelectedCageId(projectCageId);
    setIsDailyDialogOpen(true);
  };

  const openDailyFromProjectList = (projectId: number, projectCageId: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(projectCageId);
    setIsProjectDialogOpen(false);
    setIsDailyDialogOpen(true);
  };

  if (summariesQuery.isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {summariesQuery.isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <CardContent className="py-8 text-sm text-rose-300">
            {t('aqua.dashboard.loadError', { defaultValue: 'Dashboard verileri alınamadı.' })}
          </CardContent>
        </Card>
      ) : summaries.length === 0 ? (
        <Card className="border-white/5 bg-[#0b0713]">
          <CardContent className="py-10 text-center text-slate-400">
            {t('aqua.dashboard.noActiveProject', { defaultValue: 'Aktif proje bulunamadı.' })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {visibleSummaries.map((project) => (
            <Card
              key={project.projectId}
              className="border border-white/10 bg-[#0b0713] shadow-xl overflow-hidden cursor-pointer"
              onClick={() => openProjectDetail(project.projectId)}
            >
              <CardHeader className="border-b border-white/10 bg-linear-to-r from-cyan-500/10 to-transparent">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-white">
                      {project.projectCode} - {project.projectName}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-400">
                      {t('aqua.dashboard.cageCount', { defaultValue: 'Kafes sayısı' })}: {formatNumber(project.activeCageCount)}
                      {' · '}
                      {t('aqua.dashboard.currentFish', { defaultValue: 'Mevcut Balık' })}: {formatNumber(project.currentFish)}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                    onClick={(event) => {
                      event.stopPropagation();
                      openProjectDetail(project.projectId);
                    }}
                  >
                    <Activity className="size-4 mr-2" />
                    {t('aqua.dashboard.clickForDetail', { defaultValue: 'Detay / Tablo' })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {project.cages.map((cage) => (
                    <CageCard
                      key={cage.projectCageId}
                      cage={cage}
                      t={t}
                      clickable
                      onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMore && (
            <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-slate-500 text-sm" aria-hidden>
              {t('aqua.dashboard.scrollForMore', { defaultValue: 'Kaydırdıkça diğer aktif projeler yüklenecek...' })}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isProjectDialogOpen}
        onOpenChange={(open) => {
          setIsProjectDialogOpen(open);
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-5xl max-h-[90dvh] overflow-hidden bg-[#0b0713] border-white/10 text-white p-0">
          <DialogHeader className="px-5 sm:px-6 py-5 border-b border-white/10">
            <DialogTitle className="text-lg sm:text-xl">
              {selectedProjectSummary ? `${selectedProjectSummary.projectCode} - ${selectedProjectSummary.projectName}` : '-'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t('aqua.dashboard.detailDescription', {
                defaultValue: 'Kafes bazında mevcut balık, toplam ölüm ve besleme değerleri.',
              })}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-300">
              <Loader2 className="size-5 animate-spin" />
              {t('common.loading')}
            </div>
          ) : detailQuery.isError || detailQuery.data == null ? (
            <div className="py-12 text-center text-rose-300">
              {t('aqua.dashboard.loadError', { defaultValue: 'Dashboard verileri alınamadı.' })}
            </div>
          ) : (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-xs text-emerald-300">{t('aqua.dashboard.currentFish', { defaultValue: 'Mevcut Balık' })}</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-200">
                    {formatNumber(detailQuery.data.cages.reduce((acc, cage) => acc + cage.currentFishCount, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <p className="text-xs text-rose-300">{t('aqua.dashboard.totalDead', { defaultValue: 'Toplam Ölüm' })}</p>
                  <p className="mt-1 text-xl font-semibold text-rose-200">
                    {formatNumber(detailQuery.data.cages.reduce((acc, cage) => acc + cage.totalDeadCount, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-xs text-amber-300">{t('aqua.dashboard.totalFeed', { defaultValue: 'Toplam Besleme (g)' })}</p>
                  <p className="mt-1 text-xl font-semibold text-amber-200">
                    {formatNumber(detailQuery.data.cages.reduce((acc, cage) => acc + cage.totalFeedGram, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <p className="text-xs text-cyan-300">{t('aqua.dashboard.activeCages', { defaultValue: 'Aktif Kafes' })}</p>
                  <p className="mt-1 text-xl font-semibold text-cyan-200">{formatNumber(detailQuery.data.cages.length)}</p>
                </div>
              </div>

              <Card className="border-white/10 bg-[#120b1c]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Activity className="size-4 text-cyan-400" />
                    {t('aqua.dashboard.cageBreakdown', { defaultValue: 'Kafes Havuzları' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-400">
                    {t('aqua.dashboard.cageClickHint', {
                      defaultValue: 'Bir havuza tıklayın, aşağıda gün gün operasyon detayını görün.',
                    })}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {detailQuery.data.cages.map((cage) => (
                      <CageCard
                        key={cage.projectCageId}
                        cage={cage}
                        t={t}
                        clickable
                        isSelected={selectedCageId === cage.projectCageId}
                        onClick={() => openCageDailyDialog(cage.projectCageId)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#120b1c]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">
                    {selectedCageFromDetail?.cageLabel ?? '-'} ·{' '}
                    {t('aqua.dashboard.dailyDetail', { defaultValue: 'Gün Gün Detay' })}
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className="overflow-x-scroll"
                >
                  <table className="w-full min-w-[1240px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.date', { defaultValue: 'Tarih' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.feedGram', { defaultValue: 'Yem (gram)' })}</th>
                        <th className="px-3 py-2 text-slate-300">
                          {t('aqua.projectDetailReport.feedStocks', { defaultValue: 'Yem Stokları' })}
                        </th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.deadFish', { defaultValue: 'Ölü adet' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.countDelta', { defaultValue: 'Adet Delta' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.biomassDelta', { defaultValue: 'Biyokütle Delta' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.weather', { defaultValue: 'Hava' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.netOperation', { defaultValue: 'Ağ işlemi' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.transfer', { defaultValue: 'Transfer' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.shipment', { defaultValue: 'Sevkiyat' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.shipmentQty', { defaultValue: 'Sevk Miktarı' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.stockConverts', { defaultValue: 'Dönüşüm' })}</th>
                        <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.feedStatus', { defaultValue: 'Besleme durumu' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCageFromDetail == null || selectedCageFromDetail.dailyRows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-slate-400" colSpan={13}>
                            {t('aqua.dashboard.noDailyData', { defaultValue: 'Bu kafes için günlük kayıt bulunamadı.' })}
                          </td>
                        </tr>
                      ) : (
                        selectedCageFromDetail.dailyRows.map((row) => (
                          <tr key={row.date} className="border-b border-white/5 last:border-b-0">
                            <td className="px-3 py-2 text-slate-200">{row.date}</td>
                            <td className="px-3 py-2 text-slate-300">{formatNumber(row.feedGram)}</td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.feedDetails.length > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)}
                                >
                                  {t('aqua.projectDetailReport.stockCountShort', {
                                    defaultValue: '{{count}} stok',
                                    count: row.feedStockCount,
                                  })}
                                </Button>
                              ) : (
                                <span className="text-slate-600">
                                  {t('aqua.projectDetailReport.stockCountShort', {
                                    defaultValue: '{{count}} stok',
                                    count: row.feedStockCount,
                                  })}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">{formatNumber(row.deadCount)}</td>
                            <td className="px-3 py-2 text-slate-300">{formatNumber(row.countDelta)}</td>
                            <td className="px-3 py-2 text-slate-300">{formatNumber(row.biomassDelta)}</td>
                            <td className="px-3 py-2 max-w-[260px] truncate text-slate-400">{row.weather}</td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.netOperationCount > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)}
                                >
                                  {formatNumber(row.netOperationCount)}
                                </Button>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.transferCount > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'transfer')(row.date, row.transferDetails)}
                                >
                                  {formatNumber(row.transferCount)}
                                </Button>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.shipmentCount > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'shipment')(row.date, row.shipmentDetails)}
                                >
                                  {formatNumber(row.shipmentCount)}
                                </Button>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0
                                ? `${formatNumber(row.shipmentFishCount)} / ${formatNumber(row.shipmentBiomassGram)}g`
                                : '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {row.stockConvertCount > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'stockConvert')(row.date, row.stockConvertDetails)}
                                >
                                  {formatNumber(row.stockConvertCount)}
                                </Button>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {row.fed ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                                  {t('aqua.projectDetailReport.fed', { defaultValue: 'Beslendi' })}
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
                                  {t('aqua.projectDetailReport.notFed', { defaultValue: 'Beslenmedi' })}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setSelectedCageId(null);
                  }}
                >
                  {t('common.close', { defaultValue: 'Kapat' })}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden border border-white/10 bg-[#0b0713] p-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-white/5 bg-white/2 px-6 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <DialogTitle className="text-lg font-semibold tracking-tight text-white">{detailDialog.title}</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-400 tabular-nums">
                {detailDialog.description}
              </DialogDescription>
            </div>
          </DialogHeader>
          {detailDialog.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              {t('aqua.projectDetailReport.noOperationDetail', { defaultValue: 'Detay kaydı bulunamadı.' })}
            </p>
          ) : (
            <div className="bg-transparent">
              <div className="border-b border-white/5 bg-white/1 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('aqua.projectDetailReport.detailRecords', { count: detailDialog.items.length, defaultValue: 'Detay Kayıtları' })}
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-2 py-2 custom-scrollbar">
                {detailDialog.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex gap-4 border-b border-white/5 px-4 py-3 last:border-b-0 hover:bg-white/2 transition-colors rounded-lg"
                  >
                    <span className="shrink-0 text-sm font-bold tabular-nums text-pink-500/50 pt-0.5">{index + 1}.</span>
                    <span className="min-w-0 flex-1 font-mono text-[13px] leading-relaxed text-slate-300 break-all">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDailyDialogOpen} onOpenChange={setIsDailyDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[90dvh] max-w-7xl overflow-hidden border border-white/10 bg-[#0b0713] p-0 shadow-2xl rounded-2xl text-white">
          <DialogHeader className="border-b border-white/10 px-5 sm:px-6 py-5">
            <DialogTitle className="text-xl">
              {selectedCageFromDetail?.cageLabel ?? '-'} ·{' '}
              {t('aqua.dashboard.dailyDetail', { defaultValue: 'Günlük Detay' })}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t('aqua.projectDetailReport.dailyDetailsHint', {
                defaultValue: 'En güncel hareket satırları tarihe göre listelenir.',
              })}
            </DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-300">
              <Loader2 className="size-5 animate-spin" />
              {t('common.loading')}
            </div>
          ) : (
          <div
            className="overflow-x-scroll overflow-y-auto max-h-[calc(90dvh-7.5rem)]"
          >
            <table className="w-full min-w-[1240px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left bg-white/2">
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.date', { defaultValue: 'Tarih' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.feedGram', { defaultValue: 'Yem (gram)' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.feedStocks', { defaultValue: 'Yem Stokları' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.deadFish', { defaultValue: 'Ölü adet' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.countDelta', { defaultValue: 'Adet delta' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.biomassDelta', { defaultValue: 'Biyokütle delta (g)' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.weather', { defaultValue: 'Hava' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.netOperation', { defaultValue: 'Ağ işlemi' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.transfer', { defaultValue: 'Transfer' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.shipment', { defaultValue: 'Sevkiyat' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.shipmentQty', { defaultValue: 'Sevk Miktarı' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.projectDetailReport.stockConverts', { defaultValue: 'Dönüşüm' })}</th>
                  <th className="px-3 py-2 text-slate-300">{t('aqua.dashboard.feedStatus', { defaultValue: 'Besleme durumu' })}</th>
                </tr>
              </thead>
              <tbody>
                {selectedCageFromDetail == null || selectedCageFromDetail.dailyRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-400" colSpan={13}>
                      {t('aqua.dashboard.noDailyData', { defaultValue: 'Bu kafes için günlük kayıt bulunamadı.' })}
                    </td>
                  </tr>
                ) : (
                  selectedCageFromDetail.dailyRows.map((row) => (
                    <tr key={`daily-dialog-${selectedCageFromDetail.projectCageId}-${row.date}`} className="border-b border-white/5">
                      <td className="px-3 py-2 text-slate-200">{row.date}</td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(row.feedGram)}</td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.feedDetails.length > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)}
                          >
                            {t('aqua.projectDetailReport.stockCountShort', { defaultValue: '{{count}} stok', count: row.feedStockCount })}
                          </Button>
                        ) : (
                          <span className="text-slate-600">
                            {t('aqua.projectDetailReport.stockCountShort', { defaultValue: '{{count}} stok', count: row.feedStockCount })}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(row.deadCount)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(row.countDelta)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(row.biomassDelta)}</td>
                      <td className="px-3 py-2 max-w-[260px] truncate text-slate-400">{row.weather}</td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.netOperationCount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)}
                          >
                            {formatNumber(row.netOperationCount)}
                          </Button>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.transferCount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => openDetailDialog(selectedCageFromDetail, 'transfer')(row.date, row.transferDetails)}
                          >
                            {formatNumber(row.transferCount)}
                          </Button>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.shipmentCount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => openDetailDialog(selectedCageFromDetail, 'shipment')(row.date, row.shipmentDetails)}
                          >
                            {formatNumber(row.shipmentCount)}
                          </Button>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0
                          ? `${formatNumber(row.shipmentFishCount)} / ${formatNumber(row.shipmentBiomassGram)}g`
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.stockConvertCount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => openDetailDialog(selectedCageFromDetail, 'stockConvert')(row.date, row.stockConvertDetails)}
                          >
                            {formatNumber(row.stockConvertCount)}
                          </Button>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.fed ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                            {t('aqua.projectDetailReport.fed', { defaultValue: 'Beslendi' })}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
                            {t('aqua.projectDetailReport.notFed', { defaultValue: 'Beslenmedi' })}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
