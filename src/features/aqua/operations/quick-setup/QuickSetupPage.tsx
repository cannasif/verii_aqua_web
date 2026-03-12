import { type ReactElement, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProjectStepCard } from './components/ProjectStepCard';
import { GoodsReceiptStepCard } from './components/GoodsReceiptStepCard';
import { FishDistributionStepCard } from './components/FishDistributionStepCard';
import { aquaQuickApi } from './api/aqua-quick-api';
import { useProjectListQuery } from './hooks/useProjectListQuery';
import { useStockListQuery } from './hooks/useStockListQuery';
import { useProjectCageListByProjectQuery } from './hooks/useProjectCageListByProjectQuery';
import { useQuickSetupMutations } from './hooks/useQuickSetupMutations';
import type { ProjectFormSchema } from './schema/quick-setup-schema';
import type { GoodsReceiptFormSchema, FishLineFormSchema, FeedLineFormSchema } from './schema/quick-setup-schema';
import {
  GOODS_RECEIPT_ITEM_TYPE_FISH,
  type CageAllocationRow,
  type ExistingGoodsReceiptContext,
  type CageOptionDto,
} from './types/quick-setup-types';

export function QuickSetupPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [goodsReceiptId, setGoodsReceiptId] = useState<number | null>(null);
  const [fishLineId, setFishLineId] = useState<number | null>(null);
  const [fishBatchId, setFishBatchId] = useState<number | null>(null);
  const [fishCount, setFishCount] = useState<number>(0);
  const [allocations, setAllocations] = useState<CageAllocationRow[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [availableCages, setAvailableCages] = useState<CageOptionDto[]>([]);
  const [selectedAvailableCageId, setSelectedAvailableCageId] = useState<number | null>(null);
  const [isAddingCage, setIsAddingCage] = useState(false);
  const [existingReceipt, setExistingReceipt] = useState<ExistingGoodsReceiptContext | null>(null);
  const [isCheckingExistingReceipt, setIsCheckingExistingReceipt] = useState(false);

  const { data: projects, isLoading: isLoadingProjects } = useProjectListQuery();
  const { data: stocks, isLoading: isLoadingStocks } = useStockListQuery();
  const {
    data: projectCages,
    refetch: refetchProjectCages,
    error: projectCageError,
  } = useProjectCageListByProjectQuery(projectId);
  const mutations = useQuickSetupMutations();

  useEffect(() => {
    setGoodsReceiptId(null);
    setFishLineId(null);
    setFishBatchId(null);
    setFishCount(0);
    setAllocations([]);
    setSelectedCageId(null);
    setAvailableCages([]);
    setSelectedAvailableCageId(null);
    setExistingReceipt(null);

    if (projectId == null) {
      setIsCheckingExistingReceipt(false);
      return;
    }

    let isActive = true;
    setIsCheckingExistingReceipt(true);

    void (async () => {
      try {
        const context = await aquaQuickApi.getExistingGoodsReceiptContext(projectId);
        if (!isActive) return;

        if (context) {
          if (context.status === 0 && context.fishLineId != null && context.fishBatchId == null) {
            try {
              const line = await aquaQuickApi.getGoodsReceiptLineById(context.fishLineId);
              const fishCount = Number(line.fishCount ?? 0);
              const averageFromLine = Number(line.fishAverageGram ?? 0);
              const averageFromFishTotal = fishCount > 0 ? Number(line.fishTotalGram ?? 0) / fishCount : 0;
              const averageFromUnit = Number(line.gramPerUnit ?? 0) > 0 ? Number(line.gramPerUnit ?? 0) : 0;
              const averageGram = averageFromLine > 0 ? averageFromLine : averageFromFishTotal > 0 ? averageFromFishTotal : averageFromUnit;
              
              if (averageGram > 0) {
                const fishBatch = await mutations.createFishBatch.mutateAsync({
                  projectId,
                  batchCode: context.receiptNo || 'GR',
                  fishStockId: line.stockId,
                  currentAverageGram: averageGram,
                  startDate: context.receiptDate || new Date().toISOString().slice(0, 10),
                  sourceGoodsReceiptLineId: line.id,
                });

                await aquaQuickApi.updateGoodsReceiptLine(line.id, {
                  goodsReceiptId: line.goodsReceiptId,
                  itemType: line.itemType,
                  stockId: line.stockId,
                  qtyUnit: line.qtyUnit == null ? undefined : Number(line.qtyUnit),
                  gramPerUnit: line.gramPerUnit == null ? undefined : Number(line.gramPerUnit),
                  totalGram: line.totalGram == null ? undefined : Number(line.totalGram),
                  fishCount: line.fishCount == null ? undefined : Number(line.fishCount),
                  fishAverageGram: line.fishAverageGram == null ? undefined : Number(line.fishAverageGram),
                  fishTotalGram: line.fishTotalGram == null ? undefined : Number(line.fishTotalGram),
                  fishBatchId: fishBatch.id,
                });

                context.fishBatchId = fishBatch.id;
              }
            } catch {
              toast.warning(t('aqua.quickSetup.toast.existingGoodsReceiptMissingBatch'));
            }
          }

          setExistingReceipt(context);
          setGoodsReceiptId(context.receiptId);
          setFishLineId(context.fishLineId);
          setFishBatchId(context.fishBatchId);
          setFishCount(context.fishCount);
          toast.info(t('aqua.quickSetup.toast.existingGoodsReceiptFound'));
        }
      } catch {
        if (!isActive) return;
        toast.warning(t('aqua.quickSetup.toast.existingGoodsReceiptCheckFailed'));
      } finally {
        if (isActive) setIsCheckingExistingReceipt(false);
      }
    })();

    return () => { isActive = false; };
  }, [projectId, t]);

  useEffect(() => {
    if (projectId == null) {
      setAvailableCages([]);
      setSelectedAvailableCageId(null);
      return;
    }

    let isActive = true;
    void (async () => {
      try {
        const cages = await aquaQuickApi.getAvailableCagesForProject(projectId);
        if (!isActive) return;
        setAvailableCages(cages);
      } catch {
        if (!isActive) return;
        setAvailableCages([]);
      }
    })();

    return () => { isActive = false; };
  }, [projectId, projectCages]);

  const allocationRows = useMemo((): CageAllocationRow[] => {
    const cages = Array.isArray(projectCages) ? projectCages : [];
    if (!cages.length) return [];
    if (allocations.length === cages.length) return allocations;
    return cages.map((pc) => {
      const existing = allocations.find((a) => a.projectCageId === pc.id);
      return existing ?? { projectCageId: pc.id, cageCode: pc.cageCode, cageName: pc.cageName, fishCount: 0 };
    });
  }, [projectCages, allocations]);

  const handleCreateProject = async (data: ProjectFormSchema): Promise<void> => {
    try {
      const created = await mutations.createProject.mutateAsync(data);
      setProjectId(created.id);
      toast.success(t('aqua.quickSetup.toast.projectCreated'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickSetup.toast.projectCreateFailed'));
      throw e;
    }
  };

  const handleReceiptSubmit = async (data: { receipt: GoodsReceiptFormSchema; fishLine: FishLineFormSchema; feedLine: FeedLineFormSchema | null; }): Promise<void> => {
    if (projectId == null) return;
    try {
      const existingDraft = existingReceipt?.status === 0 ? existingReceipt : null;
      const headerPayload = { projectId, receiptNo: data.receipt.receiptNo, receiptDate: data.receipt.receiptDate };
      const fishLinePayload = {
        stockId: data.fishLine.stockId,
        itemType: GOODS_RECEIPT_ITEM_TYPE_FISH,
        fishCount: data.fishLine.fishCount,
        fishAverageGram: data.fishLine.currentAverageGram,
        fishTotalGram: data.fishLine.fishCount * data.fishLine.currentAverageGram,
        gramPerUnit: data.fishLine.currentAverageGram,
        totalGram: data.fishLine.fishCount * data.fishLine.currentAverageGram,
      };

      const receipt = existingDraft ? await aquaQuickApi.updateGoodsReceipt(existingDraft.receiptId, headerPayload) : await mutations.createGoodsReceipt.mutateAsync(headerPayload);
      const line = existingDraft?.fishLineId ? await aquaQuickApi.updateGoodsReceiptLine(existingDraft.fishLineId, { goodsReceiptId: receipt.id, fishBatchId: existingDraft.fishBatchId ?? undefined, ...fishLinePayload }) : await mutations.createGoodsReceiptLine.mutateAsync({ goodsReceiptId: receipt.id, ...fishLinePayload });

      let batchId = existingDraft?.fishBatchId ?? null;
      if (batchId == null) {
        const fishBatch = await mutations.createFishBatch.mutateAsync({ projectId, batchCode: data.receipt.receiptNo, fishStockId: data.fishLine.stockId, currentAverageGram: data.fishLine.currentAverageGram, startDate: data.receipt.receiptDate, sourceGoodsReceiptLineId: line.id });
        batchId = fishBatch.id;
      } else {
        await aquaQuickApi.updateFishBatch(batchId, { projectId, batchCode: data.receipt.receiptNo, fishStockId: data.fishLine.stockId, currentAverageGram: data.fishLine.currentAverageGram, startDate: data.receipt.receiptDate, sourceGoodsReceiptLineId: line.id });
      }

      await aquaQuickApi.updateGoodsReceiptLine(line.id, { goodsReceiptId: receipt.id, fishBatchId: batchId, ...fishLinePayload });

      setGoodsReceiptId(receipt.id);
      setFishLineId(line.id);
      setFishBatchId(batchId);
      setFishCount(data.fishLine.fishCount);
      setAllocations([]);
      const refreshed = await aquaQuickApi.getExistingGoodsReceiptContext(projectId);
      if (refreshed) {
        setExistingReceipt(refreshed);
        setGoodsReceiptId(refreshed.receiptId);
        setFishLineId(refreshed.fishLineId);
        setFishBatchId(refreshed.fishBatchId);
        setFishCount(refreshed.fishCount);
      }
      await refetchProjectCages();
      toast.success(existingDraft ? t('aqua.quickSetup.toast.goodsReceiptUpdated') : t('aqua.quickSetup.toast.goodsReceiptCreated'));
      
      if (data.feedLine && data.feedLine.stockId > 0) {
        try {
          await mutations.createGoodsReceiptLine.mutateAsync({ goodsReceiptId: receipt.id, stockId: data.feedLine.stockId, qtyUnit: data.feedLine.qtyUnit });
        } catch (feedErr) {
          toast.warning(feedErr instanceof Error ? feedErr.message : t('aqua.quickSetup.toast.feedLineCreateFailed'));
        }
      }
    } catch (e) {
      if (projectId != null && e instanceof Error && e.message.includes(t('aqua.quickSetup.toast.goodsReceiptAlreadyExists'))) {
        try {
          const context = await aquaQuickApi.getExistingGoodsReceiptContext(projectId);
          if (context) {
            setExistingReceipt(context);
            setGoodsReceiptId(context.receiptId);
            setFishLineId(context.fishLineId);
            setFishBatchId(context.fishBatchId);
            setFishCount(context.fishCount);
            toast.info(t('aqua.quickSetup.toast.existingGoodsReceiptFound'));
            return;
          }
        } catch {}
      }
      toast.error(e instanceof Error ? e.message : t('aqua.quickSetup.toast.goodsReceiptCreateFailed'));
      throw e;
    }
  };

  const handleSaveAndPost = async (): Promise<void> => {
    if (goodsReceiptId == null || fishLineId == null || fishBatchId == null) return;
    try {
      for (const row of allocationRows) {
        if (row.fishCount <= 0) continue;
        await mutations.createFishDistribution.mutateAsync({ goodsReceiptLineId: fishLineId, projectCageId: row.projectCageId, fishBatchId, fishCount: row.fishCount });
      }
      await mutations.postGoodsReceipt.mutateAsync(goodsReceiptId);
      toast.success(t('aqua.quickSetup.toast.savedAndPosted'));
      setGoodsReceiptId(null);
      setFishLineId(null);
      setFishBatchId(null);
      setFishCount(0);
      setAllocations([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickSetup.toast.operationFailed'));
    }
  };

  const handleAddCage = async (): Promise<void> => {
    if (projectId == null || selectedAvailableCageId == null) return;
    try {
      setIsAddingCage(true);
      await aquaQuickApi.addCageToProject(projectId, selectedAvailableCageId);
      await refetchProjectCages();
      const refreshedAvailable = await aquaQuickApi.getAvailableCagesForProject(projectId);
      setAvailableCages(refreshedAvailable);
      setSelectedAvailableCageId(null);
      toast.success(t('aqua.quickSetup.toast.cageAdded', { defaultValue: 'Kafes projeye eklendi.' }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickSetup.toast.cageAddFailed', { defaultValue: 'Kafes eklenemedi.' }));
    } finally {
      setIsAddingCage(false);
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">
            {t('aqua.quickSetup.pageTitle', { defaultValue: 'Hızlı Kurulum' })}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors mt-1">
            {t('aqua.quickSetup.pageDescription', { defaultValue: 'Hızlı kurulum adımlarını tamamlayın.' })}
          </p>
        </div>
      </div>

      {projectId != null && projectCageError instanceof Error && (
        // Yeşil hata kutusunu (Emerald) daha şık bir amber-Deep Blue kutuya çevirdik.
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-blue-950/40 p-4 text-sm font-medium text-amber-600 dark:text-amber-400 backdrop-blur-xl shadow-sm">
          {projectCageError.message}
        </div>
      )}

      {/* DİKKAT: Mor ve yeşil renkler aşağıdaki kart bileşenlerinin içinde saklı! */}
      <ProjectStepCard
        projects={projects}
        isLoadingProjects={isLoadingProjects}
        selectedProjectId={projectId}
        onCreateProject={handleCreateProject}
        onSelectProject={setProjectId}
        isCreating={mutations.createProject.isPending}
      />
      
      <GoodsReceiptStepCard
        projectId={projectId}
        stocks={stocks}
        isLoadingStocks={isLoadingStocks}
        existingReceipt={existingReceipt}
        isCheckingExistingReceipt={isCheckingExistingReceipt}
        onSubmitReceipt={handleReceiptSubmit}
        isSubmitting={mutations.createGoodsReceipt.isPending || mutations.createGoodsReceiptLine.isPending || mutations.createFishBatch.isPending}
      />
      
      {projectId != null && goodsReceiptId != null && fishLineId != null && fishBatchId != null && fishCount > 0 && (existingReceipt == null || existingReceipt.status === 0) && (
        <FishDistributionStepCard
          allocations={allocationRows}
          totalFishCount={fishCount}
          onAllocationsChange={setAllocations}
          onSaveAndPost={handleSaveAndPost}
          isPosting={mutations.createFishDistribution.isPending || mutations.postGoodsReceipt.isPending}
          selectedCageId={selectedCageId}
          onSelectCage={setSelectedCageId}
          availableCages={availableCages}
          selectedAvailableCageId={selectedAvailableCageId}
          onSelectAvailableCage={setSelectedAvailableCageId}
          onAddCage={handleAddCage}
          isAddingCage={isAddingCage}
        />
      )}
    </div>
  );
}
