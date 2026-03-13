import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Combobox } from '@/components/ui/combobox';
import { OperationTypeTabs } from './components/OperationTypeTabs';
import { FeedingQuickForm } from './components/FeedingQuickForm';
import { MortalityQuickForm } from './components/MortalityQuickForm';
import { WeatherQuickForm } from './components/WeatherQuickForm';
import { NetOperationQuickForm } from './components/NetOperationQuickForm';
import { TransferQuickForm } from './components/TransferQuickForm';
import { StockChangeQuickForm } from './components/StockChangeQuickForm';
import { useProjectListQuery } from './hooks/useProjectListQuery';
import { useProjectCageListByProjectQuery } from './hooks/useProjectCageListByProjectQuery';
import { useTransferTargetProjectCagesQuery } from './hooks/useTransferTargetProjectCagesQuery';
import { useStockListQuery } from './hooks/useStockListQuery';
import { useFishBatchListByProjectQuery } from './hooks/useFishBatchListByProjectQuery';
import { useWeatherSeverityListQuery } from './hooks/useWeatherSeverityListQuery';
import { useNetOperationTypeListQuery } from './hooks/useNetOperationTypeListQuery';
import { aquaQuickDailyApi } from './api/aqua-quick-api';
import {
  useCreateFeedingMutation,
  useCreateFeedingLineMutation,
  useCreateMortalityMutation,
  useCreateMortalityLineMutation,
  useCreateDailyWeatherMutation,
  useCreateNetOperationMutation,
  useCreateNetOperationLineMutation,
  useCreateTransferMutation,
  useCreateTransferLineMutation,
  useCreateStockConvertMutation,
  useCreateStockConvertLineMutation,
} from './hooks/useQuickDailyEntryMutations';
import type { 
  FeedingQuickFormSchema, 
  MortalityQuickFormSchema, 
  WeatherQuickFormSchema, 
  NetOperationQuickFormSchema, 
  TransferQuickFormSchema, 
  StockChangeQuickFormSchema 
} from './schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot } from './types/quick-daily-entry-types';
import {
  formatFeedingNo,
  formatNetOperationNo,
  formatTransferNo,
  formatStockConvertNo,
  localDateString,
} from './utils/quick-operations';
import { ChevronRight, ClipboardEdit, CheckCircle2 } from 'lucide-react';

