import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RefreshCw } from 'lucide-react';
import type { AquaCrudConfig, AquaCrudContextFilter, AquaFieldConfig } from '../types/aqua-crud';
import { aquaCrudApi } from '../api/aqua-crud-api';

interface AquaCrudPageProps {
  config: AquaCrudConfig;
  contextFilter?: AquaCrudContextFilter;
  hidePageHeader?: boolean;
  disablePageTitleSync?: boolean;
  rowSelectionEnabled?: boolean;
  selectedRowId?: number | null;
  onRowSelect?: (row: Record<string, unknown>) => void;
}

const PAGE_SIZE = 20;

const DOC_STATUS_OPTIONS = [
  { label: 'Draft', value: 0 },
  { label: 'Posted', value: 1 },
  { label: 'Cancelled', value: 2 },
];
const LOOKUP_PAGE_SIZE = 500;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
}

function getNowDateTimeLocalValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  const hour = pad2(now.getHours());
  const minute = pad2(now.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function resolveStatusFallbackValue(config: AquaCrudConfig): unknown {
  const statusField = config.fields.find((field) => field.key.toLowerCase() === 'status');
  if (!statusField) return null;

  const configuredStatus = config.defaultValues?.status;
  if (configuredStatus != null && configuredStatus !== '') {
    return configuredStatus;
  }

  const options = statusField.options ?? DOC_STATUS_OPTIONS;
  if (options.length > 0) {
    return options[0]?.value ?? 0;
  }

  return 0;
}

function getInitialValues(config: AquaCrudConfig): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.type === 'date') {
      base[field.key] = getTodayDateValue();
    } else if (field.type === 'datetime') {
      base[field.key] = getNowDateTimeLocalValue();
    } else if (field.type === 'number') {
      base[field.key] = '';
    } else {
      base[field.key] = '';
    }
  }

  const merged = { ...base, ...(config.defaultValues ?? {}) };
  const statusFallback = resolveStatusFallbackValue(config);
  if (statusFallback != null && (merged.status == null || merged.status === '')) {
    merged.status = statusFallback;
  }

  return merged;
}

function normalizeFieldValue(field: AquaFieldConfig, rawValue: unknown): unknown {
  if (rawValue === '' || rawValue == null) return null;

  if (field.type === 'number') {
    const numericRaw =
      typeof rawValue === 'string'
        ? rawValue.trim().replace(',', '.')
        : rawValue;
    const numeric = Number(numericRaw);
    return Number.isNaN(numeric) ? null : numeric;
  }

  if (field.type === 'select') {
    const hasNumericOption =
      (field.options ?? DOC_STATUS_OPTIONS).some((option) => typeof option.value === 'number') ||
      !!field.lookup;
    if (hasNumericOption) {
      const numeric = Number(rawValue);
      return Number.isNaN(numeric) ? null : numeric;
    }
  }

  return rawValue;
}

function resolveNumberInputStep(field: AquaFieldConfig): string {
  if (field.numberStep) return field.numberStep;
  const key = field.key.toLowerCase();
  if (key.includes('count')) return '1';
  return '0.001';
}

