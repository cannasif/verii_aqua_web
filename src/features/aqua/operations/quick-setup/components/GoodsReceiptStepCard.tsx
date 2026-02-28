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
import { Combobox } from '@/components/ui/combobox';
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
  const fishStockOptions = fishStocks.map((s) => ({
    value: String(s.id),
    label: s.code ?? s.name ?? String(s.id),
  }));
  const feedStockOptions = feedStocks.map((s) => ({
    value: String(s.id),
    label: s.code ?? s.name ?? String(s.id),
  }));
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
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickSetup.step2Title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {projectId == null ? (
          <p className="text-slate-500 text-sm">{t('aqua.quickSetup.selectProjectFirst')}</p>
        ) : isCheckingExistingReceipt ? (
          <div className="flex items-center gap-3">
             <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-pink-500" />
             <p className="text-slate-400 text-sm">{t('common.loading')}</p>
          </div>
        ) : existingReceipt?.status === 1 ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm space-y-2 backdrop-blur-md">
            <p className="font-semibold text-emerald-400 mb-3">{t('aqua.quickSetup.existingGoodsReceiptFound')}</p>
            <div className="grid grid-cols-2 gap-4">
                <p className="text-emerald-500/80"><span className="text-emerald-500/50">{t('aqua.quickSetup.receiptNo')}:</span> {existingReceipt.receiptNo}</p>
                <p className="text-emerald-500/80"><span className="text-emerald-500/50">{t('aqua.quickSetup.date')}:</span> {existingReceipt.receiptDate}</p>
                <p className="text-emerald-500/80"><span className="text-emerald-500/50">{t('aqua.quickSetup.stock')}:</span> {fishStockLabel}</p>
                <p className="text-emerald-500/80"><span className="text-emerald-500/50">{t('aqua.quickSetup.count')}:</span> {existingReceipt.fishCount}</p>
                <p className="text-emerald-500/80"><span className="text-emerald-500/50">{t('aqua.quickSetup.currentAverageGram')}:</span> {existingReceipt.fishAverageGram ?? 0}</p>
            </div>
            <p className="text-amber-500/90 mt-4 pt-4 border-t border-emerald-500/10">{t('aqua.quickSetup.existingGoodsReceiptPostedInfo')}</p>
          </div>
        ) : (
          <Form {...receiptForm}>
            <form onSubmit={receiptForm.handleSubmit(handleSubmit)} className="space-y-6">
              {existingReceipt && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 backdrop-blur-md">
                  {t('aqua.quickSetup.existingGoodsReceiptFound')}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={receiptForm.control}
                    name="receiptNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400">{t('aqua.quickSetup.receiptNo')}</FormLabel>
                        <FormControl>
                          <Input className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
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
                        <FormLabel className="text-slate-400">{t('aqua.quickSetup.date')}</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/2 p-5 space-y-5">
                <h3 className="text-sm font-semibold text-white">{t('aqua.quickSetup.fishLine')}</h3>
                <Form {...fishForm}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={fishForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.stock')}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={fishStockOptions}
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                              placeholder={t('aqua.quickSetup.selectStock')}
                              searchPlaceholder={t('common.search')}
                              emptyText={t('common.noResults')}
                              disabled={isLoadingStocks}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fishForm.control}
                      name="fishCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.count')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
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
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.batchCode')}</FormLabel>
                          <FormControl>
                            <Input className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
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
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.currentAverageGram')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/2 p-5 space-y-5">
                <h3 className="text-sm font-semibold text-white">{t('aqua.quickSetup.feedLineOptional')}</h3>
                <Form {...feedForm}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={feedForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.stock')}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={feedStockOptions}
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                              placeholder={t('aqua.quickSetup.selectFeedStock')}
                              searchPlaceholder={t('common.search')}
                              emptyText={t('common.noResults')}
                              disabled={isLoadingStocks}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={feedForm.control}
                      name="qtyUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">{t('aqua.quickSetup.qty')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>

              <div className="pt-2 flex items-center justify-between">
                  <Button type="submit" disabled={isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20">
                    {existingReceipt ? t('common.save') : t('aqua.quickSetup.createGoodsReceipt')}
                  </Button>
                  {existingReceipt && canContinueDistribution && (
                    <p className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">{t('aqua.quickSetup.readyForDistribution')}</p>
                  )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}