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
import type { ExistingGoodsReceiptContext, StockDto } from '../types/quick-setup-types';

interface GoodsReceiptStepCardProps {
  projectId: number | null;
  stocks: StockDto[] | undefined;
  isLoadingStocks: boolean;
  existingReceipt: ExistingGoodsReceiptContext | null;
  isCheckingExistingReceipt: boolean;
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
  existingReceipt,
  isCheckingExistingReceipt,
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

  useEffect(() => {
    if (projectId == null) {
      receiptForm.reset({
        receiptNo: '',
        receiptDate: new Date().toISOString().slice(0, 10),
      });
      fishForm.reset({ stockId: 0, fishCount: 0, batchCode: '', currentAverageGram: 0 });
      feedForm.reset({ stockId: 0, qtyUnit: 0 });
      return;
    }

    if (existingReceipt && existingReceipt.status === 0) {
      receiptForm.reset({
        receiptNo: existingReceipt.receiptNo,
        receiptDate: existingReceipt.receiptDate || new Date().toISOString().slice(0, 10),
      });
      fishForm.reset({
        stockId: existingReceipt.fishStockId ?? 0,
        fishCount: existingReceipt.fishCount > 0 ? existingReceipt.fishCount : 0,
        batchCode:
          existingReceipt.fishBatchCode ??
          `${existingReceipt.receiptNo || 'GR'}-${existingReceipt.fishLineId ?? 'LINE'}`,
        currentAverageGram: existingReceipt.fishAverageGram ?? 0,
      });
      feedForm.reset({ stockId: 0, qtyUnit: 0 });
    } else if (!existingReceipt) {
      receiptForm.reset({
        receiptNo: '',
        receiptDate: new Date().toISOString().slice(0, 10),
      });
      fishForm.reset({ stockId: 0, fishCount: 0, batchCode: '', currentAverageGram: 0 });
      feedForm.reset({ stockId: 0, qtyUnit: 0 });
    }
  }, [projectId, existingReceipt, receiptForm, fishForm, feedForm]);

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
  const fishStockLabel =
    existingReceipt?.fishStockId != null
      ? fishStocks.find((x) => x.id === existingReceipt.fishStockId)?.code ??
        fishStocks.find((x) => x.id === existingReceipt.fishStockId)?.name ??
        String(existingReceipt.fishStockId)
      : '-';
  const canContinueDistribution =
    existingReceipt != null &&
    existingReceipt.status === 0 &&
    existingReceipt.fishLineId != null &&
    existingReceipt.fishBatchId != null &&
    existingReceipt.fishCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickSetup.step2Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projectId == null ? (
          <p className="text-muted-foreground text-sm">{t('aqua.quickSetup.selectProjectFirst')}</p>
        ) : isCheckingExistingReceipt ? (
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        ) : existingReceipt?.status === 1 ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm space-y-1">
            <p className="font-medium text-emerald-800">{t('aqua.quickSetup.existingGoodsReceiptFound')}</p>
            <p className="text-emerald-700">
              {t('aqua.quickSetup.receiptNo')}: {existingReceipt.receiptNo}
            </p>
            <p className="text-emerald-700">
              {t('aqua.quickSetup.date')}: {existingReceipt.receiptDate}
            </p>
            <p className="text-emerald-700">
              {t('aqua.quickSetup.stock')}: {fishStockLabel}
            </p>
            <p className="text-emerald-700">
              {t('aqua.quickSetup.count')}: {existingReceipt.fishCount}
            </p>
            <p className="text-emerald-700">
              {t('aqua.quickSetup.currentAverageGram')}: {existingReceipt.fishAverageGram ?? 0}
            </p>
            {existingReceipt.status === 1 && (
              <p className="text-amber-700">{t('aqua.quickSetup.existingGoodsReceiptPostedInfo')}</p>
            )}
            <p className="text-amber-700">{t('aqua.quickSetup.existingGoodsReceiptPostedInfo')}</p>
          </div>
        ) : (
          <Form {...receiptForm}>
            <form onSubmit={receiptForm.handleSubmit(handleSubmit)} className="space-y-4">
              {existingReceipt && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {t('aqua.quickSetup.existingGoodsReceiptFound')}
                </div>
              )}
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
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                {existingReceipt ? t('common.save') : t('aqua.quickSetup.createGoodsReceipt')}
              </Button>
              {existingReceipt && canContinueDistribution && (
                <p className="text-sm text-emerald-700">{t('aqua.quickSetup.readyForDistribution')}</p>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
