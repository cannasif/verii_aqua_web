import { type MouseEvent, type ReactElement, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, Fish, Layers, Loader2, Skull, UtensilsCrossed, Waves } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// LİGHT/DARK MOD UYUMLU VE TAŞMA ENGELLEYİCİ CAGE CARD
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
        event.stopPropagation();
        onClick();
      }}
      className={`overflow-hidden border-2 transition-all duration-300 min-h-[170px] flex flex-col bg-white shadow-sm dark:bg-linear-to-b dark:from-[#2a1b3d]/80 dark:via-[#150d22]/95 dark:to-[#1a1025] dark:shadow-xl dark:backdrop-blur-xl ${
        isSelected ? 'border-pink-500 shadow-md dark:border-pink-500/80 dark:shadow-[0_0_20px_rgba(236,72,153,0.25)] scale-[1.01]' : 'border-slate-200 dark:border-white/5 hover:border-pink-300 dark:hover:border-pink-500/40'
      } ${clickable ? 'cursor-pointer hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]' : ''}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-pink-200 bg-pink-50 dark:border-pink-500/30 dark:bg-pink-500/10 shadow-inner">
              <Waves className="size-4 text-pink-500 dark:text-pink-400" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white tracking-wide truncate">{cage.cageLabel}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-1">
            <Fish className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(cage.currentFishCount)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 p-3 flex-1 overflow-hidden">
          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-2 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <Skull className="size-3 text-rose-500 dark:text-rose-400 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400 truncate" title={t('aqua.dashboard.totalDead', { defaultValue: 'Ölüm' })}>
                {t('aqua.dashboard.totalDead', { defaultValue: 'Ölüm' })}
              </p>
            </div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-300 tabular-nums truncate">{formatNumber(cage.totalDeadCount)}</p>
          </div>

          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-2 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="size-3 text-amber-500 dark:text-amber-400 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400 truncate" title={t('aqua.dashboard.totalFeed', { defaultValue: 'Yem' })}>
                {t('aqua.dashboard.totalFeed', { defaultValue: 'Yem' })}
              </p>
            </div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-300 tabular-nums truncate">{formatNumber(cage.totalFeedGram)}<span className="text-[9px] ml-0.5 text-amber-600/60 dark:text-amber-500/60 font-normal">g</span></p>
          </div>

          <div className="col-span-2 flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-2 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-pink-500 dark:text-pink-400 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400 truncate" title={t('aqua.dashboard.currentBiomass', { defaultValue: 'Mevcut Biyokütle' })}>
                {t('aqua.dashboard.currentBiomass', { defaultValue: 'Mevcut Biyokütle' })}
              </p>
            </div>
            <p className="text-sm font-bold text-pink-600 dark:text-pink-300 tabular-nums truncate">{formatNumber(cage.currentBiomassGram)}<span className="text-[10px] ml-1 text-pink-600/60 dark:text-pink-500/60 font-normal">g</span></p>
          </div>
        </div>
        <div className="h-4 w-full overflow-hidden shrink-0 mt-auto opacity-20 dark:opacity-50">
          <svg viewBox="0 0 200 24" className="w-full h-full text-pink-500 dark:text-pink-600/30" preserveAspectRatio="none">
            <path fill="currentColor" d="M0 12 Q50 4 100 12 T200 12 V24 H0 Z" />
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
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({ open: false, title: '', description: '', items: [] });
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

  useEffect(() => { setVisibleCount(PROJECTS_PER_PAGE); }, [summaries.length]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PROJECTS_PER_PAGE, summaries.length));
        }
      }, { rootMargin: '200px', threshold: 0.1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, summaries.length]);

  useEffect(() => {
    if (!selectedProjectId) { setSelectedCageId(null); return; }
    const fromSummary = selectedProjectSummary?.cages[0]?.projectCageId ?? null;
    if (fromSummary != null) setSelectedCageId((prev) => prev ?? fromSummary);
  }, [selectedProjectId, selectedProjectSummary]);

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
      setDetailDialog({ open: true, title: `${titleMap[type]} - ${cage.cageLabel}`, description: `${t('aqua.projectDetailReport.date', { defaultValue: 'Tarih' })}: ${date}`, items });
    };
  };

  const selectedCageFromDetail: CageProjectReport | null = detailQuery.data?.cages.find((cage) => cage.projectCageId === selectedCageId) ?? detailQuery.data?.cages[0] ?? null;

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

  if (summariesQuery.isLoading) return <PageLoader />;

  return (
    <div className="space-y-8">
      {summariesQuery.isError ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
          <CardContent className="py-8 text-sm font-medium text-rose-600 dark:text-rose-300 text-center">
            {t('aqua.dashboard.loadError', { defaultValue: 'Dashboard verileri alınamadı.' })}
          </CardContent>
        </Card>
      ) : summaries.length === 0 ? (
        <Card className="bg-white border-slate-200 dark:border-white/5 dark:bg-[#1a1025]/60 dark:backdrop-blur-xl">
          <CardContent className="py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
            <Fish className="size-12 mx-auto mb-4 text-slate-300 dark:text-slate-600 dark:opacity-50" />
            {t('aqua.dashboard.noActiveProject', { defaultValue: 'Aktif proje bulunamadı.' })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {visibleSummaries.map((project) => (
            <Card
              key={project.projectId}
              className="border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#1a1025]/60 dark:backdrop-blur-xl dark:shadow-2xl overflow-hidden cursor-pointer group"
              onClick={() => openProjectDetail(project.projectId)}
            >
              <CardHeader className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 px-4 sm:px-6 py-4 group-hover:bg-slate-100/50 dark:group-hover:bg-white/4 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-pulse" />
                      <span className="truncate">{project.projectCode} - {project.projectName}</span>
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 text-[10px] sm:text-xs">
                        {t('aqua.dashboard.cageCount', { defaultValue: 'Kafes sayısı' })}: {formatNumber(project.activeCageCount)}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-[10px] sm:text-xs">
                        {t('aqua.dashboard.currentFish', { defaultValue: 'Mevcut Balık' })}: {formatNumber(project.currentFish)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-pink-200 text-pink-600 bg-pink-50 hover:bg-pink-100 dark:border-pink-500/30 dark:text-pink-400 dark:bg-pink-500/5 dark:hover:bg-pink-500/20 text-xs sm:text-sm h-9 px-4 rounded-xl font-bold shadow-sm dark:shadow-[0_0_15px_rgba(236,72,153,0.05)] transition-all"
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
              <CardContent className="p-4 sm:p-6 bg-transparent dark:bg-black/20">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {project.cages.map((cage) => (
                    <CageCard key={cage.projectCageId} cage={cage} t={t} clickable onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMore && (
            <div ref={loadMoreRef} className="h-16 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse" aria-hidden>
              {t('aqua.dashboard.scrollForMore', { defaultValue: 'Daha fazlası için kaydırın...' })}
            </div>
          )}
        </div>
      )}

      {/* PROJECT DETAY DIALOG */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-6xl max-h-[90dvh] overflow-hidden bg-white dark:bg-[#0b0713]/98 dark:backdrop-blur-3xl border-slate-200 dark:border-white/10 p-0 rounded-2xl shadow-2xl flex flex-col">
          <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-pink-600 to-orange-500 dark:from-pink-400 dark:to-orange-400 truncate">
              {selectedProjectSummary ? `${selectedProjectSummary.projectCode} - ${selectedProjectSummary.projectName}` : '-'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              {t('aqua.dashboard.detailDescription', { defaultValue: 'Kafes bazında mevcut balık, toplam ölüm ve besleme değerleri.' })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-3 sm:p-4 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/60 mb-1 truncate">{t('aqua.dashboard.currentFish', { defaultValue: 'Balık' })}</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 truncate">
                    {formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.currentFishCount, 0) || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-3 sm:p-4 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400/60 mb-1 truncate">{t('aqua.dashboard.totalDead', { defaultValue: 'Ölüm' })}</p>
                  <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 truncate">
                    {formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalDeadCount, 0) || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-3 sm:p-4 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/60 mb-1 truncate">{t('aqua.dashboard.totalFeed', { defaultValue: 'Yem (g)' })}</p>
                  <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 truncate">
                    {formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalFeedGram, 0) || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-pink-200 bg-pink-50 dark:border-pink-500/20 dark:bg-pink-500/5 p-3 sm:p-4 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400/60 mb-1 truncate">{t('aqua.dashboard.activeCages', { defaultValue: 'Kafes' })}</p>
                  <p className="text-lg sm:text-xl font-black text-pink-700 dark:text-pink-300 truncate">{formatNumber(detailQuery.data?.cages.length || 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <Layers className="size-4 text-pink-500 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">{t('aqua.dashboard.cageBreakdown', { defaultValue: 'Kafes Havuzları' })}</h3>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-0 ml-1">
                    {t('aqua.dashboard.cageClickHint', { defaultValue: 'Detay için tıkla' })}
                  </Badge>
                </div>
                {detailQuery.isLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="size-6 animate-spin text-pink-500" /></div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {detailQuery.data?.cages.map((cage) => (
                        <CageCard key={cage.projectCageId} cage={cage} t={t} clickable isSelected={selectedCageId === cage.projectCageId} onClick={() => openCageDailyDialog(cage.projectCageId)} />
                    ))}
                    </div>
                )}
              </div>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end shrink-0 bg-slate-50 dark:bg-white/1">
            <Button variant="outline" className="rounded-xl px-10 border-slate-300 text-slate-700 bg-white hover:bg-slate-100 dark:bg-transparent dark:border-white/10 dark:text-white dark:hover:bg-white/10" onClick={() => { setIsProjectDialogOpen(false); setSelectedProjectId(null); }}>
              {t('common.close', { defaultValue: 'Kapat' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DİĞER DETAY DİALOGLARI */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-[#0b0713]/98 dark:backdrop-blur-2xl border-slate-200 dark:border-white/10 p-0 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="size-4 text-pink-500" />
                {detailDialog.title}
              </DialogTitle>
              <span className="text-[11px] font-black text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-500/10 px-3 py-1 rounded-full tabular-nums">
                {detailDialog.description}
              </span>
            </div>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto px-4 py-4 custom-scrollbar">
            {detailDialog.items.map((item, index) => (
              <div key={index} className="flex gap-4 border-b border-slate-100 dark:border-white/5 px-4 py-3.5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-xl mt-1">
                <span className="shrink-0 text-xs font-black text-pink-600 pt-0.5">{index + 1}.</span>
                <span className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">{item}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDailyDialogOpen} onOpenChange={setIsDailyDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[90dvh] max-w-7xl overflow-hidden bg-white dark:bg-[#0b0713]/98 dark:backdrop-blur-2xl border-slate-200 dark:border-white/10 p-0 shadow-2xl rounded-2xl flex flex-col">
          <DialogHeader className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-5 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="h-8 w-8 rounded-lg bg-pink-100 border border-pink-200 dark:bg-pink-500/20 flex items-center justify-center dark:border-pink-500/30">
                <Waves className="size-4 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="truncate">{selectedCageFromDetail?.cageLabel ?? '-'}</span> 
              <span className="text-slate-400 dark:text-slate-500 font-normal">/</span> 
              <span className="text-pink-600 dark:text-pink-100">{t('aqua.dashboard.dailyDetail', { defaultValue: 'Günlük Detay' })}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#120b1c]/50 overflow-hidden shadow-xl">
              <table className="w-full min-w-[1240px] text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-left bg-slate-100 dark:bg-white/5">
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.date', { defaultValue: 'Tarih' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.feedGram', { defaultValue: 'Yem (g)' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.feedStocks', { defaultValue: 'Stok' })}</th>
                    <th className="px-4 py-3.5 font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.deadFish', { defaultValue: 'Ölü' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.countDelta', { defaultValue: 'Delta' })}</th>
                    <th className="px-4 py-3.5 font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.biomassDelta', { defaultValue: 'Biyo Delta' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.weather', { defaultValue: 'Hava' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.netOperation', { defaultValue: 'Ağ' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.transfer', { defaultValue: 'Trans.' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.shipment', { defaultValue: 'Sevk' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.shipmentQty', { defaultValue: 'Sevk Mik.' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.projectDetailReport.stockConverts', { defaultValue: 'Dönüş.' })}</th>
                    <th className="px-4 py-3.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('aqua.dashboard.feedStatus', { defaultValue: 'Durum' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {selectedCageFromDetail?.dailyRows.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">{row.date}</td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-200 font-bold">{formatNumber(row.feedGram)}</td>
                      <td className="px-4 py-3">
                        {row.feedDetails.length > 0 ? (
                          <Button variant="outline" size="sm" className="h-7 text-[11px] font-bold bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100 dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400 dark:hover:bg-pink-500/20" onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)}>
                            {row.feedStockCount} stok
                          </Button>
                        ) : <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-rose-600 dark:text-rose-300 font-bold">{formatNumber(row.deadCount)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatNumber(row.countDelta)}</td>
                      <td className="px-4 py-3 text-pink-600 dark:text-pink-300 font-bold">{formatNumber(row.biomassDelta)}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-500 dark:text-slate-400 text-[11px]">{row.weather}</td>
                      <td className="px-4 py-3">
                        {row.netOperationCount > 0 ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-pink-600 dark:text-cyan-400 underline decoration-pink-300 dark:decoration-cyan-400/30" onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)}>
                            {row.netOperationCount}
                          </Button>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.transferCount || "-"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.shipmentCount || "-"}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">{row.shipmentFishCount > 0 ? `${formatNumber(row.shipmentFishCount)} ad.` : "-"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.stockConvertCount || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge className={row.fed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-0" : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-0"}>
                          {row.fed ? "Beslendi" : "Beslenmedi"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end shrink-0 bg-slate-50 dark:bg-white/1">
            <Button variant="outline" className="rounded-xl px-10 border-slate-300 text-slate-700 bg-white hover:bg-slate-100 dark:bg-transparent dark:border-white/10 dark:text-white dark:hover:bg-white/10" onClick={() => setIsDailyDialogOpen(false)}>Kapat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
