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
import { Check, Loader2 } from 'lucide-react';

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
    defaultValues: { stockId: 0, fishCount: 0, currentAverageGram: 0 },
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
      fishForm.reset({ stockId: 0, fishCount: 0, currentAverageGram: 0 });
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
        currentAverageGram: existingReceipt.fishAverageGram ?? 0,
      });
      feedForm.reset({ stockId: 0, qtyUnit: 0 });
    } else if (!existingReceipt) {
      receiptForm.reset({
        receiptNo: '',
        receiptDate: new Date().toISOString().slice(0, 10),
      });
      fishForm.reset({ stockId: 0, fishCount: 0, currentAverageGram: 0 });
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
    // Mor zemin `#1a1025` silindi, yerine Deep Blue teması (`blue-950`) eklendi
    <Card className="bg-card dark:bg-blue-950/60 dark:backdrop-blur-xl border border-border dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-cyan-800/30 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-pink-100 border border-pink-200 dark:bg-pink-500/20 flex items-center justify-center dark:border-pink-500/30">
            <span className="text-pink-600 dark:text-pink-400 text-sm font-black">2</span>
          </div>
          {t('aqua.quickSetup.step2Title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {projectId == null ? (
          <p className="text-muted-foreground text-sm font-medium">{t('aqua.quickSetup.selectProjectFirst')}</p>
        ) : isCheckingExistingReceipt ? (
          <div className="flex items-center gap-3">
             <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
             <p className="text-muted-foreground text-sm font-medium">{t('common.loading')}</p>
          </div>
        ) : existingReceipt?.status === 1 ? (
          // DİKKAT: Yeşil hata kutusu (Emerald) silindi, Deep Blue slate temasından gelir
          // Hata ikonları da (Check) pembe yapıldı.
          <div className="rounded-xl border border-border dark:border-cyan-800/30 bg-muted/30 dark:bg-white/2 p-5 text-sm space-y-2 dark:backdrop-blur-md relative overflow-hidden group">
            <Check className="absolute -bottom-2 -right-2 h-16 w-16 text-pink-500/10 group-hover:scale-110 transition-transform" strokeWidth={3} />
            <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
               <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30">
                   <Check className="h-4 w-4 text-pink-600 dark:text-pink-400" />
               </span>
               {t('aqua.quickSetup.existingGoodsReceiptFound')}
            </p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                <p className="text-slate-700 dark:text-slate-300"><span className="text-muted-foreground">{t('aqua.quickSetup.receiptNo')}:</span> {existingReceipt.receiptNo}</p>
                <p className="text-slate-700 dark:text-slate-300"><span className="text-muted-foreground">{t('aqua.quickSetup.date')}:</span> {existingReceipt.receiptDate}</p>
                <p className="text-slate-700 dark:text-slate-300"><span className="text-muted-foreground">{t('aqua.quickSetup.stock')}:</span> {fishStockLabel}</p>
                <p className="text-slate-700 dark:text-slate-300"><span className="text-muted-foreground">{t('aqua.quickSetup.count')}:</span> {existingReceipt.fishCount}</p>
                <p className="text-slate-700 dark:text-slate-300"><span className="text-muted-foreground">{t('aqua.quickSetup.currentAverageGram')}:</span> {existingReceipt.fishAverageGram ?? 0}</p>
            </div>
            {/* Amber uyarı metnini koruduk, Deep Blue slate üzerinde şık durur */}
            <p className="text-amber-600 dark:text-amber-400 mt-4 pt-4 border-t border-border dark:border-cyan-800/20 font-medium">{t('aqua.quickSetup.existingGoodsReceiptPostedInfo')}</p>
          </div>
        ) : (
          <Form {...receiptForm}>
            <form onSubmit={receiptForm.handleSubmit(handleSubmit)} className="space-y-6">
              {existingReceipt && (
                // Yeşil hata kutusu (Emerald) silindi, Deep Blue slate temasından gelir
                <div className="rounded-xl border border-border dark:border-cyan-800/30 bg-muted/30 dark:bg-white/2 p-4 text-sm text-foreground font-medium dark:backdrop-blur-md">
                  {t('aqua.quickSetup.existingGoodsReceiptFound')}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={receiptForm.control}
                    name="receiptNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.receiptNo')}</FormLabel>
                        <FormControl>
                          {/* Mor zemin `#0b0713` silindi */}
                          <Input className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={receiptForm.control}
                    name="receiptDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.date')}</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl dark:[&::-webkit-calendar-picker-indicator]:invert" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Dış kutuların morumsu rengi `#1a1025` silindi, bg-white/2 Deep Blue slate temasından gelir */}
              <div className="rounded-xl border border-border dark:border-cyan-800/30 bg-muted/30 dark:bg-white/2 p-5 space-y-5">
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">{t('aqua.quickSetup.fishLine')}</h3>
                <Form {...fishForm}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={fishForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.stock')}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={fishStockOptions}
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                              placeholder={t('aqua.quickSetup.selectStock')}
                              searchPlaceholder={t('common.search')}
                              emptyText={t('common.noResults')}
                              disabled={isLoadingStocks}
                              className="w-full bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 h-11 rounded-xl text-foreground"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fishForm.control}
                      name="fishCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.count')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fishForm.control}
                      name="currentAverageGram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.currentAverageGram')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>

              {/* Dış kutuların morumsu rengi `#1a1025` silindi, bg-white/2 Deep Blue slate temasından gelir */}
              <div className="rounded-xl border border-border dark:border-cyan-800/30 bg-muted/30 dark:bg-white/2 p-5 space-y-5">
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">{t('aqua.quickSetup.feedLineOptional')}</h3>
                <Form {...feedForm}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={feedForm.control}
                      name="stockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.stock')}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={feedStockOptions}
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                              placeholder={t('aqua.quickSetup.selectFeedStock')}
                              searchPlaceholder={t('common.search')}
                              emptyText={t('common.noResults')}
                              disabled={isLoadingStocks}
                              className="w-full bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 h-11 rounded-xl text-foreground"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={feedForm.control}
                      name="qtyUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.qty')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>

              <div className="pt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Butondaki pembe-turuncu gradyanı koruduk */}
                  <Button type="submit" disabled={isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20 font-bold w-full sm:w-auto transition-all">
                    {existingReceipt ? t('common.save') : t('aqua.quickSetup.createGoodsReceipt')}
                  </Button>
                  {existingReceipt && canContinueDistribution && (
                    <p className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-center w-full sm:w-auto">
                      {t('aqua.quickSetup.readyForDistribution')}
                    </p>
                  )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
