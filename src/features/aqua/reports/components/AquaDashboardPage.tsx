import { type MouseEvent, type ReactElement, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Fish,
  Layers,
  Skull,
  UtensilsCrossed,
  Waves,
  BarChart3,
  Droplets,
  Info,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  CalendarDays,
  Package,
  ShieldAlert,
  ArrowRightLeft,
  Truck,
  Network,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageLoader } from '@/components/shared/PageLoader';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { aquaDashboardApi } from '../api/aqua-dashboard-api';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageProjectReport, CageDailyRow } from '../types/project-detail-report-types';
import { cn } from '@/lib/utils';

const DASHBOARD_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'summaries'] as const;
const PROJECT_DETAIL_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'project-detail'] as const;
const DASHBOARD_PROJECT_SELECTION_STORAGE_KEY = 'aqua-dashboard-selected-project-ids';
const DASHBOARD_PROJECT_SELECTION_TTL_MS = 1000 * 60 * 60 * 12; // 12 saat

type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';
type ViewMode = 'card' | 'list';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
  type: DetailType;
}

interface DashboardCageSummary {
  projectCageId: number;
  cageLabel: string;
  currentFishCount: number;
  totalDeadCount: number;
  totalFeedGram: number;
  currentBiomassGram: number;
}

interface DashboardProjectSummary {
  projectId: number;
  projectCode: string;
  projectName: string;
  currentFish: number;
  activeCageCount: number;
  cages: DashboardCageSummary[];
}

interface DashboardStats {
  totalFish: number;
  totalCages: number;
  totalBio: number;
  totalFeed: number;
  totalDead: number;
}

interface ProjectDetailCage extends CageProjectReport {
  totalFeedGram: number;
  totalDeadCount: number;
  currentFishCount: number;
  currentBiomassGram: number;
  cageLabel: string;
  projectCageId: number;
}

interface ProjectDetailResponse {
  cages: ProjectDetailCage[];
}

interface PersistedProjectSelection {
  ids: number[];
  updatedAt: number;
}

