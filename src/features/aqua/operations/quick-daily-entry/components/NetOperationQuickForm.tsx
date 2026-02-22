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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    defaultValues: { netOperationTypeId: 0, fishBatchId: 0, quantity: 0, unitGram: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<NetOperationQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ netOperationTypeId: 0, fishBatchId: 0, quantity: 0, unitGram: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null;

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
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.netOperation.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(netOperationTypes) ? netOperationTypes : []).map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.code ?? t.name ?? String(t.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.netOperation.selectBatch')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{t('aqua.quickDailyEntry.netOperation.noBatch')}</SelectItem>
                      {(Array.isArray(fishBatches) ? fishBatches : []).map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.netOperation.quantity')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitGram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.netOperation.unitGram')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
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
