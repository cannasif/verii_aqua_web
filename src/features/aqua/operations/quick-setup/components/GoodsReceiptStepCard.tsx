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
  goodsReceiptFormSchema,
  fishLineFormSchema,
  feedLineFormSchema,
  type GoodsReceiptFormSchema,
  type FishLineFormSchema,
  type FeedLineFormSchema,
} from '../schema/quick-setup-schema';
import type { StockDto } from '../types/quick-setup-types';

interface GoodsReceiptStepCardProps {
  projectId: number | null;
  stocks: StockDto[] | undefined;
  isLoadingStocks: boolean;
  onSubmitReceipt: (data: {
    receipt: GoodsReceiptFormSchema;
    fishLine: FishLineFormSchema;
    feedLine: FeedLineFormSchema | null;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function GoodsReceiptStepCard({
  projectId,
  stocks,
  isLoadingStocks,
  onSubmitReceipt,
  isSubmitting,
}: GoodsReceiptStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const receiptForm = useForm<GoodsReceiptFormSchema>({
    resolver: zodResolver(goodsReceiptFormSchema) as Resolver<GoodsReceiptFormSchema>,
    defaultValues: {
      receiptNo: '',
      receiptDate: new Date().toISOString().slice(0, 10),
    },
  });

  const fishForm = useForm<FishLineFormSchema>({
    resolver: zodResolver(fishLineFormSchema) as Resolver<FishLineFormSchema>,
    defaultValues: { stockId: 0, fishCount: 0, batchCode: '', currentAverageGram: 0 },
  });

  const feedForm = useForm<FeedLineFormSchema>({
    resolver: zodResolver(feedLineFormSchema) as Resolver<FeedLineFormSchema>,
    defaultValues: { stockId: 0, qtyUnit: 0 },
  });

  const handleSubmit: SubmitHandler<GoodsReceiptFormSchema> = async (receiptData) => {
    const fishValid = await fishForm.trigger();
    if (!fishValid) return;
    const feedVal = feedForm.getValues();
    const hasFeed = feedVal.stockId > 0;
    if (hasFeed) {
      const feedValid = await feedForm.trigger();
      if (!feedValid) return;
    }
    const fishData = fishForm.getValues();
    const feedData = hasFeed
      ? { stockId: feedVal.stockId, qtyUnit: feedVal.qtyUnit }
      : null;
    await onSubmitReceipt({ receipt: receiptData, fishLine: fishData, feedLine: feedData });
  };

  const fishStocks = Array.isArray(stocks) ? stocks.filter((s) => s.id) : [];
  const feedStocks = fishStocks;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickSetup.step2Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projectId == null ? (
          <p className="text-muted-foreground text-sm">{t('aqua.quickSetup.selectProjectFirst')}</p>
        ) : (
          <Form {...receiptForm}>
            <form onSubmit={receiptForm.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={receiptForm.control}
                name="receiptNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aqua.quickSetup.receiptNo')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={receiptForm.control}
                name="receiptDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aqua.quickSetup.date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded border p-3 space-y-3">
                <span className="text-sm font-medium">{t('aqua.quickSetup.fishLine')}</span>
                <Form {...fishForm}>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={fishForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.stock')}</FormLabel>
                          <Select
                            disabled={isLoadingStocks}
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('aqua.quickSetup.selectStock')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fishStocks.map((s) => (
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
                      control={fishForm.control}
                      name="fishCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.count')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fishForm.control}
                      name="batchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.batchCode')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fishForm.control}
                      name="currentAverageGram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.currentAverageGram')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
              <div className="rounded border p-3 space-y-3">
                <span className="text-sm font-medium">{t('aqua.quickSetup.feedLineOptional')}</span>
                <Form {...feedForm}>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={feedForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.stock')}</FormLabel>
                          <Select
                            disabled={isLoadingStocks}
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('aqua.quickSetup.selectFeedStock')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {feedStocks.map((s) => (
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
                      control={feedForm.control}
                      name="qtyUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('aqua.quickSetup.qty')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {t('aqua.quickSetup.createGoodsReceipt')}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
