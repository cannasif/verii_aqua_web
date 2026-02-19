import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RefreshCw } from 'lucide-react';
import type { AquaCrudConfig, AquaFieldConfig } from '../types/aqua-crud';
import { aquaCrudApi } from '../api/aqua-crud-api';

interface AquaCrudPageProps {
  config: AquaCrudConfig;
}

const PAGE_SIZE = 20;

const DOC_STATUS_OPTIONS = [
  { label: 'Draft', value: 0 },
  { label: 'Posted', value: 1 },
  { label: 'Cancelled', value: 2 },
];

function getInitialValues(config: AquaCrudConfig): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.type === 'number') {
      base[field.key] = '';
    } else {
      base[field.key] = '';
    }
  }

  return { ...base, ...(config.defaultValues ?? {}) };
}

function normalizeFieldValue(field: AquaFieldConfig, rawValue: unknown): unknown {
  if (rawValue === '' || rawValue == null) return null;

  if (field.type === 'number') {
    const numeric = Number(rawValue);
    return Number.isNaN(numeric) ? null : numeric;
  }

  if (field.type === 'select') {
    const hasNumericOption = (field.options ?? DOC_STATUS_OPTIONS).some((option) => typeof option.value === 'number');
    if (hasNumericOption) {
      const numeric = Number(rawValue);
      return Number.isNaN(numeric) ? null : numeric;
    }
  }

  return rawValue;
}

function formatCellValue(value: unknown, t: (key: string) => string): string {
  if (value == null) return '-';
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
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

export function AquaCrudPage({ config }: AquaCrudPageProps): ReactElement {
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
    setPageTitle(localizedTitle);
    return () => setPageTitle(null);
  }, [localizedTitle, setPageTitle]);

  const listQuery = useQuery({
    queryKey: ['aqua', config.key, pageNumber],
    queryFn: () =>
      aquaCrudApi.getList(config.endpoint, {
        pageNumber,
        pageSize: PAGE_SIZE,
        sortBy: 'Id',
        sortDirection: 'desc',
      }),
    staleTime: config.listStaleTimeMs,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => aquaCrudApi.create(config.endpoint, payload),
    onSuccess: () => {
      toast.success(t('aqua.toast.created'));
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
    onSuccess: () => {
      toast.success(t('aqua.toast.updated'));
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

  const rows = listQuery.data?.data ?? [];
  const totalCount = listQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns = useMemo(() => {
    if (config.columns && config.columns.length > 0) {
      return config.columns;
    }

    return config.fields.slice(0, 5).map((field) => ({ key: field.key, label: field.label }));
  }, [config.columns, config.fields]);

  const handleCreate = (): void => {
    setEditingRow(null);
    setFormValues(getInitialValues(config));
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

    if (editingRow) {
      const id = Number(editingRow.id ?? editingRow.Id);
      if (!id) return;
      updateMutation.mutate({ id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{localizedTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{localizedDescription}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            <RefreshCw size={16} className={listQuery.isFetching ? 'mr-2 animate-spin' : 'mr-2'} />
            {t('aqua.common.refresh')}
          </Button>
          {!config.readOnly && (
            <Button onClick={handleCreate}>
              <Plus size={16} className="mr-2" />
              {t('aqua.common.new')}
            </Button>
          )}
        </div>
      </div>

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
            {listQuery.isLoading ? (
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
                  <TableRow key={id}>
                    <TableCell>{id}</TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>{formatCellValue(row[column.key], t)}</TableCell>
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
                        {config.postingSlug && status === 0 && (
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

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-slate-500">
            {(pageNumber - 1) * PAGE_SIZE + 1}-{Math.min(pageNumber * PAGE_SIZE, totalCount)} / {totalCount}
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
              {config.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Label htmlFor={field.key}>{t(field.label)}</Label>
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
                    <Select
                      value={String(formValues[field.key] ?? '')}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.common.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : [])).map((option) => (
                          <SelectItem key={`${field.key}-${option.value}`} value={String(option.value)}>
                            {t(option.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
