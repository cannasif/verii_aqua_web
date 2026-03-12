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
import { weatherQuickFormSchema, type WeatherQuickFormSchema } from '../schema/quick-daily-entry-schema';
import { ChevronRight, Save } from 'lucide-react'; // İkonlar eklendi

export function WeatherQuickForm({ projectId, severities, onSubmit, isSubmitting }: any): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<WeatherQuickFormSchema>({
    resolver: zodResolver(weatherQuickFormSchema) as Resolver<WeatherQuickFormSchema>,
    mode: 'onChange',
    defaultValues: { weatherSeverityId: 0, weatherTypeId: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<WeatherQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset();
  };

  const severityOptions = (severities || []).map((s: any) => ({ value: String(s.id), label: s.name }));
  const typeOptions = [
    { value: '1', label: t('aqua.quickDailyEntry.weather.options.sunny') },
    { value: '2', label: t('aqua.quickDailyEntry.weather.options.cloudy') },
    { value: '3', label: t('aqua.quickDailyEntry.weather.options.rainy') },
  ];

  // AQUA KONSEPT STİLLERİ
  const labelStyle = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-1.5";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";

  return (
    <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-slate-200 dark:border-cyan-800/30 px-6 py-5 bg-slate-50/50 dark:bg-blue-950/30">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          {t('aqua.quickDailyEntry.weather.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="weatherTypeId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('aqua.quickDailyEntry.weather.title')}
                  </FormLabel>
                  <FormControl><Combobox options={typeOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )} />
              <FormField control={form.control} name="weatherSeverityId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('aqua.quickDailyEntry.weather.severity')}
                  </FormLabel>
                  <FormControl><Combobox options={severityOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('aqua.quickDailyEntry.weather.description')}
                  </FormLabel>
                  <FormControl><Input className={inputStyle} {...field} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )} />
            </div>
            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
              <Button 
                type="submit" 
                disabled={!projectId || isSubmitting || !form.formState.isValid} 
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all duration-200 border-0 flex items-center gap-2"
              >
                <Save size={18} />
                {t('aqua.quickDailyEntry.weather.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
