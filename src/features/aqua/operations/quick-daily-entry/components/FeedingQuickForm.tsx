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
import { feedingQuickFormSchema, type FeedingQuickFormSchema } from '../schema/quick-daily-entry-schema';
import type { StockDto } from '../types/quick-daily-entry-types';

interface FeedingQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  stocks: StockDto[] | undefined;
  isLoadingStocks: boolean;
  onSubmit: (data: FeedingQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function FeedingQuickForm({
  projectId,
  projectCageId,
  stocks,
  isLoadingStocks,
  onSubmit,
  isSubmitting,
}: FeedingQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<FeedingQuickFormSchema>({
    resolver: zodResolver(feedingQuickFormSchema) as Resolver<FeedingQuickFormSchema>,
    defaultValues: {
      feedingSlot: 0,
      stockId: 0,
      qtyUnit: 0,
      gramPerUnit: 0,
    },
  });

  const handleSubmit: SubmitHandler<FeedingQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ feedingSlot: 0, stockId: 0, qtyUnit: 0, gramPerUnit: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickDailyEntry.feeding.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedingSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.feeding.slot')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{t('aqua.quickDailyEntry.feeding.morning')}</SelectItem>
                      <SelectItem value="1">{t('aqua.quickDailyEntry.feeding.evening')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.feeding.feedStock')}</FormLabel>
                  <Select
                    disabled={isLoadingStocks}
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.feeding.selectStock')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(stocks) ? stocks : []).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.code ?? s.name ?? String(s.id)}
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
              name="qtyUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.feeding.qty')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gramPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.feeding.gramPerUnit')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.feeding.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