function isRequiredFieldMissing(field: AquaFieldConfig, value: unknown): boolean {
  if (!field.required) return false;
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function formatCellValue(value: unknown, t: (key: string) => string): string {
  if (value == null) return '-';
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function extractRecordId(record: Record<string, unknown> | null | undefined): number | null {
  if (!record) return null;
  const id = Number(record.id ?? record.Id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeInputValue(field: AquaFieldConfig, value: unknown): string {
  if (value == null) return '';
  const raw = String(value);

  if (field.type === 'date') {
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }

  if (field.type === 'datetime') {
    const normalized = raw.replace(' ', 'T');
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  }

  return raw;
}

function resolveLookupLabel(
  item: Record<string, unknown>,
  field: AquaFieldConfig
): string | null {
  if (!field.lookup) return null;

  const labelKeys = field.lookup.labelKeys?.length
    ? field.lookup.labelKeys
    : field.lookup.labelKey
      ? [field.lookup.labelKey]
      : [];

  if (labelKeys.length === 0) return null;

  const parts = labelKeys
    .map((key) => item[key])
    .filter((part): part is string | number => part != null && String(part).trim().length > 0)
    .map((part) => String(part));

  if (parts.length === 0) return null;
  return parts.join(field.lookup.labelSeparator ?? ' - ');
}

export function AquaCrudPage({
  config,
  contextFilter,
  hidePageHeader = false,
  disablePageTitleSync = false,
  rowSelectionEnabled = false,
  selectedRowId = null,
  onRowSelect,
}: AquaCrudPageProps): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const localizedTitle = t(config.title);
  const localizedDescription = t(config.description);

  const [pageNumber, setPageNumber] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => getInitialValues(config));

  useEffect(() => {
    if (disablePageTitleSync) return;
    setPageTitle(localizedTitle);
    return () => setPageTitle(null);
  }, [disablePageTitleSync, localizedTitle, setPageTitle]);

  const effectiveFilters = useMemo(() => {
    if (!contextFilter || contextFilter.value == null) return undefined;
    return [{ column: contextFilter.fieldKey, operator: 'eq', value: String(contextFilter.value) }];
  }, [contextFilter]);

  const canQueryList = contextFilter ? contextFilter.value != null : true;

  const listQuery = useQuery({
    queryKey: ['aqua', config.key, pageNumber, contextFilter?.fieldKey, contextFilter?.value],
    queryFn: () =>
      aquaCrudApi.getList(config.endpoint, {
        pageNumber,
        pageSize: PAGE_SIZE,
        sortBy: 'Id',
        sortDirection: 'desc',
        filters: effectiveFilters,
        filterLogic: 'and',
      }),
    staleTime: config.listStaleTimeMs,
    enabled: canQueryList,
  });

  const lookupFields = useMemo(
    () => config.fields.filter((field) => field.type === 'select' && field.lookup),
    [config.fields]
  );

  const lookupQueries = useQueries({
    queries: lookupFields.map((field) => ({
      queryKey: ['aqua-lookup', config.key, field.key],
      queryFn: async () => {
        let pageNumber = 1;
        let totalCount = 0;
        const allRows: Record<string, unknown>[] = [];

        do {
          const response = await aquaCrudApi.getList(field.lookup!.endpoint, {
            pageNumber,
            pageSize: LOOKUP_PAGE_SIZE,
            sortBy: 'Id',
            sortDirection: 'asc',
          });

          totalCount = response.totalCount ?? 0;
          allRows.push(...(response.data ?? []));
          pageNumber += 1;
        } while (allRows.length < totalCount);

        return {
          data: allRows,
          totalCount,
          pageNumber: 1,
          pageSize: allRows.length,
        };
      },
      staleTime: field.lookup!.staleTimeMs,
    })),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => aquaCrudApi.create(config.endpoint, payload),
    onSuccess: async (createdRecord) => {
      if (config.autoPostOnSave && config.postingSlug) {
        const createdId = extractRecordId(createdRecord);
        if (!createdId) {
          toast.error(t('aqua.toast.postFailed'));
        } else {
          try {
            await aquaCrudApi.postDocument(config.postingSlug, createdId);
            toast.success(t('aqua.toast.posted'));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed'));
          }
        }
      } else {
        toast.success(t('aqua.toast.created'));
      }

      setFormOpen(false);
      setEditingRow(null);
      setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aqua.toast.createFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      aquaCrudApi.update(config.endpoint, id, payload),
    onSuccess: async (_, variables) => {
      if (config.autoPostOnSave && config.postingSlug) {
        try {
          await aquaCrudApi.postDocument(config.postingSlug, variables.id);
          toast.success(t('aqua.toast.posted'));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed'));
        }
      } else {
        toast.success(t('aqua.toast.updated'));
      }

      setFormOpen(false);
      setEditingRow(null);
      setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aqua.toast.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aquaCrudApi.remove(config.endpoint, id),
    onSuccess: () => {
      toast.success(t('aqua.toast.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aqua.toast.deleteFailed'));
    },
  });

  const postMutation = useMutation({
    mutationFn: ({ slug, id }: { slug: string; id: number }) => aquaCrudApi.postDocument(slug, id),
    onSuccess: () => {
      toast.success(t('aqua.toast.posted'));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed'));
    },
  });

  const rows = canQueryList ? listQuery.data?.data ?? [] : [];
  const totalCount = listQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns = useMemo(() => {
    if (config.columns && config.columns.length > 0) {
      return config.columns;
    }

    return config.fields.slice(0, 5).map((field) => ({ key: field.key, label: field.label }));
  }, [config.columns, config.fields]);

  const lookupOptionsByField = useMemo((): Record<string, Array<{ label: string; value: string }>> => {
    const result: Record<string, Array<{ label: string; value: string }>> = {};

    lookupFields.forEach((field, index) => {
      const queryData = lookupQueries[index]?.data?.data ?? [];
      const valueKey = field.lookup!.valueKey;

      result[field.key] = queryData
        .map((item) => {
          const value = item[valueKey];
          const label = resolveLookupLabel(item, field);
          if (value == null || label == null) return null;
          return {
            value: String(value),
            label,
          };
        })
        .filter((item): item is { label: string; value: string } => item !== null);
    });

    return result;
  }, [lookupFields, lookupQueries]);

  const lookupLabelsByFieldAndValue = useMemo((): Record<string, Record<string, string>> => {
    const result: Record<string, Record<string, string>> = {};

    Object.entries(lookupOptionsByField).forEach(([fieldKey, options]) => {
      result[fieldKey] = options.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {});
    });

    return result;
  }, [lookupOptionsByField]);

  const selectOptionLabelsByFieldAndValue = useMemo((): Record<string, Record<string, string>> => {
    const result: Record<string, Record<string, string>> = {};

    config.fields
      .filter((field) => field.type === 'select' && !field.lookup)
      .forEach((field) => {
        const options =
          field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : []);
        result[field.key] = options.reduce<Record<string, string>>((acc, option) => {
          acc[String(option.value)] = t(option.label);
          return acc;
        }, {});
      });

    return result;
  }, [config.fields, t]);

  const visibleFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (contextFilter?.hideFieldInForm && contextFilter.fieldKey === field.key) {
        return false;
      }

      if (config.postingSlug && field.key.toLowerCase() === 'status') {
        return false;
      }

      return true;
    });
  }, [config.fields, contextFilter, config.postingSlug]);

  const handleCreate = (): void => {
    if (contextFilter?.lockValue && contextFilter.value == null) {
      toast.error(t('aqua.common.requiredField'));
      return;
    }
    setEditingRow(null);
    const initial = getInitialValues(config);
    if (contextFilter?.lockValue && contextFilter.value != null) {
      initial[contextFilter.fieldKey] = String(contextFilter.value);
    }
    setFormValues(initial);
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>): void => {
    setEditingRow(row);
    const nextValues: Record<string, unknown> = {};
    for (const field of config.fields) {
      nextValues[field.key] = normalizeInputValue(field, row[field.key] ?? '');
    }
    setFormValues({ ...getInitialValues(config), ...nextValues });
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>): void => {
    const id = Number(row.id ?? row.Id);
    if (!id) return;

    if (!window.confirm(t('aqua.common.confirmDelete'))) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (): void => {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      payload[field.key] = normalizeFieldValue(field, formValues[field.key]);
    }

    const statusFallback = resolveStatusFallbackValue(config);
    if (statusFallback != null && (payload.status == null || payload.status === '')) {
      payload.status = statusFallback;
    }

    if (contextFilter?.lockValue) {
      if (contextFilter.value == null) {
        toast.error(t('aqua.common.requiredField'));
        return;
      }
      payload[contextFilter.fieldKey] = contextFilter.value;
    }

    const firstMissingRequiredField = visibleFields.find((field) =>
      isRequiredFieldMissing(field, payload[field.key])
    );

    if (firstMissingRequiredField) {
      toast.error(
        `${t(firstMissingRequiredField.label)} * - ${t('aqua.common.requiredField')}`
      );
      return;
    }

    if (editingRow) {
      const id = Number(editingRow.id ?? editingRow.Id);
      if (!id) return;
      updateMutation.mutate({ id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(pageNumber * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4">
      {!hidePageHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{localizedTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{localizedDescription}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              onClick={() => void listQuery.refetch()}
              disabled={listQuery.isFetching || !canQueryList}
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} className={listQuery.isFetching ? 'mr-2 animate-spin' : 'mr-2'} />
              {t('aqua.common.refresh')}
            </Button>
            {!config.readOnly && (
              <Button onClick={handleCreate} disabled={!canQueryList} className="w-full sm:w-auto">
                <Plus size={16} className="mr-2" />
                {t('aqua.common.new')}
              </Button>
            )}
          </div>
        </div>
      )}

      {hidePageHeader && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => void listQuery.refetch()}
            disabled={listQuery.isFetching || !canQueryList}
            className="w-full sm:w-auto"
          >
            <RefreshCw size={16} className={listQuery.isFetching ? 'mr-2 animate-spin' : 'mr-2'} />
            {t('aqua.common.refresh')}
          </Button>
          {!config.readOnly && (
            <Button onClick={handleCreate} disabled={!canQueryList} className="w-full sm:w-auto">
              <Plus size={16} className="mr-2" />
              {t('aqua.common.new')}
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0b0713]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('aqua.common.id')}</TableHead>
              {columns.map((column) => (
                <TableHead key={column.key}>{t(column.label)}</TableHead>
              ))}
              <TableHead className="text-right">{t('aqua.common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!canQueryList ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-10">
                  {t('aqua.common.noData')}
                </TableCell>
              </TableRow>
            ) : listQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-10">
                  {t('aqua.common.loading')}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-10">
                  {t('aqua.common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = Number(row.id ?? row.Id);
                const status = Number(row.status ?? row.Status);

                return (
                  <TableRow
                    key={id}
                    className={rowSelectionEnabled && selectedRowId === id ? 'bg-sky-50 dark:bg-sky-900/20' : undefined}
                    onClick={() => {
                      if (!rowSelectionEnabled) return;
                      onRowSelect?.(row);
                    }}
                  >
                    <TableCell>{id}</TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {(() => {
                          const rawValue = row[column.key];
                          const lookupLabel = lookupLabelsByFieldAndValue[column.key]?.[String(rawValue)];
                          const selectLabel = selectOptionLabelsByFieldAndValue[column.key]?.[String(rawValue)];
                          return lookupLabel ?? selectLabel ?? formatCellValue(rawValue, t);
                        })()}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {!config.readOnly && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
                              {t('aqua.common.edit')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(row)}>
                              {t('aqua.common.delete')}
                            </Button>
                          </>
                        )}
                        {config.postingSlug && !config.autoPostOnSave && status === 0 && (
                          <Button
                            size="sm"
                            onClick={() => postMutation.mutate({ slug: config.postingSlug!, id })}
                            disabled={postMutation.isPending}
                          >
                            {t('aqua.common.post')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500">
            {rangeStart}-{rangeEnd} / {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              disabled={pageNumber <= 1}
            >
              {t('aqua.common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
              disabled={pageNumber >= totalPages}
            >
              {t('aqua.common.next')}
            </Button>
          </div>
        </div>
      </div>

      {!config.readOnly && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRow ? t('aqua.common.editRecord') : t('aqua.common.createRecord')}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleFields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Label htmlFor={field.key}>
                    {t(field.label)}
                    {field.required ? ' *' : ''}
                  </Label>
                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      value={String(formValues[field.key] ?? '')}
                      onChange={(event) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                    />
                  )}

                  {field.type === 'select' && (
                    <Combobox
                      options={
                        field.lookup
                          ? (lookupOptionsByField[field.key] ?? []).map((option) => ({
                              value: String(option.value),
                              label: option.label,
                            }))
                          : (field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : [])).map(
                              (option) => ({
                                value: String(option.value),
                                label: t(option.label),
                              })
                            )
                      }
                      value={String(formValues[field.key] ?? '')}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: value }))
                      }
                      placeholder={t('aqua.common.select')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.noResults')}
                    />
                  )}

                  {(field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'datetime') && (
                    <Input
                      id={field.key}
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'datetime'
                              ? 'datetime-local'
                              : 'text'
                      }
                      required={field.required}
                      step={field.type === 'number' ? resolveNumberInputStep(field) : undefined}
                      min={field.type === 'number' ? field.numberMin : undefined}
                      max={field.type === 'number' ? field.numberMax : undefined}
                      inputMode={field.type === 'number' ? 'decimal' : undefined}
                      placeholder={field.placeholder}
                      value={normalizeInputValue(field, formValues[field.key])}
                      onChange={(event) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                {t('aqua.common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t('aqua.common.saving') : t('aqua.common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
