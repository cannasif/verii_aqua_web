import { type ReactElement, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProjectStepCard } from './components/ProjectStepCard';
import { GoodsReceiptStepCard } from './components/GoodsReceiptStepCard';
import { FishDistributionStepCard } from './components/FishDistributionStepCard';
import { useProjectListQuery } from './hooks/useProjectListQuery';
import { useStockListQuery } from './hooks/useStockListQuery';
import { useProjectCageListByProjectQuery } from './hooks/useProjectCageListByProjectQuery';
import { useQuickSetupMutations } from './hooks/useQuickSetupMutations';
import type { ProjectFormSchema } from './schema/quick-setup-schema';
import type { GoodsReceiptFormSchema, FishLineFormSchema, FeedLineFormSchema } from './schema/quick-setup-schema';
import { GOODS_RECEIPT_ITEM_TYPE_FISH, type CageAllocationRow } from './types/quick-setup-types';

export function QuickSetupPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [goodsReceiptId, setGoodsReceiptId] = useState<number | null>(null);
  const [fishLineId, setFishLineId] = useState<number | null>(null);
  const [fishBatchId, setFishBatchId] = useState<number | null>(null);
  const [fishCount, setFishCount] = useState<number>(0);
  const [allocations, setAllocations] = useState<CageAllocationRow[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);

  const { data: projects, isLoading: isLoadingProjects } = useProjectListQuery();
  const { data: stocks, isLoading: isLoadingStocks } = useStockListQuery();
  const { data: projectCages } = useProjectCageListByProjectQuery(projectId);
  const mutations = useQuickSetupMutations();

  useEffect(() => {
    setGoodsReceiptId(null);
    setFishLineId(null);
    setFishBatchId(null);
    setFishCount(0);
    setAllocations([]);
    setSelectedCageId(null);
  }, [projectId]);

  const allocationRows = useMemo((): CageAllocationRow[] => {
    const cages = Array.isArray(projectCages) ? projectCages : [];
    if (!cages.length) return [];
    if (allocations.length === cages.length) return allocations;
    return cages.map((pc) => {
      const existing = allocations.find((a) => a.projectCageId === pc.id);
      return (
        existing ?? {
          projectCageId: pc.id,
          cageCode: pc.cageCode,
          cageName: pc.cageName,
          fishCount: 0,
        }
      );
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

  const handleReceiptSubmit = async (data: {
    receipt: GoodsReceiptFormSchema;
    fishLine: FishLineFormSchema;
    feedLine: FeedLineFormSchema | null;
  }): Promise<void> => {
    if (projectId == null) return;
    try {
      const receipt = await mutations.createGoodsReceipt.mutateAsync({
        projectId,
        receiptNo: data.receipt.receiptNo,
        receiptDate: data.receipt.receiptDate,
      });
      const line = await mutations.createGoodsReceiptLine.mutateAsync({
        goodsReceiptId: receipt.id,
        stockId: data.fishLine.stockId,
        itemType: GOODS_RECEIPT_ITEM_TYPE_FISH,
        fishCount: data.fishLine.fishCount,
      });
      const fishBatch = await mutations.createFishBatch.mutateAsync({
        projectId,
        batchCode: data.fishLine.batchCode,
        fishStockId: data.fishLine.stockId,
        currentAverageGram: data.fishLine.currentAverageGram,
        startDate: data.receipt.receiptDate,
        sourceGoodsReceiptLineId: line.id,
      });
      setGoodsReceiptId(receipt.id);
      setFishLineId(line.id);
      setFishBatchId(fishBatch.id);
      setFishCount(data.fishLine.fishCount);
      setAllocations([]);
      toast.success(t('aqua.quickSetup.toast.goodsReceiptCreated'));
      if (data.feedLine && data.feedLine.stockId > 0) {
        try {
          await mutations.createGoodsReceiptLine.mutateAsync({
            goodsReceiptId: receipt.id,
            stockId: data.feedLine.stockId,
            qtyUnit: data.feedLine.qtyUnit,
          });
        } catch (feedErr) {
          toast.warning(
            feedErr instanceof Error ? feedErr.message : t('aqua.quickSetup.toast.feedLineCreateFailed')
          );
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickSetup.toast.goodsReceiptCreateFailed'));
      throw e;
    }
  };

  const handleSaveAndPost = async (): Promise<void> => {
    if (goodsReceiptId == null || fishLineId == null || fishBatchId == null) return;
    try {
      for (const row of allocationRows) {
        if (row.fishCount <= 0) continue;
        await mutations.createFishDistribution.mutateAsync({
          goodsReceiptLineId: fishLineId,
          projectCageId: row.projectCageId,
          fishBatchId,
          fishCount: row.fishCount,
        });
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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">{t('aqua.quickSetup.pageTitle')}</h1>
      <ProjectStepCard
        projects={projects}
        isLoadingProjects={isLoadingProjects}
        onCreateProject={handleCreateProject}
        onSelectProject={setProjectId}
        isCreating={mutations.createProject.isPending}
      />
      <GoodsReceiptStepCard
        projectId={projectId}
        stocks={stocks}
        isLoadingStocks={isLoadingStocks}
        onSubmitReceipt={handleReceiptSubmit}
        isSubmitting={
          mutations.createGoodsReceipt.isPending ||
          mutations.createGoodsReceiptLine.isPending ||
          mutations.createFishBatch.isPending
        }
      />
      {projectId != null && goodsReceiptId != null && fishLineId != null && (
        <FishDistributionStepCard
          allocations={allocationRows}
          totalFishCount={fishCount}
          onAllocationsChange={setAllocations}
          onSaveAndPost={handleSaveAndPost}
          isPosting={mutations.createFishDistribution.isPending || mutations.postGoodsReceipt.isPending}
          selectedCageId={selectedCageId}
          onSelectCage={setSelectedCageId}
        />
      )}
    </div>
  );
}