export function QuickDailyEntryPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectCageId, setProjectCageId] = useState<number | null>(null);
  const [sourceBatch, setSourceBatch] = useState<ActiveCageBatchSnapshot | null>(null);
  const [sourceBatchByCageId, setSourceBatchByCageId] = useState<Record<number, ActiveCageBatchSnapshot | null>>({});
  const [isTransferSuccessDialogOpen, setIsTransferSuccessDialogOpen] = useState(false);

  const { data: projects } = useProjectListQuery();
  const { data: projectCages, refetch: refetchProjectCages } = useProjectCageListByProjectQuery(projectId);
  const { data: transferTargetProjectCages, refetch: refetchTransferTargetProjectCages } = useTransferTargetProjectCagesQuery(projectId);
  const { data: stocks, isLoading: isLoadingStocks } = useStockListQuery();
  const { data: fishBatches } = useFishBatchListByProjectQuery(projectId);
  const { data: weatherSeverities } = useWeatherSeverityListQuery();
  const { data: netOperationTypes } = useNetOperationTypeListQuery();

  const createFeeding = useCreateFeedingMutation();
  const createFeedingLine = useCreateFeedingLineMutation();
  const createMortality = useCreateMortalityMutation();
  const createMortalityLine = useCreateMortalityLineMutation();
  const createDailyWeather = useCreateDailyWeatherMutation();
  const createNetOperation = useCreateNetOperationMutation();
  const createNetOperationLine = useCreateNetOperationLineMutation();
  const createTransfer = useCreateTransferMutation();
  const createTransferLine = useCreateTransferLineMutation();
  const createStockConvert = useCreateStockConvertMutation();
  const createStockConvertLine = useCreateStockConvertLineMutation();

  const handleProjectChange = (value: string): void => {
    const id = value ? Number(value) : null;
    setProjectId(id);
    setProjectCageId(null);
  };

  const handleCageChange = (value: string): void => {
    setProjectCageId(value ? Number(value) : null);
  };

  useEffect(() => {
    let active = true;
    if (projectCageId == null) {
      setSourceBatch(null);
      return;
    }
    void (async () => {
      try {
        const snapshot = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
        if (!active) return;
        setSourceBatch(snapshot);
      } catch {
        if (!active) return;
        setSourceBatch(null);
      }
    })();
    return () => { active = false; };
  }, [projectCageId]);

  useEffect(() => {
    let active = true;
    const cages = Array.isArray(projectCages) ? projectCages : [];
    if (cages.length === 0) {
      setSourceBatchByCageId({});
      return;
    }
    void (async () => {
      const entries = await Promise.all(
        cages.map(async (cage) => {
          try {
            const snapshot = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(cage.id);
            return [cage.id, snapshot] as const;
          } catch {
            return [cage.id, null] as const;
          }
        })
      );
      if (!active) return;
      setSourceBatchByCageId(Object.fromEntries(entries));
    })();
    return () => { active = false; };
  }, [projectCages]);

  const sourceProjectCages = useMemo(() =>
    (Array.isArray(projectCages) ? projectCages : []).filter((cage) =>
      projectId == null ? true : Number(cage.projectId) === Number(projectId)
    ),
    [projectCages, projectId]
  );

  const projectOptions = useMemo(
    () =>
      (Array.isArray(projects) ? projects : []).map((p) => ({
        value: String(p.id),
        label: `${p.projectCode ?? ''} - ${p.projectName ?? ''}`,
      })),
    [projects]
  );

  const cageOptions = useMemo(
    () =>
      sourceProjectCages.map((pc) => {
      const snapshot = sourceBatchByCageId[pc.id];
      const liveCount = Number(snapshot?.liveCount ?? 0);
      const averageGram = Number(snapshot?.averageGram ?? 0);
      const baseLabel = pc.cageCode ?? pc.cageName ?? String(pc.id);
      return {
        value: String(pc.id),
        label: `${baseLabel} (${liveCount}/${averageGram})`,
      };
      }),
    [sourceProjectCages, sourceBatchByCageId]
  );

  useEffect(() => {
    if (projectCageId == null) return;
    const existsInSourceList = sourceProjectCages.some((c) => c.id === projectCageId);
    if (!existsInSourceList) setProjectCageId(null);
  }, [projectCageId, sourceProjectCages]);

  const handleFeedingSubmit = async (data: FeedingQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const feedingDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findFeedingHeaderByProjectAndDate(projectId, feedingDate);
      const feeding = existingHeader ?? (await createFeeding.mutateAsync({ projectId, feedingNo: formatFeedingNo(), feedingDate, feedingSlot: data.feedingSlot, sourceType: 0, status: 1 }));
      const effectiveGramPerUnit = data.gramPerUnit > 0 ? data.gramPerUnit : 1;
      await createFeedingLine.mutateAsync({ feedingId: feeding.id, projectId, feedingDate, feedingSlot: data.feedingSlot, sourceType: 0, status: 1, stockId: data.stockId, qtyUnit: data.qtyUnit, gramPerUnit: effectiveGramPerUnit, totalGram: data.qtyUnit * effectiveGramPerUnit });
      toast.success(t('aqua.quickDailyEntry.toast.feedingSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleMortalitySubmit = async (data: MortalityQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (sourceBatch == null) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      const mortalityDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findMortalityHeaderByProjectAndDate(projectId, mortalityDate);
      const canReuseDraft = existingHeader != null && Number(existingHeader.status ?? 0) === 0;
      const mortality = canReuseDraft ? existingHeader : (await createMortality.mutateAsync({ projectId, mortalityDate, status: 0 }));
      await createMortalityLine.mutateAsync({ mortalityId: mortality.id, fishBatchId: sourceBatch.fishBatchId, projectCageId, deadCount: data.deadCount });
      toast.success(t('aqua.quickDailyEntry.toast.mortalitySaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleWeatherSubmit = async (data: WeatherQuickFormSchema): Promise<void> => {
    if (projectId == null) return;
    try {
      await createDailyWeather.mutateAsync({ projectId, weatherDate: localDateString(), weatherSeverityId: data.weatherSeverityId, weatherTypeId: data.weatherTypeId, note: data.description });
      toast.success(t('aqua.quickDailyEntry.toast.weatherSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleNetOperationSubmit = async (data: NetOperationQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const operationDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findNetOperationHeaderByProjectAndDate(projectId, operationDate);
      const netOperation = existingHeader != null && Number(existingHeader.status ?? 0) === 0 ? existingHeader : (await createNetOperation.mutateAsync({ projectId, operationTypeId: data.netOperationTypeId, operationNo: formatNetOperationNo(), operationDate, status: 0, note: data.description }));
      await createNetOperationLine.mutateAsync({ netOperationId: netOperation.id, projectCageId, fishBatchId: data.fishBatchId > 0 ? data.fishBatchId : undefined, note: data.description });
      toast.success(t('aqua.quickDailyEntry.toast.netOperationSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleTransferSubmit = async (data: TransferQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (data.toProjectCageId === projectCageId) throw new Error(t('aqua.quickDailyEntry.toast.sameCageTransferNotAllowed'));
      const transferFishCount = Number(sourceBatch.liveCount ?? 0);
      if (transferFishCount <= 0) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (data.fishCount > sourceBatch.liveCount) throw new Error(t('aqua.quickDailyEntry.toast.transferCountTooHigh'));

      const transferDate = localDateString();
      const transfer = await createTransfer.mutateAsync({ projectId, transferNo: formatTransferNo(), transferDate, status: 0, note: data.description });
      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const biomassGram = transferFishCount * averageGram;
      await createTransferLine.mutateAsync({ transferId: transfer.id, fishBatchId: sourceBatch.fishBatchId, fromProjectCageId: projectCageId, toProjectCageId: data.toProjectCageId, fishCount: transferFishCount, averageGram, biomassGram });
      try { await aquaQuickDailyApi.postTransfer(transfer.id); } catch {}
      await Promise.all([refetchProjectCages(), refetchTransferTargetProjectCages()]);
      setIsTransferSuccessDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleStockChangeSubmit = async (data: StockChangeQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (data.toFishBatchId === sourceBatch.fishBatchId) throw new Error(t('aqua.quickDailyEntry.toast.sameBatchStockChangeNotAllowed'));
      if (data.fishCount > sourceBatch.liveCount) throw new Error(t('aqua.quickDailyEntry.toast.stockChangeCountTooHigh'));

      const convertDate = localDateString();
      const stockConvert = await createStockConvert.mutateAsync({ projectId, convertNo: formatStockConvertNo(), convertDate, status: 0, note: data.description });
      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const newAverageGram = Number(data.newAverageGram);
      if (newAverageGram <= 0) throw new Error(t('aqua.quickDailyEntry.toast.invalidNewAverageGram'));
      const biomassGram = data.fishCount * averageGram;
      await createStockConvertLine.mutateAsync({ stockConvertId: stockConvert.id, fromFishBatchId: sourceBatch.fishBatchId, toFishBatchId: data.toFishBatchId, fromProjectCageId: projectCageId, toProjectCageId: projectCageId, fishCount: data.fishCount, averageGram, newAverageGram, biomassGram });
      toast.success(t('aqua.quickDailyEntry.toast.stockChangeSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  return (
    <div className="w-full space-y-6 pb-10 animate-in fade-in duration-500">
      
      {/* Üst Başlık Alanı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            <ClipboardEdit className="size-6 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {t('aqua.quickDailyEntry.pageTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              {t('aqua.quickDailyEntry.pageDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Proje ve Kafes Seçim Kartı */}
      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl p-6 transition-all duration-300 relative overflow-hidden">
        {/* Şık Arka Plan Parıltısı */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 relative z-10">
          <div className="space-y-3 w-full">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ChevronRight size={14} className="text-cyan-500" />
              {t('aqua.quickDailyEntry.project')}
            </label>
            <Combobox
              options={projectOptions}
              value={projectId != null ? String(projectId) : ''}
              onValueChange={handleProjectChange}
              placeholder={t('aqua.quickDailyEntry.selectProject')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noResults')}
              className="w-full bg-slate-50 dark:bg-blue-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30 h-12 rounded-xl focus-visible:ring-cyan-500/20 font-medium transition-all"
            />
          </div>
          
          <div className="space-y-3 w-full">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ChevronRight size={14} className="text-cyan-500" />
              {t('aqua.quickDailyEntry.cage')}
            </label>
            <Combobox
              options={cageOptions}
              value={projectCageId != null ? String(projectCageId) : ''}
              onValueChange={handleCageChange}
              placeholder={t('aqua.quickDailyEntry.selectCage')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noResults')}
              disabled={!projectId}
              className="w-full bg-slate-50 dark:bg-blue-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30 h-12 rounded-xl focus-visible:ring-cyan-500/20 font-medium disabled:opacity-50 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* İşlem Sekmeleri (Tab'lar) */}
      <OperationTypeTabs
        feedingTab={<FeedingQuickForm projectId={projectId} projectCageId={projectCageId} stocks={stocks} isLoadingStocks={isLoadingStocks} onSubmit={handleFeedingSubmit} isSubmitting={createFeeding.isPending || createFeedingLine.isPending} />}
        mortalityTab={<MortalityQuickForm projectId={projectId} projectCageId={projectCageId} onSubmit={handleMortalitySubmit} isSubmitting={createMortality.isPending || createMortalityLine.isPending} />}
        weatherTab={<WeatherQuickForm projectId={projectId} severities={weatherSeverities} onSubmit={handleWeatherSubmit} isSubmitting={createDailyWeather.isPending} />}
        netOperationTab={<NetOperationQuickForm projectId={projectId} projectCageId={projectCageId} fishBatches={fishBatches} netOperationTypes={netOperationTypes} onSubmit={handleNetOperationSubmit} isSubmitting={createNetOperation.isPending || createNetOperationLine.isPending} />}
        transferTab={<TransferQuickForm projectId={projectId} projectCageId={projectCageId} projectCages={transferTargetProjectCages} sourceBatch={sourceBatch} onSubmit={handleTransferSubmit} isSubmitting={createTransfer.isPending || createTransferLine.isPending} />}
        stockChangeTab={<StockChangeQuickForm projectId={projectId} projectCageId={projectCageId} fishBatches={fishBatches} sourceBatch={sourceBatch} onSubmit={handleStockChangeSubmit} isSubmitting={createStockConvert.isPending || createStockConvertLine.isPending} />}
      />

      {/* Transfer Başarılı Dialog */}
      <AlertDialog open={isTransferSuccessDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <CheckCircle2 className="text-emerald-500 size-6" />
              </div>
              {t('aqua.quickDailyEntry.transferSuccessDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium mt-2">
              {t('aqua.quickDailyEntry.transferSuccessDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 border-0 font-bold h-11 px-8 rounded-xl transition-all"
              onClick={() => {
                setIsTransferSuccessDialogOpen(false);
                window.location.reload();
              }}
            >
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
