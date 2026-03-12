import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { transferQuickFormSchema, type TransferQuickFormSchema } from '../schema/quick-daily-entry-schema';
import { ChevronRight, Save, Info } from 'lucide-react';

export function TransferQuickForm({ projectId, projectCageId, projectCages, sourceBatch, onSubmit, isSubmitting }: any): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<TransferQuickFormSchema>({
    resolver: zodResolver(transferQuickFormSchema) as Resolver<TransferQuickFormSchema>,
    mode: 'onChange',
    defaultValues: { toProjectCageId: 0, fishCount: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<TransferQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset();
  };

  const cageOptions = (projectCages || []).filter((c: any) => c.id !== projectCageId).map((c: any) => ({ value: String(c.id), label: c.cageCode }));

  // AQUA KONSEPT STİLLERİ
  const labelStyle = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-1.5";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";

  return (
    <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-slate-200 dark:border-cyan-800/30 px-6 py-5 bg-slate-50/50 dark:bg-blue-950/30">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          {t('aqua.quickDailyEntry.transfer.title', { defaultValue: 'Cage Transfer' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sourceBatch && (
           <div className="mb-6 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/50 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-cyan-800 dark:text-cyan-300">
                  {t('aqua.quickDailyEntry.transfer.liveCount', { defaultValue: 'Kafesteki Balık:' })} {sourceBatch.liveCount}
                </span>
              </div>
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-500/80">
                {t('aqua.quickDailyEntry.transfer.batch', { defaultValue: 'Batch:' })} {sourceBatch.batchCode}
              </span>
           </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="toProjectCageId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('aqua.quickDailyEntry.transfer.targetCage', { defaultValue: 'Target Cage' })}
                  </FormLabel>
                  <FormControl><Combobox options={cageOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} placeholder={t('common.select', { defaultValue: 'Seçiniz...' })} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )} />
              <FormField control={form.control} name="fishCount" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('aqua.quickDailyEntry.transfer.count', { defaultValue: 'Adet' })}
                  </FormLabel>
                  <FormControl><Input type="number" className={inputStyle} {...field} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )} />
            </div>
            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
              <Button 
                type="submit" 
                disabled={!projectId || !projectCageId || isSubmitting || !form.formState.isValid} 
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 border-0 flex items-center gap-2"
              >
                <Save size={18} />
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