interface CageCardProps {
  cage: DashboardCageSummary | ProjectDetailCage;
  onClick?: () => void;
  onQuickEntryClick?: () => void;
  isSelected?: boolean;
  clickable?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function buildStats(projects: DashboardProjectSummary[]): DashboardStats {
  return projects.reduce<DashboardStats>(
    (acc, curr) => {
      acc.totalFish += curr.currentFish;
      acc.totalCages += curr.activeCageCount;
      curr.cages.forEach((cage) => {
        acc.totalBio += cage.currentBiomassGram;
        acc.totalFeed += cage.totalFeedGram;
        acc.totalDead += cage.totalDeadCount;
      });
      return acc;
    },
    { totalFish: 0, totalCages: 0, totalBio: 0, totalFeed: 0, totalDead: 0 }
  );
}

function sortDailyRows(rows: CageDailyRow[]): CageDailyRow[] {
  return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function readPersistedProjectSelection(): number[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(DASHBOARD_PROJECT_SELECTION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedProjectSelection;
    if (!Array.isArray(parsed.ids) || typeof parsed.updatedAt !== 'number') {
      window.localStorage.removeItem(DASHBOARD_PROJECT_SELECTION_STORAGE_KEY);
      return null;
    }

    const isExpired = Date.now() - parsed.updatedAt > DASHBOARD_PROJECT_SELECTION_TTL_MS;
    if (isExpired) {
      window.localStorage.removeItem(DASHBOARD_PROJECT_SELECTION_STORAGE_KEY);
      return null;
    }

    return parsed.ids.filter((id): id is number => Number.isInteger(id));
  } catch {
    window.localStorage.removeItem(DASHBOARD_PROJECT_SELECTION_STORAGE_KEY);
    return null;
  }
}

function persistProjectSelection(ids: number[]): void {
  if (typeof window === 'undefined') return;

  const payload: PersistedProjectSelection = {
    ids,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(DASHBOARD_PROJECT_SELECTION_STORAGE_KEY, JSON.stringify(payload));
}

function getDateParts(date: string): { day: string; month: string; year: string } {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return { day: date, month: '', year: '' };
  }

  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(parsed);
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(parsed).toUpperCase();
  const year = new Intl.DateTimeFormat('tr-TR', { year: 'numeric' }).format(parsed);

  return { day, month, year };
}

function getDetailTypeIcon(type: DetailType): ReactElement {
  if (type === 'feeding') return <Package className="size-4" />;
  if (type === 'netOperation') return <Network className="size-4" />;
  if (type === 'transfer') return <ArrowRightLeft className="size-4" />;
  if (type === 'stockConvert') return <Layers className="size-4" />;
  return <Truck className="size-4" />;
}

function CageSkeleton(): ReactElement {
  return (
    <div className="border-2 border-slate-100 dark:border-cyan-800/20 rounded-3xl min-h-[210px] animate-pulse bg-slate-50/50 dark:bg-blue-900/10 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="h-9 w-9 bg-slate-200 dark:bg-cyan-800/30 rounded-2xl" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-cyan-800/30 rounded-md" />
        </div>
        <div className="h-7 w-16 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="h-16 bg-slate-200 dark:bg-cyan-800/30 rounded-2xl" />
        <div className="h-16 bg-slate-200 dark:bg-cyan-800/30 rounded-2xl" />
        <div className="col-span-2 h-16 bg-slate-200 dark:bg-cyan-800/30 rounded-2xl" />
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-cyan-800/30 rounded-full" />
    </div>
  );
}

function CageCard({ cage, onClick, onQuickEntryClick, isSelected = false, clickable = false, t }: CageCardProps): ReactElement {
  const totalInitial = cage.currentFishCount + cage.totalDeadCount;
  const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
  const isCritical = survivalRate < 80;
  const isWarning = survivalRate >= 80 && survivalRate < 95;

  return (
    <Card
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (!onClick) return;
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'relative overflow-hidden border-2 transition-all duration-300 min-h-[210px] flex flex-col bg-white shadow-sm dark:bg-blue-950/40 dark:backdrop-blur-xl group',
        isSelected
          ? 'border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,0.15),0_18px_40px_rgba(6,182,212,0.18)] dark:border-cyan-500/70 scale-[1.02]'
          : isCritical
            ? 'border-rose-300 shadow-[0_0_0_1px_rgba(244,63,94,0.08),0_18px_40px_rgba(244,63,94,0.10)] dark:border-rose-500/40'
            : 'border-slate-200 dark:border-cyan-800/30 hover:border-cyan-400 dark:hover:border-cyan-500/50',
        clickable && 'cursor-pointer hover:shadow-xl dark:hover:shadow-cyan-900/20 hover:-translate-y-1'
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1.5',
          isCritical
            ? 'bg-linear-to-r from-rose-500 via-orange-500 to-amber-400'
            : isWarning
              ? 'bg-linear-to-r from-amber-400 via-yellow-400 to-emerald-400'
              : 'bg-linear-to-r from-cyan-500 via-blue-500 to-pink-500'
        )}
      />

      {isCritical && <div className="absolute inset-0 pointer-events-none bg-rose-500/[0.04] dark:bg-rose-500/[0.06]" />}

      <div className="flex flex-col h-full z-10 relative">
        <div
          className={cn(
            'absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-full border shadow-sm z-20 backdrop-blur-md',
            isCritical
              ? 'bg-rose-100/90 border-rose-300 text-rose-600 dark:bg-rose-500/20 dark:border-rose-500/50 dark:text-rose-400'
              : isWarning
                ? 'bg-amber-100/90 border-amber-300 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-amber-400'
                : 'bg-emerald-100/90 border-emerald-300 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-emerald-400'
          )}
        >
          {isCritical ? (
            <ShieldAlert size={14} strokeWidth={3} />
          ) : isWarning ? (
            <AlertTriangle size={14} strokeWidth={3} />
          ) : (
            <CheckCircle2 size={14} strokeWidth={3} />
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-4 py-3 pr-12">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-colors',
              isSelected
                ? 'bg-cyan-500 border-cyan-400 text-white'
                : isCritical
                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-white dark:bg-blue-900 border-slate-200 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-400'
            )}
          >
            <Waves className="size-4" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-[13px] text-slate-900 dark:text-white tracking-tight truncate">
              {cage.cageLabel}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Fish size={10} /> {formatNumber(cage.currentFishCount)} {t('aquaDashboard.cageCard.fishUnit', { ns: 'dashboard' })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 flex-1">
          <div
            className={cn(
              'flex flex-col justify-center gap-1 rounded-2xl border p-3',
              isCritical
                ? 'bg-rose-50/80 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'
                : 'bg-slate-50 dark:bg-blue-900/10 border-slate-100 dark:border-cyan-800/20'
            )}
          >
            <div className="flex items-center gap-1.5">
              <Skull className="size-3 text-rose-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                {t('aquaDashboard.cageCard.totalDead', { ns: 'dashboard' })}
              </p>
            </div>
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums truncate">
              {formatNumber(cage.totalDeadCount)}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-1 rounded-2xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-3">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="size-3 text-amber-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                {t('aquaDashboard.cageCard.feed', { ns: 'dashboard' })}
              </p>
            </div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums truncate">
              {formatNumber(cage.totalFeedGram)}
              <span className="text-[9px] ml-0.5 font-bold">g</span>
            </p>
          </div>

          <div className="col-span-2 flex flex-col justify-center gap-1 rounded-2xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-3">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-blue-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                {t('aquaDashboard.cageCard.biomass', { ns: 'dashboard' })}
              </p>
            </div>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums truncate">
              {formatNumber(cage.currentBiomassGram)}
              <span className="text-[10px] ml-1 font-bold">g</span>
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {onQuickEntryClick && (
            <Button
              type="button"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onQuickEntryClick();
              }}
              className="w-full h-9 rounded-xl bg-linear-to-r from-cyan-500 via-blue-500 to-orange-400 text-white font-black text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-600 hover:via-blue-600 hover:to-orange-500"
            >
              {t('aquaDashboard.cageCard.quickDailyEntry', { ns: 'dashboard', defaultValue: 'Hızlı Giriş' })}
            </Button>
          )}
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t('aquaDashboard.cageCard.survivalRate', { ns: 'dashboard' })}
            </span>
            <span
              className={cn(
                'text-[10px] font-black',
                isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
              )}
            >
              %{survivalRate.toFixed(1)}
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 dark:bg-cyan-950/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-out rounded-full',
                isCritical
                  ? 'bg-linear-to-r from-rose-500 via-orange-500 to-amber-400'
                  : isWarning
                    ? 'bg-linear-to-r from-amber-400 via-yellow-400 to-emerald-400'
                    : 'bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500'
              )}
              style={{ width: `${Math.min(Math.max(survivalRate, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AquaDashboardPage(): ReactElement {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();

  const [activeDashboardProjectIds, setActiveDashboardProjectIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
    type: 'feeding',
  });
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [draftProjectIds, setDraftProjectIds] = useState<number[]>([]);

  const hasInitialized = useRef(false);

  const summariesQuery = useQuery<DashboardProjectSummary[]>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: aquaDashboardApi.getActiveProjectSummaries,
    staleTime: 60_000,
  });

  const summaries = summariesQuery.data ?? [];

  useEffect(() => {
    if (summaries.length > 0 && !hasInitialized.current) {
      const persistedIds = readPersistedProjectSelection();
      const validPersistedIds = (persistedIds ?? []).filter((id) => summaries.some((project) => project.projectId === id));

      if (validPersistedIds.length > 0) {
        setActiveDashboardProjectIds(validPersistedIds);
      } else {
        setActiveDashboardProjectIds([]);
      }

      hasInitialized.current = true;
    }
  }, [summaries]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    persistProjectSelection(activeDashboardProjectIds);
  }, [activeDashboardProjectIds]);

  const globalStats = useMemo(() => buildStats(summaries), [summaries]);

  const activeProjects = useMemo(() => {
    return summaries.filter((project) => activeDashboardProjectIds.includes(project.projectId));
  }, [summaries, activeDashboardProjectIds]);

  const selectedProjectSummaries = useMemo(() => {
    return summaries.filter((project) => activeDashboardProjectIds.includes(project.projectId));
  }, [summaries, activeDashboardProjectIds]);

  const draftSelectedProjectSummaries = useMemo(() => {
    return summaries.filter((project) => draftProjectIds.includes(project.projectId));
  }, [summaries, draftProjectIds]);

  const filteredProjects = useMemo(() => {
    const search = projectSearch.trim().toLocaleLowerCase('tr-TR');
    if (!search) return summaries;

    return summaries.filter((project) => {
      const code = project.projectCode.toLocaleLowerCase('tr-TR');
      const name = project.projectName.toLocaleLowerCase('tr-TR');
      return code.includes(search) || name.includes(search);
    });
  }, [summaries, projectSearch]);

  const detailQuery = useQuery<ProjectDetailResponse>({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, selectedProjectId],
    queryFn: () => projectDetailReportApi.getProjectDetailReport(selectedProjectId as number),
    enabled: selectedProjectId != null,
    staleTime: 60_000,
  });

  const detailCages = detailQuery.data?.cages ?? [];

  const selectedCageFromDetail = useMemo(() => {
    if (!selectedCageId) return null;
    return detailCages.find((cage) => cage.projectCageId === selectedCageId) ?? null;
  }, [detailCages, selectedCageId]);

  const selectedCageDailyRows = useMemo<CageDailyRow[]>(() => {
    if (!selectedCageFromDetail?.dailyRows) return [];
    return sortDailyRows(selectedCageFromDetail.dailyRows);
  }, [selectedCageFromDetail]);

  const maxDeadInCage = useMemo(() => {
    if (selectedCageDailyRows.length === 0) return 0;
    return Math.max(...selectedCageDailyRows.map((row) => row.deadCount));
  }, [selectedCageDailyRows]);

  const openProjectDetail = useCallback((projectId: number, cageId?: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(cageId ?? null);
    setIsProjectDialogOpen(true);
  }, []);

  const openCageDailyDialog = useCallback((projectCageId: number): void => {
    setSelectedCageId(projectCageId);
    setIsDailyDialogOpen(true);
  }, []);

  const openDailyFromProjectList = useCallback((projectId: number, projectCageId: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(projectCageId);
    setIsProjectDialogOpen(false);
    setIsDailyDialogOpen(true);
  }, []);

  const closeProjectDialog = useCallback((open: boolean): void => {
    setIsProjectDialogOpen(open);
    if (!open) {
      setSelectedCageId(null);
    }
  }, []);

  const closeDailyDialog = useCallback((open: boolean): void => {
    setIsDailyDialogOpen(open);
    if (!open) {
      setDetailDialog((prev) => ({ ...prev, open: false }));
    }
  }, []);

  const openProjectSelector = useCallback((): void => {
    setDraftProjectIds(activeDashboardProjectIds);
    setProjectSearch('');
    setIsProjectSelectorOpen(true);
  }, [activeDashboardProjectIds]);

  const closeProjectSelector = useCallback((open: boolean): void => {
    setIsProjectSelectorOpen(open);
    if (!open) {
      setProjectSearch('');
    }
  }, []);

  const toggleDraftProjectSelection = useCallback((projectId: number): void => {
    setDraftProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  }, []);

  const applyProjectSelection = useCallback((): void => {
    setActiveDashboardProjectIds(draftProjectIds);
    setIsProjectSelectorOpen(false);
    setProjectSearch('');
  }, [draftProjectIds]);

  const removeSelectedProject = useCallback((projectId: number): void => {
    setActiveDashboardProjectIds((prev) => prev.filter((id) => id !== projectId));
  }, []);

  const openDetailDialog = useCallback(
    (cage: { cageLabel: string }, type: DetailType): ((date: string, items: string[]) => void) => {
      const titleMap: Record<DetailType, string> = {
        feeding: t('aquaDashboard.detailTypes.feeding', { ns: 'dashboard' }),
        netOperation: t('aquaDashboard.detailTypes.netOperation', { ns: 'dashboard' }),
        transfer: t('aquaDashboard.detailTypes.transfer', { ns: 'dashboard' }),
        stockConvert: t('aquaDashboard.detailTypes.stockConvert', { ns: 'dashboard' }),
        shipment: t('aquaDashboard.detailTypes.shipment', { ns: 'dashboard' }),
      };

      return (date: string, items: string[]) => {
        if (items.length === 0) return;
        setDetailDialog({
          open: true,
          title: `${titleMap[type]} - ${cage.cageLabel}`,
          description: t('aquaDashboard.detailDialog.date', { ns: 'dashboard', date }),
          items,
          type,
        });
      };
    },
    [t]
  );

  if (summariesQuery.isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:gap-5 px-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20 shrink-0">
                <Droplets className="size-6" />
              </div>
              <span className="truncate">{t('aquaDashboard.title', { ns: 'dashboard' })}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium ml-1">
              {t('aquaDashboard.description', { ns: 'dashboard' })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:self-auto">
            <div className="relative flex bg-slate-200/60 dark:bg-blue-950 p-1 rounded-2xl border border-slate-200 dark:border-cyan-800/50 h-11 items-center overflow-hidden w-full sm:min-w-[220px] sm:w-auto">
              <div
                className={cn(
                  'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white dark:bg-cyan-500 shadow-sm transition-all duration-300',
                  viewMode === 'card' ? 'left-1' : 'left-[calc(50%+3px)]'
                )}
              />
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={cn(
                  'relative z-10 flex-1 h-full rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all min-w-0',
                  viewMode === 'card'
                    ? 'text-cyan-600 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300'
                )}
              >
                <LayoutGrid size={14} />
                <span className="truncate">{t('aquaDashboard.controls.cardView', { ns: 'dashboard' })}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'relative z-10 flex-1 h-full rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all min-w-0',
                  viewMode === 'list'
                    ? 'text-cyan-600 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300'
                )}
              >
                <List size={14} />
                <span className="truncate">{t('aquaDashboard.controls.listView', { ns: 'dashboard' })}</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={openProjectSelector}
              className="h-11 rounded-2xl px-4 sm:px-5 bg-white/80 dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/50 shadow-sm hover:shadow-lg dark:hover:border-cyan-600 w-full sm:w-auto justify-center"
            >
              <Filter className="size-4 mr-2 shrink-0" />
              <span className="truncate">{t('aquaDashboard.projectSelector.openButton', { ns: 'dashboard' })}</span>
              <span className="ml-2 inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 text-[11px] font-black px-1.5 shrink-0">
                {activeDashboardProjectIds.length}
              </span>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white/80 dark:bg-blue-950/35 backdrop-blur-xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/15 shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {t('aquaDashboard.activeProjectFilters.title', { ns: 'dashboard' })}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('aquaDashboard.activeProjectFilters.description', { ns: 'dashboard' })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveDashboardProjectIds(summaries.map((summary) => summary.projectId))}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30"
              >
                {t('aquaDashboard.controls.selectAll', { ns: 'dashboard' })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveDashboardProjectIds([])}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              >
                {t('aquaDashboard.controls.clear', { ns: 'dashboard' })}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedProjectSummaries.length > 0 ? (
              selectedProjectSummaries.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => removeSelectedProject(project.projectId)}
                  className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-2xl bg-linear-to-r from-pink-500/10 via-white to-cyan-500/5 dark:from-pink-500/15 dark:via-blue-950 dark:to-cyan-500/10 border border-pink-500/15 text-slate-800 dark:text-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                    <span className="text-[11px] font-black text-pink-600 dark:text-pink-300 shrink-0">{project.projectCode}</span>
                    <span className="text-[12px] font-semibold truncate max-w-[120px] sm:max-w-[180px]">{project.projectName}</span>
                  </span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-500 dark:text-slate-300 shrink-0">
                    <X className="size-3.5" />
                  </span>
                </button>
              ))
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-blue-900/30 border border-slate-200 dark:border-cyan-800/40 text-slate-500 dark:text-slate-400 text-[12px] font-bold">
                <Info className="size-4" />
                {t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <Activity className="size-5 text-cyan-500 shrink-0" />
          {t('aquaDashboard.facilitySummary', { ns: 'dashboard' })}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              label: t('aquaDashboard.stats.activeCages', { ns: 'dashboard' }),
              val: globalStats.totalCages,
              icon: Waves,
              color: 'text-cyan-600 dark:text-cyan-400',
              bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-800/30',
            },
            {
              label: t('aquaDashboard.stats.liveFish', { ns: 'dashboard' }),
              val: globalStats.totalFish,
              icon: Fish,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/30',
            },
            {
              label: t('aquaDashboard.stats.totalBiomass', { ns: 'dashboard' }),
              val: `${formatNumber(globalStats.totalBio)}g`,
              icon: Layers,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-800/30',
            },
            {
              label: t('aquaDashboard.stats.totalFeed', { ns: 'dashboard' }),
              val: `${formatNumber(globalStats.totalFeed)}g`,
              icon: UtensilsCrossed,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/30',
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-white dark:bg-blue-950/60 border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-3xl overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                      {typeof stat.val === 'number' ? formatNumber(stat.val) : stat.val}
                    </h3>
                  </div>
                  <div className={cn('p-3 rounded-2xl border shrink-0', stat.bg, stat.color)}>
                    <stat.icon className="size-5 sm:size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-2 sm:pt-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <Layers className="size-5 text-pink-500 shrink-0" />
          {t('aquaDashboard.selectedProjects', { ns: 'dashboard' })}
        </h2>

        {summariesQuery.isError ? (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 rounded-3xl">
            <CardContent className="py-12 text-sm font-bold text-rose-600 dark:text-rose-400 text-center flex items-center justify-center gap-2">
              <Info className="size-5" /> {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
            </CardContent>
          </Card>
        ) : activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <Card
              key={project.projectId}
              className="border border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md"
            >
              <div className="h-1.5 w-full bg-linear-to-r from-pink-500 via-cyan-500 to-blue-500" />
              <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-4 sm:px-6 py-5 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0 flex-1 cursor-pointer group" onClick={() => openProjectDetail(project.projectId)}>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-start sm:items-center gap-3 min-w-0">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse mt-1 sm:mt-0" />
                      <span className="truncate group-hover:text-cyan-500 transition-colors min-w-0">
                        {project.projectCode} - {project.projectName}
                      </span>
                    </CardTitle>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/10 text-[11px] font-black">
                        <Waves className="size-3.5" />
                        {formatNumber(project.activeCageCount)}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/10 text-[11px] font-black">
                        <Fish className="size-3.5" />
                        {formatNumber(project.currentFish)}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="bg-linear-to-r from-pink-600 to-orange-600 text-white h-10 px-4 sm:px-6 rounded-2xl font-black shadow-lg shadow-pink-500/20 border-0 transition-transform hover:scale-105 w-full sm:w-auto justify-center shrink-0"
                    onClick={() => openProjectDetail(project.projectId)}
                  >
                    <BarChart3 className="size-4 mr-2 shrink-0" />
                    <span className="truncate">{t('aquaDashboard.detailReportButton', { ns: 'dashboard' })}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 lg:p-6 bg-transparent">
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {project.cages.map((cage) => (
                      <CageCard
                        key={cage.projectCageId}
                        cage={cage}
                        clickable
                        onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)}
                        onQuickEntryClick={() =>
                          navigate(
                            `/aqua/operations/quick-daily-entry?projectId=${project.projectId}&projectCageId=${cage.projectCageId}`
                          )
                        }
                        t={t}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-cyan-800/30 rounded-3xl bg-white dark:bg-blue-950/20">
                    <table className="w-full min-w-[860px] text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-blue-900/40 text-slate-500 dark:text-cyan-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-cyan-800/30">
                        <tr>
                          <th className="px-5 py-4 whitespace-nowrap">{t('aquaDashboard.listTable.cage', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.fish', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-rose-500 whitespace-nowrap">{t('aquaDashboard.listTable.dead', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-amber-500 whitespace-nowrap">{t('aquaDashboard.listTable.feed', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-blue-500 whitespace-nowrap">{t('aquaDashboard.listTable.biomass', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.survivalRate', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-right whitespace-nowrap">{t('aquaDashboard.listTable.action', { ns: 'dashboard' })}</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-cyan-800/20">
                        {project.cages.map((cage) => {
                          const totalInitial = cage.currentFishCount + cage.totalDeadCount;
                          const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
                          const isCritical = survivalRate < 80;

                          return (
                            <tr
                              key={cage.projectCageId}
                              className={cn(
                                'hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer',
                                isCritical && 'bg-rose-50/40 dark:bg-rose-500/[0.04]'
                              )}
                              onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)}
                            >
                              <td className="px-5 py-3 font-extrabold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'p-1.5 rounded-xl',
                                      isCritical ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-cyan-100 dark:bg-cyan-900/50'
                                    )}
                                  >
                                    <Waves size={14} className={cn(isCritical ? 'text-rose-500' : 'text-cyan-600 dark:text-cyan-400')} />
                                  </div>
                                  {cage.cageLabel}
                                </div>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatNumber(cage.currentFishCount)}
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                {formatNumber(cage.totalDeadCount)}
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                {formatNumber(cage.totalFeedGram)}
                                <span className="text-[10px] ml-0.5">g</span>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                {formatNumber(cage.currentBiomassGram)}
                                <span className="text-[10px] ml-0.5">g</span>
                              </td>

                              <td className="px-5 py-3 text-center">
                                <span
                                  className={cn(
                                    'font-black text-[11px] px-2.5 py-1.5 rounded-xl border',
                                    survivalRate < 80
                                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                                      : survivalRate < 95
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                  )}
                                >
                                  %{survivalRate.toFixed(1)}
                                </span>
                              </td>

                              <td className="px-5 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-4 text-xs font-black text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  {t('aquaDashboard.listTable.dailyFlowButton', { ns: 'dashboard' })}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-white border-slate-200 dark:border-cyan-800/20 dark:bg-blue-950/40 dark:backdrop-blur-xl rounded-3xl">
            <CardContent className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
              <Activity className="size-16 mx-auto mb-4 text-slate-300 dark:text-cyan-900/50" />
              {t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isProjectSelectorOpen} onOpenChange={closeProjectSelector}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[520px] border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950 p-0"
        >
          <SheetHeader className="px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-linear-to-br from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 text-left">
            <div className="flex items-start gap-3 pr-8">
              <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/15 shrink-0">
                <Sparkles className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white break-words leading-tight">
                  {t('aquaDashboard.projectSelector.title', { ns: 'dashboard' })}
                </SheetTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                  {t('aquaDashboard.projectSelector.description', { ns: 'dashboard' })}
                </p>
              </div>
            </div>

            <div className="mt-4 relative">
              <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder={t('aquaDashboard.projectSelector.searchPlaceholder', { ns: 'dashboard' })}
                className="h-11 rounded-2xl pl-11 pr-4 bg-white dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraftProjectIds(summaries.map((summary) => summary.projectId))}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30"
              >
                {t('aquaDashboard.controls.selectAll', { ns: 'dashboard' })}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraftProjectIds([])}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              >
                {t('aquaDashboard.controls.clear', { ns: 'dashboard' })}
              </Button>

              <div className="w-full sm:w-auto sm:ml-auto inline-flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-100 dark:bg-blue-900/30 border border-slate-200 dark:border-cyan-800/30 text-[11px] font-black text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Check className="size-3" />
                  {t('aquaDashboard.projectSelector.selectedCount', {
                    ns: 'dashboard',
                    count: draftProjectIds.length,
                  })}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {draftSelectedProjectSummaries.length > 0 ? (
                <>
                  {draftSelectedProjectSummaries.slice(0, 3).map((project) => (
                    <button
                      key={project.projectId}
                      type="button"
                      onClick={() => toggleDraftProjectSelection(project.projectId)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 dark:bg-pink-500/15 border border-pink-500/15 text-pink-700 dark:text-pink-300 text-[11px] font-black max-w-[110px]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                      <span className="truncate">{project.projectCode}</span>
                      <X className="size-3.5 shrink-0" />
                    </button>
                  ))}

                  {draftSelectedProjectSummaries.length > 3 && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[11px] font-black">
                      +{draftSelectedProjectSummaries.length - 3}
                    </div>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-blue-900/30 border border-slate-200 dark:border-cyan-800/40 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                  <Info className="size-3.5 shrink-0" />
                  {t('aquaDashboard.projectSelector.emptySelection', { ns: 'dashboard' })}
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[calc(100dvh-240px)]">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const isActive = draftProjectIds.includes(project.projectId);

                return (
                  <button
                    key={project.projectId}
                    type="button"
                    onClick={() => toggleDraftProjectSelection(project.projectId)}
                    className={cn(
                      'w-full text-left rounded-3xl border p-4 transition-all group',
                      isActive
                        ? 'border-pink-400/60 bg-linear-to-r from-pink-500/10 via-white to-cyan-500/5 dark:from-pink-500/15 dark:via-blue-950 dark:to-cyan-500/10 shadow-[0_10px_30px_rgba(236,72,153,0.10)]'
                        : 'border-slate-200 dark:border-cyan-800/30 bg-slate-50/60 dark:bg-blue-950/30 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-white dark:hover:bg-blue-900/30'
                    )}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={cn(
                          'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-all',
                          isActive
                            ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                            : 'bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400'
                        )}
                      >
                        {isActive ? <Check className="size-4" strokeWidth={3} /> : <Layers className="size-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-cyan-600 mb-1">
                              {project.projectCode}
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 break-words">
                              {project.projectName}
                            </p>
                          </div>

                          {isActive && (
                            <Badge className="shrink-0 rounded-xl px-2 py-1 bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 border border-pink-500/15 font-black text-[10px]">
                              {t('aquaDashboard.projectSelector.activeBadge', { ns: 'dashboard' })}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/10 text-[11px] font-black">
                            <Waves className="size-3.5 shrink-0" />
                            {formatNumber(project.activeCageCount)}
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/10 text-[11px] font-black">
                            <Fish className="size-3.5 shrink-0" />
                            {formatNumber(project.currentFish)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/60 dark:bg-blue-950/30 p-8 text-center">
                <Info className="size-10 mx-auto mb-4 text-slate-300 dark:text-cyan-900/60" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  {t('aquaDashboard.projectSelector.noResults', { ns: 'dashboard' })}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-cyan-800/20 bg-white dark:bg-blue-950 px-4 sm:px-6 py-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsProjectSelectorOpen(false);
                setProjectSearch('');
              }}
              className="h-11 rounded-2xl px-5 w-full sm:w-auto"
            >
             {t('aqua.common.cancel', { ns: 'common' })}
            </Button>

            <Button
              type="button"
              onClick={applyProjectSelection}
              className="h-11 rounded-2xl px-6 bg-linear-to-r from-pink-600 to-orange-600 text-white font-black shadow-lg shadow-pink-500/20 w-full sm:w-auto"
            >
              {t('aquaDashboard.projectSelector.apply', { ns: 'dashboard' })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDailyDialogOpen} onOpenChange={closeDailyDialog}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] lg:!w-[1200px] !max-w-[96vw] xl:!max-w-[1300px] max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 shadow-2xl rounded-[24px] sm:rounded-[28px] flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-200 dark:border-cyan-800/30 bg-linear-to-r from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shrink-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="h-full w-full bg-white dark:bg-blue-950 rounded-[14px] flex items-center justify-center">
                    <Waves className="size-6 text-cyan-600 dark:text-cyan-500" />
                  </div>
                </div>

                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {selectedCageFromDetail?.cageLabel ?? '-'}
                  </DialogTitle>
                  <p className="text-cyan-600 dark:text-cyan-400 text-sm font-bold flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                    <span className="truncate">{t('aquaDashboard.dailyFlow', { ns: 'dashboard' })}</span>
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            {detailQuery.isLoading ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400 font-semibold">
                  <PageLoader />
                </div>
              </div>
            ) : !selectedCageFromDetail ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <Info className="size-10 mb-4 text-slate-300 dark:text-cyan-900/60" />
                  <span className="font-semibold">{t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}</span>
                </div>
              </div>
            ) : selectedCageDailyRows.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <Activity className="size-10 mb-4 text-slate-300 dark:text-cyan-900/60" />
                  <span className="font-semibold">{t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}</span>
                </div>
              </div>
            ) : (
              <div className="relative pl-0 sm:pl-4">
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-linear-to-b from-cyan-300 via-cyan-200 to-transparent dark:from-cyan-700 dark:via-cyan-900 hidden sm:block" />

                <div className="space-y-4">
                  {selectedCageDailyRows.map((row, index) => {
                    const prevRow = selectedCageDailyRows[index + 1];
                    const deadDiff = prevRow ? row.deadCount - prevRow.deadCount : 0;
                    const feedDiff = prevRow ? row.feedGram - prevRow.feedGram : 0;
                    const isHighDead = row.deadCount > 0 && maxDeadInCage > 5 && row.deadCount >= maxDeadInCage * 0.7;
                    const dateParts = getDateParts(row.date);
                    const hasFeedDetails = row.feedDetails.length > 0;
                    const hasNetDetails = row.netOperationCount > 0;
                    const hasTransferDetails = (row.transferCount ?? 0) > 0 && (row.transferDetails?.length ?? 0) > 0;
                    const hasShipmentDetails = (row.shipmentCount ?? 0) > 0 && (row.shipmentDetails?.length ?? 0) > 0;
                    const hasStockConvertDetails = (row.stockConvertCount ?? 0) > 0 && (row.stockConvertDetails?.length ?? 0) > 0;

                    return (
                      <div key={`${row.date}-${index}`} className="relative sm:pl-12">
                        <div
                          className={cn(
                            'hidden sm:flex absolute left-0 top-6 size-11 rounded-2xl border items-center justify-center shadow-sm z-10',
                            isHighDead
                              ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                              : 'bg-white dark:bg-blue-950 text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-cyan-800/40'
                          )}
                        >
                          <CalendarDays className="size-5" />
                        </div>

                        <div
                          className={cn(
                            'rounded-[24px] sm:rounded-[28px] border bg-white dark:bg-blue-950/45 shadow-sm overflow-hidden transition-all',
                            isHighDead
                              ? 'border-rose-300 dark:border-rose-500/40 shadow-[0_20px_40px_rgba(244,63,94,0.10)]'
                              : 'border-slate-200 dark:border-cyan-800/30 hover:shadow-md'
                          )}
                        >
                          <div
                            className={cn(
                              'h-1.5 w-full',
                              isHighDead
                                ? 'bg-linear-to-r from-rose-500 via-orange-500 to-amber-400'
                                : row.fed
                                  ? 'bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500'
                                  : 'bg-linear-to-r from-slate-300 via-slate-200 to-slate-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900'
                            )}
                          />

                          <div className="p-4 sm:p-5 lg:p-6">
                            <div className="flex flex-col gap-5">
                              <div className="flex items-start gap-4 min-w-0">
                                <div
                                  className={cn(
                                    'sm:hidden flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 min-w-[68px]',
                                    isHighDead
                                      ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-blue-900/20 dark:border-cyan-800/30 dark:text-slate-200'
                                  )}
                                >
                                  <span className="text-lg font-black leading-none">{dateParts.day}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{dateParts.month}</span>
                                </div>

                                <div className="hidden sm:flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 min-w-[78px] bg-slate-50 dark:bg-blue-900/20 border-slate-200 dark:border-cyan-800/30">
                                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{dateParts.day}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mt-1">{dateParts.month}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">{dateParts.year}</span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white break-words min-w-0">
                                      {row.date}
                                    </h3>

                                    {isHighDead && (
                                      <Badge className="rounded-xl px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-500/15 font-black text-[10px]">
                                        {t('aquaDashboard.dailyTable.criticalDay', { ns: 'dashboard' })}
                                      </Badge>
                                    )}

                                    <Badge
                                      className={cn(
                                        'rounded-xl px-2.5 py-1 border font-black text-[10px]',
                                        row.fed
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/15'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      )}
                                    >
                                      {row.fed
                                        ? t('aquaDashboard.dailyTable.fed', { ns: 'dashboard' })
                                        : t('aquaDashboard.dailyTable.notFed', { ns: 'dashboard' })}
                                    </Badge>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                                    <div className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-blue-900/20 border border-slate-200 dark:border-cyan-800/30">
                                      <CalendarDays className="size-3.5 shrink-0" />
                                      <span className="truncate">{row.weather || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 w-full min-w-0">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                                    <UtensilsCrossed className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.feed', { ns: 'dashboard' })}
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums truncate">
                                      {formatNumber(row.feedGram)}g
                                    </span>
                                    {feedDiff !== 0 &&
                                      (feedDiff > 0 ? (
                                        <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                                      ) : (
                                        <TrendingDown size={13} className="text-rose-500 shrink-0" />
                                      ))}
                                  </div>
                                </div>

                                <div
                                  className={cn(
                                    'rounded-2xl border p-3 min-w-0',
                                    isHighDead
                                      ? 'border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
                                      : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5'
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">
                                    <Skull className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.dead', { ns: 'dashboard' })}
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-black text-rose-700 dark:text-rose-300 tabular-nums truncate">
                                      {formatNumber(row.deadCount)}
                                    </span>
                                    {deadDiff !== 0 &&
                                      (deadDiff > 0 ? (
                                        <TrendingUp size={13} className="text-rose-500 shrink-0" />
                                      ) : (
                                        <TrendingDown size={13} className="text-emerald-500 shrink-0" />
                                      ))}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-cyan-800/30 dark:bg-blue-900/10 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                    <Fish className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.delta', { ns: 'dashboard' })}
                                  </div>
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums truncate block">
                                    {formatNumber(row.countDelta)}
                                  </span>
                                </div>

                                <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                                    <Layers className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.biomass', { ns: 'dashboard' })}
                                  </div>
                                  <span className="text-sm font-black text-blue-700 dark:text-blue-300 tabular-nums truncate block">
                                    {formatNumber(row.biomassDelta)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                    <Package className="size-4 text-cyan-500 shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-widest truncate">
                                      {t('aquaDashboard.dailySections.feedStocks', { ns: 'dashboard' })}
                                    </span>
                                  </div>
                                  <Badge className="rounded-xl px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-cyan-500/15 text-[10px] font-black shrink-0">
                                    {row.feedStockCount}
                                  </Badge>
                                </div>

                                <div className="mt-3">
                                  {hasFeedDetails ? (
                                    <button
                                      type="button"
                                      onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)}
                                      className="w-full h-10 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                    >
                                      <span className="block truncate w-full">
                                        {t('aquaDashboard.dailyTable.stockCount', {
                                          ns: 'dashboard',
                                          count: row.feedStockCount,
                                        })}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                      -
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                    <Network className="size-4 text-cyan-500 shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-widest truncate">
                                      {t('aquaDashboard.dailySections.net', { ns: 'dashboard' })}
                                    </span>
                                  </div>
                                  <Badge className="rounded-xl px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-cyan-500/15 text-[10px] font-black shrink-0">
                                    {row.netOperationCount}
                                  </Badge>
                                </div>

                                <div className="mt-3">
                                  {hasNetDetails ? (
                                    <button
                                      type="button"
                                      onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)}
                                      className="w-full h-10 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                    >
                                      <span className="block truncate w-full">
                                        {t('aquaDashboard.dailyTable.operationCount', {
                                          ns: 'dashboard',
                                          count: row.netOperationCount,
                                        })}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                      -
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                    <ArrowRightLeft className="size-4 text-pink-500 shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-widest truncate">
                                      {t('aquaDashboard.dailySections.transfer', { ns: 'dashboard' })}
                                    </span>
                                  </div>
                                  <Badge className="rounded-xl px-2 py-1 bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 border border-pink-500/15 text-[10px] font-black shrink-0">
                                    {row.transferCount || 0}
                                  </Badge>
                                </div>

                                <div className="mt-3">
                                  {hasTransferDetails ? (
                                    <button
                                      type="button"
                                      onClick={() => openDetailDialog(selectedCageFromDetail, 'transfer')(row.date, row.transferDetails ?? [])}
                                      className="w-full h-10 rounded-2xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/15 text-pink-700 dark:text-pink-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                    >
                                      <span className="block truncate w-full">
                                        {t('aquaDashboard.dailyTable.operationCount', {
                                          ns: 'dashboard',
                                          count: row.transferCount || 0,
                                        })}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                      {row.transferCount || '-'}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                    <Truck className="size-4 text-amber-500 shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-widest truncate">
                                      {t('aquaDashboard.dailySections.shipment', { ns: 'dashboard' })}
                                    </span>
                                  </div>
                                  <Badge className="rounded-xl px-2 py-1 bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/15 text-[10px] font-black shrink-0">
                                    {row.shipmentCount || 0}
                                  </Badge>
                                </div>

                                <div className="mt-3">
                                  {hasShipmentDetails ? (
                                    <button
                                      type="button"
                                      onClick={() => openDetailDialog(selectedCageFromDetail, 'shipment')(row.date, row.shipmentDetails ?? [])}
                                      className="w-full h-10 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                    >
                                      <span className="block truncate w-full">
                                        {t('aquaDashboard.dailyTable.operationCount', {
                                          ns: 'dashboard',
                                          count: row.shipmentCount || 0,
                                        })}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                      {row.shipmentCount || '-'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {hasStockConvertDetails && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => openDetailDialog(selectedCageFromDetail, 'stockConvert')(row.date, row.stockConvertDetails ?? [])}
                                  className="inline-flex max-w-full items-center gap-2 px-4 h-10 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-black transition-colors overflow-hidden"
                                >
                                  <Layers className="size-4 shrink-0" />
                                  <span className="truncate">
                                    {t('aquaDashboard.dailyTable.operationCount', {
                                      ns: 'dashboard',
                                      count: row.stockConvertCount || 0,
                                    })}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-950 flex justify-end">
            <button
              type="button"
              onClick={() => setIsDailyDialogOpen(false)}
              className="w-full sm:w-auto px-10 py-2.5 bg-linear-to-r from-pink-600 to-orange-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              {t('aqua.common.cancel', { ns: 'common' })}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isProjectDialogOpen} onOpenChange={closeProjectDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[95vw] max-w-4xl max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-[24px] sm:rounded-[30px] shadow-2xl flex flex-col outline-none">
          <DialogHeader className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 shrink-0">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 shrink-0">
                <BarChart3 className="size-5" />
              </div>
              <span className="truncate min-w-0">
                {summaries.find((project) => project.projectId === selectedProjectId)
                  ? `${summaries.find((project) => project.projectId === selectedProjectId)?.projectCode} - ${summaries.find((project) => project.projectId === selectedProjectId)?.projectName}`
                  : '-'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80 mb-1">
                  {t('aquaDashboard.projectDialog.fish', { ns: 'dashboard' })}
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 truncate tabular-nums">
                  {formatNumber(detailCages.reduce((acc, cage) => acc + cage.currentFishCount, 0))}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400/80 mb-1">
                  {t('aquaDashboard.projectDialog.dead', { ns: 'dashboard' })}
                </p>
                <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 truncate tabular-nums">
                  {formatNumber(detailCages.reduce((acc, cage) => acc + cage.totalDeadCount, 0))}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400/80 mb-1">
                  {t('aquaDashboard.projectDialog.feedGram', { ns: 'dashboard' })}
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 truncate tabular-nums">
                  {formatNumber(detailCages.reduce((acc, cage) => acc + cage.totalFeedGram, 0))}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400/80 mb-1">
                  {t('aquaDashboard.projectDialog.cages', { ns: 'dashboard' })}
                </p>
                <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 truncate tabular-nums">
                  {formatNumber(detailCages.length)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 px-1">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg shrink-0">
                  <Layers className="size-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {t('aquaDashboard.projectDialog.cagePools', { ns: 'dashboard' })}
                </h3>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-blue-900/30 dark:text-slate-400 border-0 px-3 py-1 rounded-xl"
                >
                  {t('aquaDashboard.projectDialog.clickForDailyDetail', { ns: 'dashboard' })}
                </Badge>
              </div>

              {detailQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <CageSkeleton />
                  <CageSkeleton />
                </div>
              ) : detailCages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detailCages.map((cage) => (
                    <CageCard
                      key={cage.projectCageId}
                      cage={cage}
                      clickable
                      isSelected={selectedCageId === cage.projectCageId}
                      onClick={() => openCageDailyDialog(cage.projectCageId)}
                      onQuickEntryClick={() => {
                        if (!selectedProjectId) return;
                        navigate(
                          `/aqua/operations/quick-daily-entry?projectId=${selectedProjectId}&projectCageId=${cage.projectCageId}`
                        );
                      }}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-slate-200 dark:border-cyan-800/20 dark:bg-blue-950/40 rounded-3xl">
                  <CardContent className="py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
                    <Activity className="size-14 mx-auto mb-4 text-slate-300 dark:text-cyan-900/50" />
                    {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-[24px] sm:rounded-[28px] shadow-2xl flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-100 dark:border-cyan-800/20 bg-linear-to-r from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 px-4 sm:px-6 py-5 shrink-0">
            <div className="flex flex-col gap-4">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/15 shrink-0">
                  {getDetailTypeIcon(detailDialog.type)}
                </div>
                <span className="break-words">{detailDialog.title}</span>
              </DialogTitle>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30">
                  {detailDialog.description}
                </span>
                <span className="text-[10px] font-black text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-500/30">
                  {detailDialog.items.length}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 custom-scrollbar">
            {detailDialog.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailDialog.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-cyan-800/25 bg-slate-50/80 dark:bg-blue-900/10 px-4 py-4 hover:border-cyan-400/40 dark:hover:border-cyan-500/30 hover:bg-white dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="shrink-0 mt-0.5 w-7 h-7 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-[11px] font-black">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-blue-950/50 border border-slate-200 dark:border-cyan-800/20 max-w-full">
                        <span className="text-cyan-600 dark:text-cyan-300 shrink-0">{getDetailTypeIcon(detailDialog.type)}</span>
                        <span className="font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">
                          {item}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Info className="size-10 mx-auto mb-4 text-slate-300 dark:text-cyan-900/60" />
                {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}