import { type MouseEvent, type ReactElement, useEffect, useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, Fish, Layers, Skull, UtensilsCrossed, Waves, 
  BarChart3, Droplets, Info, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, ChevronDown, Check, 
  LayoutGrid, List, SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/PageLoader';
import { aquaDashboardApi } from '../api/aqua-dashboard-api';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageProjectReport } from '../types/project-detail-report-types';
import { cn } from '@/lib/utils';

const DASHBOARD_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'summaries'] as const;
const PROJECT_DETAIL_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'project-detail'] as const;
type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';

const TABLE_GRID_LAYOUT = "grid grid-cols-[120px_110px_100px_90px_90px_110px_130px_100px_90px_90px_110px] gap-4 items-center";

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function CageSkeleton(): ReactElement {
  return (
    <div className="border-2 border-slate-100 dark:border-cyan-800/20 rounded-3xl min-h-[190px] animate-pulse bg-slate-50/50 dark:bg-blue-900/10 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center"><div className="h-8 w-8 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" /><div className="h-4 w-20 bg-slate-200 dark:bg-cyan-800/30 rounded-md" /></div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-cyan-800/30 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
        <div className="h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
        <div className="col-span-2 h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
      </div>
    </div>
  );
}

function CageCard({ cage, onClick, isSelected = false, clickable = false }: any): ReactElement {
  const totalInitial = cage.currentFishCount + cage.totalDeadCount;
  const survivalRate = totalInitial > 0 ? ((cage.currentFishCount / totalInitial) * 100) : 100;
  const isCritical = survivalRate < 80;
  const isWarning = survivalRate >= 80 && survivalRate < 95;

  return (
    <Card
      onClick={(event: MouseEvent<HTMLDivElement>) => { if (!onClick) return; event.stopPropagation(); onClick(); }}
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 min-h-[190px] flex flex-col bg-white shadow-sm dark:bg-blue-950/40 dark:backdrop-blur-xl group",
        isSelected ? "border-cyan-500 shadow-lg shadow-cyan-500/10 dark:border-cyan-500/60 scale-[1.02]" : "border-slate-200 dark:border-cyan-800/30 hover:border-cyan-400 dark:hover:border-cyan-500/50",
        clickable && "cursor-pointer hover:shadow-lg dark:hover:shadow-cyan-900/20 hover:-translate-y-1"
      )}
    >
      <div className="flex flex-col h-full z-10 relative">
        <div className={cn("absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-full border shadow-sm z-20 backdrop-blur-md", isCritical ? "bg-rose-100/80 border-rose-300 text-rose-600 dark:bg-rose-500/20 dark:border-rose-500/50 dark:text-rose-400" : isWarning ? "bg-amber-100/80 border-amber-300 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-amber-400" : "bg-emerald-100/80 border-emerald-300 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-emerald-400")}>
          {isCritical ? <AlertTriangle size={14} strokeWidth={3} /> : isWarning ? <Info size={14} strokeWidth={3} /> : <CheckCircle2 size={14} strokeWidth={3} />}
        </div>
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-4 py-3 pr-12">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-colors", isSelected ? "bg-cyan-500 border-cyan-400 text-white" : "bg-white dark:bg-blue-900 border-slate-200 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-400")}>
            <Waves className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-[13px] text-slate-900 dark:text-white tracking-tight truncate">{cage.cageLabel}</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Fish size={10} /> {formatNumber(cage.currentFishCount)} balık
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 flex-1">
          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5"><Skull className="size-3 text-rose-500 shrink-0" /><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">Ölüm</p></div>
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums truncate">{formatNumber(cage.totalDeadCount)}</p>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5"><UtensilsCrossed className="size-3 text-amber-500 shrink-0" /><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">Yem</p></div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums truncate">{formatNumber(cage.totalFeedGram)}<span className="text-[9px] ml-0.5 font-bold">g</span></p>
          </div>
          <div className="col-span-2 flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5"><Layers className="size-3 text-blue-500 shrink-0" /><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">Biyokütle</p></div>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums truncate">{formatNumber(cage.currentBiomassGram)}<span className="text-[10px] ml-1 font-bold">g</span></p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex justify-between items-end mb-1"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Yaşam Oranı</span><span className={cn("text-[10px] font-black", isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500")}>%{survivalRate.toFixed(1)}</span></div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-cyan-950/50 rounded-full overflow-hidden">
            <div className={cn("h-full transition-all duration-1000 ease-out rounded-full", isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${survivalRate}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AquaDashboardPage(): ReactElement {
  const [activeDashboardProjectIds, setActiveDashboardProjectIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const hasInitialized = useRef(false);
  
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({ open: false, title: '', description: '', items: [] });

  const summariesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: aquaDashboardApi.getActiveProjectSummaries,
    staleTime: 60_000,
  });

  const summaries = summariesQuery.data ?? [];

  useEffect(() => {
    if (summaries.length > 0 && !hasInitialized.current) {
      setActiveDashboardProjectIds([summaries[0].projectId]);
      hasInitialized.current = true;
    }
  }, [summaries]);

  const globalStats = useMemo(() => {
    return summaries.reduce((acc, curr) => {
      acc.totalFish += curr.currentFish;
      acc.totalCages += curr.activeCageCount;
      curr.cages.forEach(c => { acc.totalBio += c.currentBiomassGram; acc.totalFeed += c.totalFeedGram; acc.totalDead += c.totalDeadCount; });
      return acc;
    }, { totalFish: 0, totalCages: 0, totalBio: 0, totalFeed: 0, totalDead: 0 });
  }, [summaries]);

  const activeProjects = useMemo(() => {
    return summaries.filter(p => activeDashboardProjectIds.includes(p.projectId));
  }, [summaries, activeDashboardProjectIds]);

  const detailQuery = useQuery({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, selectedProjectId],
    queryFn: async () => projectDetailReportApi.getProjectDetailReport(selectedProjectId as number),
    enabled: selectedProjectId != null,
  });

  const openProjectDetail = (projectId: number, cageId?: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(cageId ?? null);
    setIsProjectDialogOpen(true);
  };

  const openDetailDialog = (cage: any, type: DetailType): ((date: string, items: string[]) => void) => {
    const titleMap: Record<DetailType, string> = { feeding: 'Besleme Detayı', netOperation: 'Ağ İşlemi', transfer: 'Transfer', stockConvert: 'Stok Dönüşüm', shipment: 'Sevkiyat' };
    return (date: string, items: string[]) => {
      if (items.length === 0) return;
      setDetailDialog({ open: true, title: `${titleMap[type]} - ${cage.cageLabel}`, description: `Tarih: ${date}`, items });
    };
  };

  const selectedCageFromDetail: CageProjectReport | null = detailQuery.data?.cages.find((cage) => cage.projectCageId === selectedCageId) ?? detailQuery.data?.cages[0] ?? null;
  const maxDeadInCage = useMemo(() => selectedCageFromDetail ? Math.max(...selectedCageFromDetail.dailyRows.map(r => r.deadCount)) : 0, [selectedCageFromDetail]);

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

  const toggleProjectSelection = (projectId: number) => {
    setActiveDashboardProjectIds(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  if (summariesQuery.isLoading) return <PageLoader />;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* BAŞLIK VE BİRLEŞTİRİLMİŞ AYARLAR BUTONU */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20"><Droplets className="size-6" /></div>
            Aqua Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium ml-1">Tesisinizin genel üretim ve proje durumları.</p>
        </div>
        
        {/* YENİ: TEK BUTONLU GÖRÜNÜM & FİLTRE KONTROL MERKEZİ */}
        <div className="w-full md:w-auto flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 w-full md:w-auto bg-white/80 dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/50 shadow-sm hover:shadow-lg dark:hover:border-cyan-600 rounded-xl px-5 flex items-center gap-4 transition-all">
                <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Görünüm & Proje</span>
                  <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 leading-tight">
                    {activeDashboardProjectIds.length} Proje • {viewMode === 'card' ? 'Kart' : 'Liste'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-0 bg-white/95 dark:bg-blue-950/95 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/50 shadow-2xl rounded-2xl overflow-hidden z-50">
              
              {/* BÖLÜM 1: GÖRÜNÜM ŞEKLİ */}
              <div className="p-4 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-cyan-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                  <LayoutGrid className="w-3 h-3" /> Görünüm Şekli
                </p>
                <div className="flex bg-slate-200/50 dark:bg-blue-950 p-1 rounded-xl border border-slate-200 dark:border-cyan-800/50 w-full h-10 items-center relative">
                  <button onClick={() => setViewMode('card')} className={cn("flex-1 h-full rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all relative z-10", viewMode === 'card' ? "bg-white dark:bg-cyan-500 text-cyan-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300")}>
                    <LayoutGrid size={14} /> Kart
                  </button>
                  <button onClick={() => setViewMode('list')} className={cn("flex-1 h-full rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all relative z-10", viewMode === 'list' ? "bg-white dark:bg-cyan-500 text-cyan-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300")}>
                    <List size={14} /> Liste
                  </button>
                </div>
              </div>
              
              {/* BÖLÜM 2: PROJE FİLTRESİ */}
              <div className="p-3 border-b border-slate-100 dark:border-cyan-800/30 flex items-center justify-between bg-white dark:bg-transparent">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-pink-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <Layers className="w-3 h-3" /> Proje Seçimi
                 </p>
                 <div className="flex items-center gap-1">
                   <Button variant="ghost" size="sm" onClick={() => setActiveDashboardProjectIds(summaries.map(s => s.projectId))} className="h-6 px-2 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-md">Tümünü Seç</Button>
                   <Button variant="ghost" size="sm" onClick={() => setActiveDashboardProjectIds([])} className="h-6 px-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md">Temizle</Button>
                 </div>
              </div>
              <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar bg-white dark:bg-transparent">
                 {summaries.map(p => (
                    <label key={p.projectId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-blue-900/40 cursor-pointer transition-colors group">
                      <div className={cn("w-4 h-4 rounded-md border flex items-center justify-center transition-all", activeDashboardProjectIds.includes(p.projectId) ? "bg-pink-500 border-pink-500" : "border-slate-300 dark:border-cyan-700 group-hover:border-pink-400")}>
                        {activeDashboardProjectIds.includes(p.projectId) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate select-none flex-1">
                        <span className="font-bold text-slate-400 dark:text-cyan-600 mr-1.5">{p.projectCode}</span>
                        {p.projectName}
                      </span>
                      <input type="checkbox" className="hidden" checked={activeDashboardProjectIds.includes(p.projectId)} onChange={() => toggleProjectSelection(p.projectId)} />
                    </label>
                 ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* TESİS GENEL ÖZETİ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <Activity className="size-5 text-cyan-500" />
          Tesis Genel Özeti
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Aktif Kafes', val: globalStats.totalCages, icon: Waves, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-800/30' },
            { label: 'Canlı Balık', val: globalStats.totalFish, icon: Fish, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/30' },
            { label: 'Toplam Biyo', val: `${formatNumber(globalStats.totalBio)}g`, icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-800/30' },
            { label: 'Toplam Yem', val: `${formatNumber(globalStats.totalFeed)}g`, icon: UtensilsCrossed, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/30' },
          ].map((stat, i) => (
            <Card key={i} className="bg-white dark:bg-blue-950/60 border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-3xl overflow-hidden transition-transform hover:scale-[1.02]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{typeof stat.val === 'number' ? formatNumber(stat.val) : stat.val}</h3>
                  </div>
                  <div className={cn("p-3 rounded-2xl border shrink-0", stat.bg, stat.color)}><stat.icon className="size-5 sm:size-6" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SEÇİLEN PROJELER ALANI */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <Layers className="size-5 text-pink-500" />
          Seçili Projeler
        </h2>
        
        {summariesQuery.isError ? (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 rounded-3xl">
            <CardContent className="py-12 text-sm font-bold text-rose-600 dark:text-rose-400 text-center flex items-center justify-center gap-2">
              <Info className="size-5" /> Veriler alınamadı.
            </CardContent>
          </Card>
        ) : activeProjects.length > 0 ? (
          activeProjects.map(project => (
            <Card key={project.projectId} className="border border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
              <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-6 py-5 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 cursor-pointer group" onClick={() => openProjectDetail(project.projectId)}>
                    <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse" />
                      <span className="truncate group-hover:text-cyan-500 transition-colors">{project.projectCode} - {project.projectName}</span>
                    </CardTitle>
                  </div>
                  <Button type="button" className="bg-linear-to-r from-pink-600 to-orange-600 text-white h-10 px-6 rounded-xl font-bold shadow-lg shadow-pink-500/20 border-0 transition-transform hover:scale-105" onClick={() => openProjectDetail(project.projectId)}>
                    <BarChart3 className="size-4 mr-2" /> Detay Raporu
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 bg-transparent">
                {viewMode === 'card' ? (
                  /* KART GÖRÜNÜMÜ */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {project.cages.map((cage: any) => (
                      <CageCard key={cage.projectCageId} cage={cage} clickable onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)} />
                    ))}
                  </div>
                ) : (
                  /* LİSTE (TABLO) GÖRÜNÜMÜ */
                  <div className="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-cyan-800/30 rounded-2xl bg-white dark:bg-blue-950/20">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-blue-900/40 text-slate-500 dark:text-cyan-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-cyan-800/30">
                        <tr>
                          <th className="px-5 py-4 whitespace-nowrap">Kafes</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">Balık</th>
                          <th className="px-5 py-4 text-center text-rose-500 whitespace-nowrap">Ölüm</th>
                          <th className="px-5 py-4 text-center text-amber-500 whitespace-nowrap">Yem</th>
                          <th className="px-5 py-4 text-center text-blue-500 whitespace-nowrap">Biyokütle</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">Yaşam Oranı</th>
                          <th className="px-5 py-4 text-right whitespace-nowrap">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-cyan-800/20">
                        {project.cages.map((cage: any) => {
                          const totalInitial = cage.currentFishCount + cage.totalDeadCount;
                          const survivalRate = totalInitial > 0 ? ((cage.currentFishCount / totalInitial) * 100) : 100;
                          return (
                            <tr key={cage.projectCageId} className="hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer" onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)}>
                              <td className="px-5 py-3 font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg"><Waves size={14} className="text-cyan-600 dark:text-cyan-400"/></div> {cage.cageLabel}</td>
                              <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(cage.currentFishCount)}</td>
                              <td className="px-5 py-3 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatNumber(cage.totalDeadCount)}</td>
                              <td className="px-5 py-3 text-center font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatNumber(cage.totalFeedGram)}<span className="text-[10px] ml-0.5">g</span></td>
                              <td className="px-5 py-3 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatNumber(cage.currentBiomassGram)}<span className="text-[10px] ml-0.5">g</span></td>
                              <td className="px-5 py-3 text-center">
                                 <span className={cn("font-black text-[11px] px-2.5 py-1.5 rounded-lg border", survivalRate < 80 ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" : survivalRate < 95 ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30")}>
                                   %{survivalRate.toFixed(1)}
                                 </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Button size="sm" variant="ghost" className="h-8 px-4 text-xs font-bold text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                  Günlük Akış
                                </Button>
                              </td>
                            </tr>
                          )
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
              Lütfen detaylarını görmek için yukarıdaki menüden proje seçiniz.
            </CardContent>
          </Card>
        )}
      </div>

      {/* GÜNLÜK DETAY TABLOSU DIALOG */}
      <Dialog open={isDailyDialogOpen} onOpenChange={setIsDailyDialogOpen}>
        <DialogContent className="w-[98vw] max-w-[95vw] max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 shadow-2xl rounded-3xl flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-950/50 px-6 py-5 sm:px-8 shrink-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20"><div className="h-full w-full bg-white dark:bg-blue-950 rounded-[14px] flex items-center justify-center"><Waves className="size-6 text-cyan-600 dark:text-cyan-500" /></div></div>
                <div><DialogTitle className="text-xl font-black text-slate-900 dark:text-white">{selectedCageFromDetail?.cageLabel ?? '-'}</DialogTitle><p className="text-cyan-600 dark:text-cyan-400 text-sm font-bold flex items-center gap-2 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />Günlük Veri Akışı</p></div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-x-auto p-4 sm:p-8 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            <div className="min-w-max rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl">
              <div className={cn(TABLE_GRID_LAYOUT, "px-6 py-4 bg-slate-100/80 dark:bg-blue-900/40 border-b border-slate-200 dark:border-cyan-800/30 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest")}>
                <span>Tarih</span><span className="text-center">Yem (g)</span><span className="text-center">Stok</span><span className="text-center text-rose-500">Ölü</span><span className="text-center">Delta</span><span className="text-center text-blue-500">Biyo Delta</span><span>Hava</span><span className="text-center">Ağ</span><span className="text-center">Trans.</span><span className="text-center">Sevk</span><span className="text-right">Durum</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-cyan-800/10 custom-scrollbar">
                {selectedCageFromDetail?.dailyRows.map((row: any, index: number) => {
                  const prevRow = selectedCageFromDetail.dailyRows[index + 1];
                  const deadDiff = prevRow ? row.deadCount - prevRow.deadCount : 0;
                  const feedDiff = prevRow ? row.feedGram - prevRow.feedGram : 0;
                  const isHighDead = row.deadCount > 0 && maxDeadInCage > 5 && row.deadCount >= (maxDeadInCage * 0.7);

                  return (
                    <div key={row.date} className={cn(TABLE_GRID_LAYOUT, "px-6 py-4 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-all text-[13px]", isHighDead && "bg-rose-500/5")}>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{row.date}</span>
                      <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-yellow-400 font-bold tabular-nums">{formatNumber(row.feedGram)}{feedDiff !== 0 && (feedDiff > 0 ? <TrendingUp size={12} className="text-emerald-500"/> : <TrendingDown size={12} className="text-rose-500"/>)}</div>
                      <div className="flex justify-center">{row.feedDetails.length > 0 ? (<button onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-700 dark:text-cyan-400 text-[11px] font-black hover:bg-cyan-500/20 transition-colors">{row.feedStockCount} stok</button>) : <span className="text-slate-300 dark:text-slate-700">-</span>}</div>
                      <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-500 font-black tabular-nums">{formatNumber(row.deadCount)}{deadDiff !== 0 && (deadDiff > 0 ? <TrendingUp size={12} className="text-rose-500"/> : <TrendingDown size={12} className="text-emerald-500"/>)}</div>
                      <span className="text-center text-slate-500 dark:text-slate-400 tabular-nums font-medium">{formatNumber(row.countDelta)}</span>
                      <span className="text-center text-blue-600 dark:text-blue-400 font-bold tabular-nums">{formatNumber(row.biomassDelta)}</span>
                      <span className="truncate text-slate-500 dark:text-slate-400 text-[11px] font-medium">{row.weather || '-'}</span>
                      <div className="flex justify-center">{row.netOperationCount > 0 ? (<button onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)} className="text-[11px] text-cyan-600 dark:text-cyan-400 font-black hover:underline transition-all">{row.netOperationCount} İşlem</button>) : <span className="text-slate-300 dark:text-slate-700">-</span>}</div>
                      <span className="text-center text-slate-500 dark:text-slate-400 font-medium">{row.transferCount || "-"}</span>
                      <span className="text-center text-slate-500 dark:text-slate-400 font-medium">{row.shipmentCount || "-"}</span>
                      <div className="flex justify-end"><Badge className={cn("px-2.5 py-1 font-black text-[10px] rounded-lg border-0 shadow-sm", row.fed ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400")}>{row.fed ? "BESLENDİ" : "BESLENMEDİ"}</Badge></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="px-8 py-5 border-t border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-950 flex justify-end"><button onClick={() => setIsDailyDialogOpen(false)} className="px-10 py-2.5 bg-linear-to-r from-pink-600 to-orange-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all">Kapat</button></div>
        </DialogContent>
      </Dialog>

      {/* PROJECT DETAY DIALOG */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-4xl shadow-2xl flex flex-col outline-none">
          <DialogHeader className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400"><BarChart3 className="size-5" /></div>
              {summaries.find(p => p.projectId === selectedProjectId) ? `${summaries.find(p => p.projectId === selectedProjectId)?.projectCode} - ${summaries.find(p => p.projectId === selectedProjectId)?.projectName}` : '-'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 flex flex-col justify-center"><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80 mb-1">Balık</p><p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.currentFishCount, 0) || 0)}</p></div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 flex flex-col justify-center"><p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400/80 mb-1">Ölüm</p><p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalDeadCount, 0) || 0)}</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 flex flex-col justify-center"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400/80 mb-1">Yem(g)</p><p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalFeedGram, 0) || 0)}</p></div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 flex flex-col justify-center"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400/80 mb-1">Kafes</p><p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.length || 0)}</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1"><div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg"><Layers className="size-4 text-cyan-600 dark:text-cyan-400" /></div><h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Kafes Havuzları</h3><Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-blue-900/30 dark:text-slate-400 border-0 ml-2 px-3 py-1">Günlük detay için tıklayın</Badge></div>
              {detailQuery.isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><CageSkeleton /><CageSkeleton /></div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{detailQuery.data?.cages.map((cage) => (<CageCard key={cage.projectCageId} cage={cage} clickable isSelected={selectedCageId === cage.projectCageId} onClick={() => openCageDailyDialog(cage.projectCageId)} />))}</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KÜÇÜK DETAY DIALOG (Feeding, Net vb.) */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[95vw] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-3xl shadow-2xl flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 px-6 py-5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3"><Activity className="size-5 text-cyan-500" />{detailDialog.title}</DialogTitle>
              <span className="text-[10px] font-black text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30">{detailDialog.description}</span>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {detailDialog.items.map((item, index) => (
              <div key={index} className="flex gap-4 border-b border-slate-100 dark:border-cyan-800/20 px-4 py-4 last:border-b-0 hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-colors rounded-xl mt-1">
                <span className="shrink-0 text-xs font-black text-cyan-600 dark:text-cyan-400 pt-0.5">{index + 1}.</span>
                <span className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">{item}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
