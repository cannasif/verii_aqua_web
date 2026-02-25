import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { calculateIncrementedAverageGram } from '@/features/aqua/shared/batch-math';
import {
  stockChangeQuickFormSchema,
  type StockChangeQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot, FishBatchDto } from '../types/quick-daily-entry-types';

interface StockChangeQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  fishBatches: FishBatchDto[] | undefined;
  sourceBatch: ActiveCageBatchSnapshot | null;
  onSubmit: (data: StockChangeQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function StockChangeQuickForm({
  projectId,
  projectCageId,
  fishBatches,
  sourceBatch,
  onSubmit,
  isSubmitting,
}: StockChangeQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<StockChangeQuickFormSchema>({
    resolver: zodResolver(stockChangeQuickFormSchema) as Resolver<StockChangeQuickFormSchema>,
    defaultValues: { toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' },
  });

  useEffect(() => {
    form.reset({ toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' });
  }, [projectId, projectCageId]);

  const targetBatches = useMemo(
    () => (Array.isArray(fishBatches) ? fishBatches : []).filter((x) => x.id !== sourceBatch?.fishBatchId),
    [fishBatches, sourceBatch]
  );

  const targetBatchOptions = useMemo(
    () => targetBatches.map((b) => ({ value: String(b.id), label: `Batch #${b.id}` })),
    [targetBatches]
  );
  const newAverageGramValue = Number(form.watch('newAverageGram') || 0);

  const handleSubmit: SubmitHandler<StockChangeQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null || sourceBatch == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('aqua.quickDailyEntry.stockChange.title', { defaultValue: 'Stok Değişimi' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="rounded-md border border-dashed border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              {sourceBatch
                ? t('aqua.quickDailyEntry.stockChange.sourceInfo', {
                    fishBatchId: sourceBatch.fishBatchId,
                    liveCount: sourceBatch.liveCount,
                    defaultValue: `Kaynak batch #${sourceBatch.fishBatchId} - Canlı: ${sourceBatch.liveCount}`,
                  })
                : t('aqua.quickDailyEntry.stockChange.noSourceBatch', {
                    defaultValue: 'Seçili kafeste aktif batch bulunamadı.',
                  })}
            </div>
            <FormField
              control={form.control}
              name="toFishBatchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aqua.quickDailyEntry.stockChange.targetBatch', { defaultValue: 'Hedef Batch' })}
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={targetBatchOptions}
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                      placeholder={t('aqua.quickDailyEntry.netOperation.selectBatch')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.noResults')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fishCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aqua.quickDailyEntry.stockChange.fishCount', { defaultValue: 'Adet' })}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newAverageGram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aqua.quickDailyEntry.stockChange.newAverageGram', { defaultValue: 'Eklenecek Gram' })}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={0.001} step={0.001} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t('aqua.quickDailyEntry.stockChange.gramInfo', {
                      defaultValue: 'Mevcut gram: {{oldGram}} | Eklenecek: {{increase}} | Yeni toplam: {{newGram}}',
                      oldGram: sourceBatch?.averageGram ?? 0,
                      increase: newAverageGramValue,
                      newGram: calculateIncrementedAverageGram(sourceBatch?.averageGram ?? 0, newAverageGramValue),
                    })}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.stockChange.description', { defaultValue: 'Açıklama' })}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.stockChange.save', { defaultValue: 'Kaydet' })}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
