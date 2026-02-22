import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { useProjectListQuery } from './hooks/useProjectListQuery';
import { useProjectCageListByProjectQuery } from './hooks/useProjectCageListByProjectQuery';
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
} from './hooks/useQuickDailyEntryMutations';
import type { FeedingQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { MortalityQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { WeatherQuickFormSchema } from './schema/quick-daily-entry-schema';
import type { NetOperationQuickFormSchema } from './schema/quick-daily-entry-schema';
import {
  formatFeedingNo,
  formatNetOperationNo,
  localDateString,
} from './utils/quick-operations';

export function QuickDailyEntryPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectCageId, setProjectCageId] = useState<number | null>(null);

  const { data: projects } = useProjectListQuery();
  const { data: projectCages } = useProjectCageListByProjectQuery(projectId);
  const { data: stocks, isLoading: isLoadingStocks } = useStockListQuery();
  const { data: fishBatches, isLoading: isLoadingBatches } =
    useFishBatchListByProjectQuery(projectId);
  const { data: weatherSeverities } = useWeatherSeverityListQuery();
  const { data: netOperationTypes } = useNetOperationTypeListQuery();

  const createFeeding = useCreateFeedingMutation();
  const createFeedingLine = useCreateFeedingLineMutation();
  const createMortality = useCreateMortalityMutation();
  const createMortalityLine = useCreateMortalityLineMutation();
  const createDailyWeather = useCreateDailyWeatherMutation();
  const createNetOperation = useCreateNetOperationMutation();
  const createNetOperationLine = useCreateNetOperationLineMutation();

  const handleProjectChange = (value: string): void => {
    const id = value ? Number(value) : null;
    setProjectId(id);
    setProjectCageId(null);
  };

  const handleCageChange = (value: string): void => {
    setProjectCageId(value ? Number(value) : null);
  };

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
      await createFeedingLine.mutateAsync({
        feedingId: feeding.id,
        stockId: data.stockId,
        qtyUnit: data.qtyUnit,
        gramPerUnit: data.gramPerUnit,
        totalGram: data.qtyUnit * data.gramPerUnit,
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
      const mortalityDate = localDateString();
      const existingHeader = await aquaQuickDailyApi.findMortalityHeaderByProjectAndDate(
        projectId,
        mortalityDate
      );
      const mortality =
        existingHeader ??
        (await createMortality.mutateAsync({
          projectId,
          mortalityDate,
          status: 1,
        }));
      await createMortalityLine.mutateAsync({
        mortalityId: mortality.id,
        fishBatchId: data.fishBatchId,
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
        existingHeader ??
        (await createNetOperation.mutateAsync({
          projectId,
          operationTypeId: data.netOperationTypeId,
          operationNo: formatNetOperationNo(),
          operationDate,
          status: 1,
          note: data.description,
        }));
      await createNetOperationLine.mutateAsync({
        netOperationId: netOperation.id,
        projectCageId,
        fishBatchId: data.fishBatchId > 0 ? data.fishBatchId : undefined,
        quantity: data.quantity,
        unitGram: data.unitGram > 0 ? data.unitGram : undefined,
        note: data.description,
      });
      toast.success(t('aqua.quickDailyEntry.toast.netOperationSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed'));
      throw e;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">{t('aqua.quickDailyEntry.pageTitle')}</h1>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2 min-w-[200px]">
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
        <div className="space-y-2 min-w-[200px]">
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
              {(Array.isArray(projectCages) ? projectCages : []).map((pc) => (
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
            fishBatches={fishBatches}
            isLoadingBatches={isLoadingBatches}
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
      />
    </div>
  );
}
