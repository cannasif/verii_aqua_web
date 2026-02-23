import { type ReactElement, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageDailyRow, CageProjectReport } from '../types/project-detail-report-types';

const REPORT_QUERY_KEY = ['aqua', 'reports', 'project-detail'] as const;
type DetailType = 'netOperation' | 'transfer' | 'weighing' | 'stockConvert';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function CageSummaryCards({ cage, t }: { cage: CageProjectReport; t: (key: string) => string }): ReactElement {
  const stockRatio =
    cage.initialFishCount > 0
      ? clampPercent((cage.currentFishCount / cage.initialFishCount) * 100)
      : 0;

  return (
    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.initialFish')}</p>
          <p className="text-xl font-semibold text-emerald-700">{formatNumber(cage.initialFishCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-sky-200/60 bg-gradient-to-br from-sky-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.currentFish')}</p>
          <p className="text-xl font-semibold text-sky-700">{formatNumber(cage.currentFishCount)}</p>
          <div className="mt-2 h-2 w-full rounded-full bg-sky-100">
            <div className="h-2 rounded-full bg-sky-500" style={{ width: `${stockRatio}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.initialAverageGram')}</p>
          <p className="text-xl font-semibold text-indigo-700">{formatNumber(cage.initialAverageGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.currentAverageGram')}</p>
          <p className="text-xl font-semibold text-violet-700">{formatNumber(cage.currentAverageGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.initialBiomassGram')}</p>
          <p className="text-xl font-semibold text-cyan-700">{formatNumber(cage.initialBiomassGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.currentBiomassGram')}</p>
          <p className="text-xl font-semibold text-blue-700">{formatNumber(cage.currentBiomassGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.totalDead')}</p>
          <p className="text-xl font-semibold text-rose-700">{formatNumber(cage.totalDeadCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.totalFeedGram')}</p>
          <p className="text-xl font-semibold text-amber-700">{formatNumber(cage.totalFeedGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-teal-200/60 bg-gradient-to-br from-teal-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.totalCountDelta')}</p>
          <p className="text-xl font-semibold text-teal-700">{formatNumber(cage.totalCountDelta)}</p>
        </CardContent>
      </Card>
      <Card className="border-fuchsia-200/60 bg-gradient-to-br from-fuchsia-50 to-white">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">{t('aqua.projectDetailReport.totalBiomassDelta')}</p>
          <p className="text-xl font-semibold text-fuchsia-700">{formatNumber(cage.totalBiomassDelta)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectDetailReportPage(): ReactElement {
  const { t } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
  });

  const openDetailDialog = (cage: CageProjectReport, row: CageDailyRow, type: DetailType): void => {
    const titleMap: Record<DetailType, string> = {
      netOperation: t('aqua.projectDetailReport.netOps'),
      transfer: t('aqua.projectDetailReport.transfers'),
      weighing: t('aqua.projectDetailReport.weighings'),
      stockConvert: t('aqua.projectDetailReport.stockConverts'),
    };
    const detailMap: Record<DetailType, string[]> = {
      netOperation: row.netOperationDetails,
      transfer: row.transferDetails,
      weighing: row.weighingDetails,
      stockConvert: row.stockConvertDetails,
    };
    const items = detailMap[type];
    if (items.length === 0) return;

    setDetailDialog({
      open: true,
      title: `${titleMap[type]} - ${cage.cageLabel}`,
      description: `${t('aqua.projectDetailReport.date')}: ${row.date}`,
      items,
    });
  };

  const projectsQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, 'projects'] as const,
    queryFn: () => projectDetailReportApi.getProjects(),
    staleTime: 5 * 60 * 1000,
  });

  const reportQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, projectId] as const,
    queryFn: () => projectDetailReportApi.getProjectDetailReport(projectId!),
    enabled: projectId != null,
    staleTime: 30 * 1000,
  });

  const sortedProjects = useMemo(() => {
    const list = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
    return [...list].sort((a, b) => String(a.projectCode ?? '').localeCompare(String(b.projectCode ?? '')));
  }, [projectsQuery.data]);

  return (
    <div className="space-y-6">
      <Card className="border-cyan-200/70 bg-gradient-to-r from-cyan-50 via-sky-50 to-white">
        <CardHeader>
          <CardTitle>{t('aqua.projectDetailReport.pageTitle')}</CardTitle>
          <CardDescription>{t('aqua.projectDetailReport.description')}</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select
            value={projectId != null ? String(projectId) : undefined}
            onValueChange={(value) => setProjectId(value ? Number(value) : null)}
            disabled={projectsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('aqua.projectDetailReport.selectProject')} />
            </SelectTrigger>
            <SelectContent>
              {sortedProjects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.projectCode} - {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {projectId == null && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('aqua.projectDetailReport.pickProjectFirst')}
          </CardContent>
        </Card>
      )}

      {reportQuery.isLoading && projectId != null && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('common.loading')}
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-sm text-rose-700">
            {(reportQuery.error as Error).message}
          </CardContent>
        </Card>
      )}

      {reportQuery.data && (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportQuery.data.project.projectCode} - {reportQuery.data.project.projectName}
            </CardTitle>
            <CardDescription>
              {t('aqua.projectDetailReport.totalCages', { defaultValue: 'Toplam Aktif Kafes' })}: {reportQuery.data.cages.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportQuery.data.cages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  {t('aqua.projectDetailReport.noActiveCages', { defaultValue: 'Aktif kafes bulunamadı.' })}
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {reportQuery.data.cages.map((cage) => (
                  <AccordionItem key={cage.projectCageId} value={`cage-${cage.projectCageId}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full flex-wrap items-center justify-between gap-3 pr-4">
                        <div className="text-left">
                          <p className="font-semibold">{cage.cageLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('aqua.projectDetailReport.currentVsInitial')}:{' '}
                            {formatNumber(cage.currentFishCount)} / {formatNumber(cage.initialFishCount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {t('aqua.projectDetailReport.dead')}: {formatNumber(cage.totalDeadCount)}
                          </Badge>
                          <Badge variant="outline">
                            {t('aqua.projectDetailReport.missingFeedDays')}:{' '}
                            {cage.missingFeedingDays.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <CageSummaryCards cage={cage} t={t} />

                      <Card className="border-dashed">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {t('aqua.projectDetailReport.missingFeedingDates')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {cage.missingFeedingDays.length === 0 ? (
                            <p className="text-sm text-emerald-700">
                              {t('aqua.projectDetailReport.noMissingFeedDay')}
                            </p>
                          ) : (
                            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                              {cage.missingFeedingDays.slice(0, 90).map((day) => (
                                <Badge key={day} variant="destructive">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {t('aqua.projectDetailReport.dailyDetails')}
                          </CardTitle>
                          <CardDescription>{t('aqua.projectDetailReport.dailyDetailsHint')}</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('aqua.projectDetailReport.date')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.feedGram')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.deadCount')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.countDelta')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.biomassDelta')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.weather')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.netOps')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.transfers')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.weighings')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.stockConverts')}</TableHead>
                                <TableHead>{t('aqua.projectDetailReport.feedStatus')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {cage.dailyRows.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={11} className="text-center text-muted-foreground">
                                  {t('common.noData')}
                                </TableCell>
                              </TableRow>
                            )}
                            {cage.dailyRows.slice(0, 45).map((row) => (
                              <TableRow key={`${cage.projectCageId}-${row.date}`}>
                                <TableCell>{row.date}</TableCell>
                                <TableCell>{formatNumber(row.feedGram)}</TableCell>
                                <TableCell>{formatNumber(row.deadCount)}</TableCell>
                                <TableCell>{formatNumber(row.countDelta)}</TableCell>
                                <TableCell>{formatNumber(row.biomassDelta)}</TableCell>
                                <TableCell className="max-w-[260px] truncate">{row.weather}</TableCell>
                                <TableCell>
                                  {row.netOperationCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openDetailDialog(cage, row, 'netOperation')}
                                    >
                                      {formatNumber(row.netOperationCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.transferCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openDetailDialog(cage, row, 'transfer')}
                                    >
                                      {formatNumber(row.transferCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.weighingCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openDetailDialog(cage, row, 'weighing')}
                                    >
                                      {formatNumber(row.weighingCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.stockConvertCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openDetailDialog(cage, row, 'stockConvert')}
                                    >
                                      {formatNumber(row.stockConvertCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.fed ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                      {t('aqua.projectDetailReport.fed')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">{t('aqua.projectDetailReport.notFed')}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {reportQuery.data.cageHistory.length > 0 && (
              <Card className="mt-6 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {t('aqua.projectDetailReport.cageHistoryTitle', { defaultValue: 'Kafes Geçmişi (Buydu/Bu Oldu)' })}
                  </CardTitle>
                  <CardDescription>
                    {t('aqua.projectDetailReport.cageHistoryDescription', {
                      defaultValue: 'Projede daha önce kullanılmış ancak şu an aktif olmayan kafesler.',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('aqua.projectDetailReport.cage', { defaultValue: 'Kafes' })}</TableHead>
                        <TableHead>{t('aqua.projectDetailReport.assignedDate', { defaultValue: 'Atanma Tarihi' })}</TableHead>
                        <TableHead>{t('aqua.projectDetailReport.releasedDate', { defaultValue: 'Ayrılma Tarihi' })}</TableHead>
                        <TableHead>{t('aqua.projectDetailReport.status', { defaultValue: 'Durum' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportQuery.data.cageHistory.map((item) => (
                        <TableRow key={`history-${item.projectCageId}`}>
                          <TableCell className="font-medium">{item.cageLabel}</TableCell>
                          <TableCell>{item.assignedDate ? item.assignedDate.slice(0, 10) : '-'}</TableCell>
                          <TableCell>{item.releasedDate ? item.releasedDate.slice(0, 10) : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {t('aqua.projectDetailReport.inactive', { defaultValue: 'Pasif' })}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{detailDialog.title}</DialogTitle>
            <DialogDescription>{detailDialog.description}</DialogDescription>
          </DialogHeader>
          {detailDialog.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('aqua.projectDetailReport.noOperationDetail')}</p>
          ) : (
            <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-2">
              {detailDialog.items.map((item, index) => (
                <Card key={`${item}-${index}`} className="border-slate-200">
                  <CardContent className="py-3 text-sm">{item}</CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
