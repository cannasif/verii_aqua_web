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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { FeedingQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { MortalityQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { WeatherQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { NetOperationQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { TransferQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { StockChangeQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot } from './types/quick-daily-entry-types';
import {
  formatFeedingNo,
  formatNetOperationNo,
  formatTransferNo,
  formatStockConvertNo,
  localDateString,
} from './utils/quick-operations';

export function QuickDailyEntryPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectCageId, setProjectCageId] = useState<number | null>(null);
  const [sourceBatch, setSourceBatch] = useState<ActiveCageBatchSnapshot | null>(null);
  const [sourceBatchByCageId, setSourceBatchByCageId] = useState<Record<number, ActiveCageBatchSnapshot | null>>({});
  const [targetBatchByCageId, setTargetBatchByCageId] = useState<Record<number, ActiveCageBatchSnapshot | null>>({});
  const [isTransferSuccessDialogOpen, setIsTransferSuccessDialogOpen] = useState(false);

  const { data: projects } = useProjectListQuery();
  const { data: projectCages, refetch: refetchProjectCages } = useProjectCageListByProjectQuery(projectId);
  const {
    data: transferTargetProjectCages,
    refetch: refetchTransferTargetProjectCages,
  } = useTransferTargetProjectCagesQuery(projectId);
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
    return () => {
      active = false;
    };
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

    return () => {
      active = false;
    };
  }, [projectCages]);

  useEffect(() => {
    let active = true;
    const cages = Array.isArray(transferTargetProjectCages) ? transferTargetProjectCages : [];
    if (cages.length === 0) {
      setTargetBatchByCageId({});
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
      setTargetBatchByCageId(Object.fromEntries(entries));
    })();

    return () => {
      active = false;
    };
  }, [transferTargetProjectCages]);

  const sourceProjectCages = useMemo(
    () =>
      (Array.isArray(projectCages) ? projectCages : []).filter((cage) => {
        if (projectId != null && Number(cage.projectId) !== Number(projectId)) {
          return false;
        }
        const snapshot = sourceBatchByCageId[cage.id];
        return snapshot != null && snapshot.liveCount > 0;
      }),
    [projectCages, sourceBatchByCageId, projectId]
  );

  useEffect(() => {
    if (projectCageId == null) return;
    const existsInSourceList = sourceProjectCages.some((c) => c.id === projectCageId);
    if (!existsInSourceList) {
      setProjectCageId(null);
    }
  }, [projectCageId, sourceProjectCages]);

  const handleFeedingSubmit = async (data: FeedingQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const feedingDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findFeedingHeaderByProjectAndDate(
        projectId,
        feedingDate
      );
      const feeding =
        existingHeader ??
        (await createFeeding.mutateAsync({
          projectId,
          feedingNo: formatFeedingNo(),
          feedingDate,
          feedingSlot: data.feedingSlot,
          sourceType: 0,
          status: 1,
        }));
      const effectiveGramPerUnit = data.gramPerUnit > 0 ? data.gramPerUnit : 1;
      await createFeedingLine.mutateAsync({
        feedingId: feeding.id,
        projectId,
        feedingDate,
        feedingSlot: data.feedingSlot,
        sourceType: 0,
        status: 1,
        stockId: data.stockId,
        qtyUnit: data.qtyUnit,
        gramPerUnit: effectiveGramPerUnit,
        totalGram: data.qtyUnit * effectiveGramPerUnit,
      });
      toast.success(t('aqua.quickDailyEntry.toast.feedingSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  const handleMortalitySubmit = async (data: MortalityQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (sourceBatch == null) {
        throw new Error(
          t('aqua.quickDailyEntry.toast.noActiveBatchForCage', {
            defaultValue: 'Seçili kafes için aktif batch bulunamadı.',
          })
        );
      }

      const mortalityDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findMortalityHeaderByProjectAndDate(
        projectId,
        mortalityDate
      );
      const canReuseDraft = existingHeader != null && Number(existingHeader.status ?? 0) === 0;
      const mortality =
        canReuseDraft
          ? existingHeader
          : (await createMortality.mutateAsync({
              projectId,
              mortalityDate,
              status: 0,
            }));
      await createMortalityLine.mutateAsync({
        mortalityId: mortality.id,
        fishBatchId: sourceBatch.fishBatchId,
        projectCageId,
        deadCount: data.deadCount,
      });
      toast.success(t('aqua.quickDailyEntry.toast.mortalitySaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  const handleWeatherSubmit = async (data: WeatherQuickFormSchema): Promise<void> => {
    if (projectId == null) return;
    try {
      await createDailyWeather.mutateAsync({
        projectId,
        weatherDate: localDateString(),
        weatherSeverityId: data.weatherSeverityId,
        weatherTypeId: data.weatherTypeId,
        note: data.description,
      });
      toast.success(t('aqua.quickDailyEntry.toast.weatherSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  const handleNetOperationSubmit = async (
    data: NetOperationQuickFormSchema
  ): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const operationDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findNetOperationHeaderByProjectAndDate(
        projectId,
        operationDate
      );
      const netOperation =
        existingHeader != null && Number(existingHeader.status ?? 0) === 0
          ? existingHeader
          : (await createNetOperation.mutateAsync({
              projectId,
              operationTypeId: data.netOperationTypeId,
              operationNo: formatNetOperationNo(),
              operationDate,
              status: 0,
              note: data.description,
            }));
      await createNetOperationLine.mutateAsync({
        netOperationId: netOperation.id,
        projectCageId,
        fishBatchId: data.fishBatchId > 0 ? data.fishBatchId : undefined,
        note: data.description,
      });
      toast.success(t('aqua.quickDailyEntry.toast.netOperationSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  const handleTransferSubmit = async (data: TransferQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) {
        throw new Error(
          t('aqua.quickDailyEntry.toast.noActiveBatchForCage', {
            defaultValue: 'Seçili kafes için aktif batch bulunamadı.',
          })
        );
      }
      if (data.toProjectCageId === projectCageId) {
        throw new Error(t('aqua.quickDailyEntry.toast.sameCageTransferNotAllowed', { defaultValue: 'Kaynak ve hedef kafes aynı olamaz.' }));
      }
      const transferFishCount = Number(sourceBatch.liveCount ?? 0);
      if (transferFishCount <= 0) {
        throw new Error(
          t('aqua.quickDailyEntry.toast.noActiveBatchForCage', {
            defaultValue: 'Seçili kafes için aktif batch bulunamadı.',
          })
        );
      }
      if (data.fishCount > sourceBatch.liveCount) {
        throw new Error(t('aqua.quickDailyEntry.toast.transferCountTooHigh', { defaultValue: 'Transfer adedi, kafesteki canlı adedini aşamaz.' }));
      }

      const transferDate = localDateString();
      const transfer = await createTransfer.mutateAsync({
        projectId,
        transferNo: formatTransferNo(),
        transferDate,
        status: 0,
        note: data.description,
      });
      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const biomassGram = transferFishCount * averageGram;
      await createTransferLine.mutateAsync({
        transferId: transfer.id,
        fishBatchId: sourceBatch.fishBatchId,
        fromProjectCageId: projectCageId,
        toProjectCageId: data.toProjectCageId,
        fishCount: transferFishCount,
        averageGram,
        biomassGram,
      });
      try {
        await aquaQuickDailyApi.postTransfer(transfer.id);
      } catch {
        // TransferLine servisi arka tarafta otomatik post deneyebilir.
        // Buradaki ek post çağrısı hata dönerse kullanıcı akışını bozmuyoruz.
      }
      await Promise.all([refetchProjectCages(), refetchTransferTargetProjectCages()]);
      setIsTransferSuccessDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  const handleStockChangeSubmit = async (data: StockChangeQuickFormSchema): Promise<void> => {
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) {
        throw new Error(
          t('aqua.quickDailyEntry.toast.noActiveBatchForCage', {
            defaultValue: 'Seçili kafes için aktif batch bulunamadı.',
          })
        );
      }
      if (data.toFishBatchId === sourceBatch.fishBatchId) {
        throw new Error(t('aqua.quickDailyEntry.toast.sameBatchStockChangeNotAllowed', { defaultValue: 'Hedef batch kaynak batch ile aynı olamaz.' }));
      }
      if (data.fishCount > sourceBatch.liveCount) {
        throw new Error(t('aqua.quickDailyEntry.toast.stockChangeCountTooHigh', { defaultValue: 'Stok değişim adedi, kafesteki canlı adedini aşamaz.' }));
      }

      const convertDate = localDateString();
      const stockConvert = await createStockConvert.mutateAsync({
        projectId,
        convertNo: formatStockConvertNo(),
        convertDate,
        status: 0,
        note: data.description,
      });
      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const biomassGram = data.fishCount * averageGram;
      await createStockConvertLine.mutateAsync({
        stockConvertId: stockConvert.id,
        fromFishBatchId: sourceBatch.fishBatchId,
        toFishBatchId: data.toFishBatchId,
        fromProjectCageId: projectCageId,
        toProjectCageId: projectCageId,
        fishCount: data.fishCount,
        averageGram,
        biomassGram,
      });
      toast.success(t('aqua.quickDailyEntry.toast.stockChangeSaved', { defaultValue: 'Stok değişimi kaydedildi.' }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  return (
    <>
      <div className="space-y-6 w-full max-w-5xl">
        <h1 className="text-2xl font-semibold">{t('aqua.quickDailyEntry.pageTitle')}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium">{t('aqua.quickDailyEntry.project')}</label>
            <Select value={projectId != null ? String(projectId) : undefined} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('aqua.quickDailyEntry.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(projects) ? projects : []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.projectCode} - {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium">{t('aqua.quickDailyEntry.cage')}</label>
            <Select
              value={projectCageId != null ? String(projectCageId) : undefined}
              onValueChange={handleCageChange}
              disabled={!projectId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('aqua.quickDailyEntry.selectCage')} />
              </SelectTrigger>
              <SelectContent>
                {sourceProjectCages.map((pc) => (
                  <SelectItem key={pc.id} value={String(pc.id)}>
                    {pc.cageCode ?? pc.cageName ?? String(pc.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <OperationTypeTabs
          feedingTab={
            <FeedingQuickForm
              projectId={projectId}
              projectCageId={projectCageId}
              stocks={stocks}
              isLoadingStocks={isLoadingStocks}
              onSubmit={handleFeedingSubmit}
              isSubmitting={createFeeding.isPending || createFeedingLine.isPending}
            />
          }
          mortalityTab={
            <MortalityQuickForm
              projectId={projectId}
              projectCageId={projectCageId}
              onSubmit={handleMortalitySubmit}
              isSubmitting={createMortality.isPending || createMortalityLine.isPending}
            />
          }
          weatherTab={
            <WeatherQuickForm
              projectId={projectId}
              severities={weatherSeverities}
              onSubmit={handleWeatherSubmit}
              isSubmitting={createDailyWeather.isPending}
            />
          }
          netOperationTab={
            <NetOperationQuickForm
              projectId={projectId}
              projectCageId={projectCageId}
              fishBatches={fishBatches}
              netOperationTypes={netOperationTypes}
              onSubmit={handleNetOperationSubmit}
              isSubmitting={createNetOperation.isPending || createNetOperationLine.isPending}
            />
          }
          transferTab={
            <TransferQuickForm
              projectId={projectId}
              projectCageId={projectCageId}
              projectCages={transferTargetProjectCages}
              sourceBatch={sourceBatch}
              activeBatchByCageId={targetBatchByCageId}
              onSubmit={handleTransferSubmit}
              isSubmitting={createTransfer.isPending || createTransferLine.isPending}
            />
          }
          stockChangeTab={
            <StockChangeQuickForm
              projectId={projectId}
              projectCageId={projectCageId}
              fishBatches={fishBatches}
              sourceBatch={sourceBatch}
              onSubmit={handleStockChangeSubmit}
              isSubmitting={createStockConvert.isPending || createStockConvertLine.isPending}
            />
          }
        />
      </div>

      <AlertDialog open={isTransferSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('aqua.quickDailyEntry.transferSuccessDialog.title', {
                defaultValue: 'İşlem Başarılı',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('aqua.quickDailyEntry.transferSuccessDialog.description', {
                defaultValue:
                  'Kafes değişimi başarıyla kaydedildi. Kafes değiştiği için veri yenilenmelidir.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsTransferSuccessDialogOpen(false);
                window.location.reload();
              }}
            >
              {t('common.ok', { defaultValue: 'Tamam' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
