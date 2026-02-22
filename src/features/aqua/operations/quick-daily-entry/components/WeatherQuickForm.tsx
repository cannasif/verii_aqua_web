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
  weatherQuickFormSchema,
  type WeatherQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { WeatherSeverityDto } from '../types/quick-daily-entry-types';
import { useWeatherTypeListBySeverityQuery } from '../hooks/useWeatherTypeListBySeverityQuery';

interface WeatherQuickFormProps {
  projectId: number | null;
  severities: WeatherSeverityDto[] | undefined;
  onSubmit: (data: WeatherQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function WeatherQuickForm({
  projectId,
  severities,
  onSubmit,
  isSubmitting,
}: WeatherQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<WeatherQuickFormSchema>({
    resolver: zodResolver(weatherQuickFormSchema) as Resolver<WeatherQuickFormSchema>,
    defaultValues: {
      weatherSeverityId: 0,
      weatherTypeId: 0,
      description: '',
    },
  });

  const { data: types, isLoading: isLoadingTypes } = useWeatherTypeListBySeverityQuery();

  const handleSubmit: SubmitHandler<WeatherQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ weatherSeverityId: 0, weatherTypeId: 0, description: '' });
  };

  const disabled = projectId == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickDailyEntry.weather.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="weatherSeverityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.weather.severity')}</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(Number(v));
                      form.setValue('weatherTypeId', 0);
                    }}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.weather.selectSeverity')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(severities) ? severities : []).map((s) => (
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
              name="weatherTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.weather.type')}</FormLabel>
                  <Select
                    disabled={isLoadingTypes}
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.weather.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(types) ? types : []).map((t) => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.weather.description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.weather.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
