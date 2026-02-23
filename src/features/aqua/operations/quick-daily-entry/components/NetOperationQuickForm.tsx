import { type ReactElement } from 'react';
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
import {
  netOperationQuickFormSchema,
  type NetOperationQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { FishBatchDto, NetOperationTypeDto } from '../types/quick-daily-entry-types';

interface NetOperationQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  fishBatches: FishBatchDto[] | undefined;
  netOperationTypes: NetOperationTypeDto[] | undefined;
  onSubmit: (data: NetOperationQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function NetOperationQuickForm({
  projectId,
  projectCageId,
  fishBatches,
  netOperationTypes,
  onSubmit,
  isSubmitting,
}: NetOperationQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<NetOperationQuickFormSchema>({
    resolver: zodResolver(netOperationQuickFormSchema) as Resolver<NetOperationQuickFormSchema>,
    defaultValues: { netOperationTypeId: 0, fishBatchId: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<NetOperationQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ netOperationTypeId: 0, fishBatchId: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null;

  const netOperationTypeOptions = (Array.isArray(netOperationTypes) ? netOperationTypes : []).map((typeItem) => ({
    value: String(typeItem.id),
    label: typeItem.code ?? typeItem.name ?? String(typeItem.id),
  }));
  const fishBatchOptions = [
    { value: '0', label: t('aqua.quickDailyEntry.netOperation.noBatch') },
    ...(Array.isArray(fishBatches) ? fishBatches : []).map((b) => ({ value: String(b.id), label: String(b.id) })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickDailyEntry.netOperation.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="netOperationTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.netOperation.operationType')}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={netOperationTypeOptions}
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                      placeholder={t('aqua.quickDailyEntry.netOperation.selectType')}
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
              name="fishBatchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.netOperation.batch')}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={fishBatchOptions}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.netOperation.description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.netOperation.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
