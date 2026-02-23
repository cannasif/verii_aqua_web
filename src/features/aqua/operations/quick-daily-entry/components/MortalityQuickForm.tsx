import { type ReactElement, useEffect } from 'react';
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
  mortalityQuickFormSchema,
  type MortalityQuickFormSchema,
} from '../schema/quick-daily-entry-schema';

interface MortalityQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  onSubmit: (data: MortalityQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function MortalityQuickForm({
  projectId,
  projectCageId,
  onSubmit,
  isSubmitting,
}: MortalityQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<MortalityQuickFormSchema>({
    resolver: zodResolver(mortalityQuickFormSchema) as Resolver<MortalityQuickFormSchema>,
    defaultValues: { deadCount: 0 },
  });

  useEffect(() => {
    form.reset({ deadCount: 0 });
  }, [projectId, projectCageId]);

  const handleSubmit: SubmitHandler<MortalityQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ deadCount: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickDailyEntry.mortality.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="rounded-md border border-dashed border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {t('aqua.quickDailyEntry.mortality.autoBatchInfo', {
                defaultValue: 'Batch kafes eşleşmesine göre otomatik seçilecektir.',
              })}
            </div>
            <FormField
              control={form.control}
              name="deadCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.mortality.deadCount')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.mortality.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
