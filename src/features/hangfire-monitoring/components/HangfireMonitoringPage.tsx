import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Activity, CheckCircle2, XCircle, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import {
  useHangfireDeadLetterQuery,
  useHangfireFailedJobsQuery,
  useHangfireStatsQuery,
} from '../hooks/useHangfireMonitoring';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function HangfireMonitoringPage(): ReactElement {
  const { t } = useTranslation(['hangfire-monitoring', 'common']);
  const { setPageTitle } = useUIStore();

  const [failedPage, setFailedPage] = useState(1);
  const [deadLetterPage, setDeadLetterPage] = useState(1);

  const failedFrom = (failedPage - 1) * PAGE_SIZE;
  const deadLetterFrom = (deadLetterPage - 1) * PAGE_SIZE;

  const statsQuery = useHangfireStatsQuery();
  const failedQuery = useHangfireFailedJobsQuery(failedFrom, PAGE_SIZE);
  const deadLetterQuery = useHangfireDeadLetterQuery(deadLetterFrom, PAGE_SIZE);

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const isRefreshing = statsQuery.isRefetching || failedQuery.isRefetching || deadLetterQuery.isRefetching;

  const handleRefresh = async (): Promise<void> => {
    await Promise.all([
      statsQuery.refetch(),
      failedQuery.refetch(),
      deadLetterQuery.refetch(),
    ]);
  };

  const failedTotalPages = Math.max(1, Math.ceil((failedQuery.data?.total ?? 0) / PAGE_SIZE));
  const deadLetterHasNext = (deadLetterQuery.data?.items?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="w-full space-y-8 pb-10">
      <Breadcrumb
        items={[
          { label: t('common:sidebar.accessControl') },
          { label: t('menu'), isActive: true },
        ]}
      />

      {/* Sayfa Başlığı ve Refresh Butonu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
            <Activity className="size-6 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none">
              {t('title')}
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('description')}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 h-11 px-6 rounded-xl transition-all"
        >
          <RefreshCw size={18} className={cn("mr-2", isRefreshing && "animate-spin")} />
          {t('refresh')}
        </Button>
      </div>

      {/* İstatistik Kartları (Karanlık Cam Efekti) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Enqueued */}
        <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group hover:border-blue-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('stats.enqueued')}</p>
                <h3 className="text-3xl font-extrabold text-white mt-2 tabular-nums">{statsQuery.data?.enqueued ?? 0}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Clock className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group hover:border-amber-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('stats.processing')}</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-2 tabular-nums">{statsQuery.data?.processing ?? 0}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <PlayCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Succeeded */}
        <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group hover:border-emerald-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('stats.succeeded')}</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2 tabular-nums">{statsQuery.data?.succeeded ?? 0}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="relative overflow-hidden border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl group hover:border-rose-500/40 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.05)]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-300/70">{t('stats.failed')}</p>
                <h3 className="text-3xl font-extrabold text-rose-500 mt-2 tabular-nums">{statsQuery.data?.failed ?? 0}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <XCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Başarısız İşler Tablosu */}
      <div className="bg-[#1a1025]/60 backdrop-blur-xl border border-rose-500/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 bg-white/2 flex items-center gap-3">
          <XCircle className="size-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white tracking-tight">{t('failed.title')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase text-slate-400 px-6">{t('table.jobId')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.jobName')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.state')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.time')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(failedQuery.data?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-12 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="size-8 text-emerald-500/50" />
                      <span>{t('failed.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (failedQuery.data?.items ?? []).map((item) => (
                  <TableRow key={`failed-${item.jobId}`} className="border-b border-white/5 hover:bg-white/2 group transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400 px-6">#{item.jobId}</TableCell>
                    <TableCell className="font-medium text-slate-200">{item.jobName}</TableCell>
                    <TableCell>
                      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20">{item.state || 'Failed'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{formatDate(item.failedAt)}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs text-slate-500 group-hover:text-slate-300 transition-colors" title={item.reason}>{item.reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#0b0713]/50 border-t border-white/5 gap-4">
          <span className="text-xs font-medium text-slate-500">
            {t('failed.total')}: <span className="text-rose-400 font-bold">{failedQuery.data?.total ?? 0}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={failedPage <= 1} onClick={() => setFailedPage((p) => Math.max(1, p - 1))} className="h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5">
              {t('common:common.previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={failedPage >= failedTotalPages} onClick={() => setFailedPage((p) => Math.min(failedTotalPages, p + 1))} className="h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5">
              {t('common:common.next')}
            </Button>
          </div>
        </div>
      </div>

      {/* Dead Letter (İptal Edilmiş) İşler Tablosu */}
      <div className="bg-[#1a1025]/60 backdrop-blur-xl border border-amber-500/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">{t('deadLetter.title')}</h2>
          </div>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            {t('deadLetter.enqueued')}: {deadLetterQuery.data?.enqueued ?? 0}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase text-slate-400 px-6">{t('table.jobId')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.jobName')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.state')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.time')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">{t('table.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deadLetterQuery.data?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-12 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="size-8 text-emerald-500/50" />
                      <span>{t('deadLetter.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (deadLetterQuery.data?.items ?? []).map((item) => (
                  <TableRow key={`dead-${item.jobId}`} className="border-b border-white/5 hover:bg-white/2 group transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400 px-6">#{item.jobId}</TableCell>
                    <TableCell className="font-medium text-slate-200">{item.jobName}</TableCell>
                    <TableCell>
                      <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">{item.state || 'Enqueued'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{formatDate(item.enqueuedAt)}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs text-slate-500 group-hover:text-slate-300 transition-colors" title={item.reason}>{item.reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end px-6 py-4 bg-[#0b0713]/50 border-t border-white/5 gap-2">
          <Button variant="outline" size="sm" disabled={deadLetterPage <= 1} onClick={() => setDeadLetterPage((p) => Math.max(1, p - 1))} className="h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5">
            {t('common:common.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled={!deadLetterHasNext} onClick={() => setDeadLetterPage((p) => p + 1)} className="h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5">
            {t('common:common.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}