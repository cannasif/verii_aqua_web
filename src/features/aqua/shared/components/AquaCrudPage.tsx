import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  X, 
  AlertTriangle, 
  FileText,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react';
import type { AquaCrudConfig, AquaCrudContextFilter, AquaFieldConfig } from '../types/aqua-crud';
import { aquaCrudApi } from '../api/aqua-crud-api';

// Yeni Shared UI Bileşenleri
import { PageToolbar, ColumnPreferencesPopover } from '@/components/shared';
import { loadColumnPreferences } from '@/lib/column-preferences';

interface AquaCrudPageProps {
  config: AquaCrudConfig;
  contextFilter?: AquaCrudContextFilter;
  hidePageHeader?: boolean;
  disablePageTitleSync?: boolean;
  rowSelectionEnabled?: boolean;
  selectedRowId?: number | null;
  onRowSelect?: (row: Record<string, unknown>) => void;
}

const DOC_STATUS_OPTIONS = [
  { label: 'Draft', value: 0 },
  { label: 'Posted', value: 1 },
  { label: 'Cancelled', value: 2 },
];
const LOOKUP_PAGE_SIZE = 500;

// --- CRM Modal Stilleri ---
const INPUT_STYLE = `
  h-11 rounded-xl w-full
  bg-slate-50 dark:bg-[#0f0a18] 
  border border-slate-200 dark:border-white/10 
  text-slate-900 dark:text-white text-sm
  placeholder:text-slate-400 dark:placeholder:text-slate-600 
  
  focus-visible:bg-white dark:focus-visible:bg-[#1a1025]
  focus-visible:border-pink-500 dark:focus-visible:border-pink-500/70
  focus-visible:ring-2 focus-visible:ring-pink-500/10 focus-visible:ring-offset-0
  
  focus:ring-2 focus:ring-pink-500/10 focus:ring-offset-0 focus:border-pink-500
  
  transition-all duration-200
  read-only:opacity-100 read-only:cursor-default
`;

const LABEL_STYLE = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 mb-2 flex items-center gap-1.5";

function pad2(value: number): string { return String(value).padStart(2, '0'); }
function getTodayDateValue(): string { const now = new Date(); return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`; }
function getNowDateTimeLocalValue(): string { const now = new Date(); return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`; }

function resolveStatusFallbackValue(config: AquaCrudConfig): unknown {
  const statusField = config.fields.find((field) => field.key.toLowerCase() === 'status');
  if (!statusField) return null;
  const configuredStatus = config.defaultValues?.status;
  if (configuredStatus != null && configuredStatus !== '') return configuredStatus;
  const options = statusField.options ?? DOC_STATUS_OPTIONS;
  if (options.length > 0) return options[0]?.value ?? 0;
  return 0;
}

function getInitialValues(config: AquaCrudConfig): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.type === 'date') base[field.key] = getTodayDateValue();
    else if (field.type === 'datetime') base[field.key] = getNowDateTimeLocalValue();
    else if (field.type === 'number') base[field.key] = '';
    else base[field.key] = '';
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
    const numericRaw = typeof rawValue === 'string' ? rawValue.trim().replace(',', '.') : rawValue;
    const numeric = Number(numericRaw);
    return Number.isNaN(numeric) ? null : numeric;
  }
  if (field.type === 'select') {
    const hasNumericOption = (field.options ?? DOC_STATUS_OPTIONS).some((option) => typeof option.value === 'number') || !!field.lookup;
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
  if (field.type === 'date') return raw.length >= 10 ? raw.slice(0, 10) : raw;
  if (field.type === 'datetime') {
    const normalized = raw.replace(' ', 'T');
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  }
  return raw;
}

function resolveLookupLabel(item: Record<string, unknown>, field: AquaFieldConfig): string | null {
  if (!field.lookup) return null;
  const labelKeys = field.lookup.labelKeys?.length ? field.lookup.labelKeys : field.lookup.labelKey ? [field.lookup.labelKey] : [];
  if (labelKeys.length === 0) return null;
  const parts = labelKeys.map((key) => item[key]).filter((part): part is string | number => part != null && String(part).trim().length > 0).map((part) => String(part));
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const localizedTitle = t(config.title);
  const localizedDescription = t(config.description);

  // --- State'ler ---
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageNumber, setPageNumber] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'Id', direction: 'desc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => getInitialValues(config));
  
  // Silme işlemi için State
  const [rowToDelete, setRowToDelete] = useState<Record<string, unknown> | null>(null);

  // Sütun Konfigürasyonları
  const baseColumns = useMemo(() => {
    if (config.columns && config.columns.length > 0) return config.columns;
    return config.fields.slice(0, 5).map((field) => ({ key: field.key, label: field.label }));
  }, [config.columns, config.fields]);

  const defaultColumnKeys = useMemo(() => baseColumns.map((c) => c.key), [baseColumns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => defaultColumnKeys);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => defaultColumnKeys);

  useEffect(() => {
    const prefs = loadColumnPreferences(`aqua-${config.key}`, user?.id, defaultColumnKeys);
    setVisibleColumns(prefs.visibleKeys);
    setColumnOrder(prefs.order);
  }, [user?.id, defaultColumnKeys, config.key]);

  const displayedColumns = useMemo(() => {
    const visible = baseColumns.filter((col) => visibleColumns.includes(col.key));
    if (!columnOrder || columnOrder.length === 0) return visible;
    const orderMap = new Map(columnOrder.map((k, i) => [k, i]));
    return [...visible].sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
  }, [baseColumns, visibleColumns, columnOrder]);

  useEffect(() => {
    if (disablePageTitleSync) return;
    setPageTitle(localizedTitle);
    return () => setPageTitle(null);
  }, [disablePageTitleSync, localizedTitle, setPageTitle]);

  useEffect(() => {
    setPageNumber(1);
  }, [searchTerm, pageSize, sortConfig]);

  const effectiveFilters = useMemo(() => {
    const filters = [];
    if (contextFilter && contextFilter.value != null) {
      filters.push({ column: contextFilter.fieldKey, operator: 'eq', value: String(contextFilter.value) });
    }
    return filters.length > 0 ? filters : undefined;
  }, [contextFilter]);

  const canQueryList = contextFilter ? contextFilter.value != null : true;

  const listQuery = useQuery({
    queryKey: ['aqua', config.key, pageNumber, pageSize, searchTerm, contextFilter?.fieldKey, contextFilter?.value, sortConfig],
    queryFn: () =>
      aquaCrudApi.getList(config.endpoint, {
        pageNumber,
        pageSize,
        sortBy: sortConfig?.key ?? 'Id',
        sortDirection: sortConfig?.direction ?? 'desc',
        filters: effectiveFilters,
        filterLogic: 'and',
      }),
    staleTime: config.listStaleTimeMs,
    enabled: canQueryList,
  });

  const lookupFields = useMemo(() => config.fields.filter((field) => field.type === 'select' && field.lookup), [config.fields]);

  const lookupQueries = useQueries({
    queries: lookupFields.map((field) => ({
      queryKey: ['aqua-lookup', config.key, field.key],
      queryFn: async () => {
        let pageNumber = 1;
        let totalCount = 0;
        const allRows: Record<string, unknown>[] = [];
        do {
          const response = await aquaCrudApi.getList(field.lookup!.endpoint, {
            pageNumber, pageSize: LOOKUP_PAGE_SIZE, sortBy: 'Id', sortDirection: 'asc',
          });
          totalCount = response.totalCount ?? 0;
          allRows.push(...(response.data ?? []));
          pageNumber += 1;
        } while (allRows.length < totalCount);
        return { data: allRows, totalCount, pageNumber: 1, pageSize: allRows.length };
      },
      staleTime: field.lookup!.staleTimeMs,
    })),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => aquaCrudApi.create(config.endpoint, payload),
    onSuccess: async (createdRecord) => {
      if (config.autoPostOnSave && config.postingSlug) {
        const createdId = extractRecordId(createdRecord);
        if (!createdId) toast.error(t('aqua.toast.postFailed'));
        else {
          try {
            await aquaCrudApi.postDocument(config.postingSlug, createdId);
            toast.success(t('aqua.toast.posted'));
          } catch (error) { toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')); }
        }
      } else { toast.success(t('aqua.toast.created')); }
      setFormOpen(false);
      setEditingRow(null);
      setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.createFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => aquaCrudApi.update(config.endpoint, id, payload),
    onSuccess: async (_, variables) => {
      if (config.autoPostOnSave && config.postingSlug) {
        try {
          await aquaCrudApi.postDocument(config.postingSlug, variables.id);
          toast.success(t('aqua.toast.posted'));
        } catch (error) { toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')); }
      } else { toast.success(t('aqua.toast.updated')); }
      setFormOpen(false);
      setEditingRow(null);
      setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aquaCrudApi.remove(config.endpoint, id),
    onSuccess: () => {
      toast.success(t('aqua.toast.deleted'));
      setRowToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aqua.toast.deleteFailed'));
      setRowToDelete(null);
    },
  });

  const postMutation = useMutation({
    mutationFn: ({ slug, id }: { slug: string; id: number }) => aquaCrudApi.postDocument(slug, id),
    onSuccess: () => {
      toast.success(t('aqua.toast.posted'));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')),
  });

  const lookupOptionsByField = useMemo((): Record<string, Array<{ label: string; value: string }>> => {
    const result: Record<string, Array<{ label: string; value: string }>> = {};
    lookupFields.forEach((field, index) => {
      const queryData = lookupQueries[index]?.data?.data ?? [];
      const valueKey = field.lookup!.valueKey;
      result[field.key] = queryData.map((item) => {
        const value = item[valueKey];
        const label = resolveLookupLabel(item, field);
        if (value == null || label == null) return null;
        return { value: String(value), label };
      }).filter((item): item is { label: string; value: string } => item !== null);
    });
    return result;
  }, [lookupFields, lookupQueries]);

  const lookupLabelsByFieldAndValue = useMemo((): Record<string, Record<string, string>> => {
    const result: Record<string, Record<string, string>> = {};
    Object.entries(lookupOptionsByField).forEach(([fieldKey, options]) => {
      result[fieldKey] = options.reduce<Record<string, string>>((acc, option) => { acc[option.value] = option.label; return acc; }, {});
    });
    return result;
  }, [lookupOptionsByField]);

  const selectOptionLabelsByFieldAndValue = useMemo((): Record<string, Record<string, string>> => {
    const result: Record<string, Record<string, string>> = {};
    config.fields.filter((field) => field.type === 'select' && !field.lookup).forEach((field) => {
      const options = field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : []);
      result[field.key] = options.reduce<Record<string, string>>((acc, option) => { acc[String(option.value)] = t(option.label); return acc; }, {});
    });
    return result;
  }, [config.fields, t]);

  const visibleFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (contextFilter?.hideFieldInForm && contextFilter.fieldKey === field.key) return false;
      if (config.postingSlug && field.key.toLowerCase() === 'status') return false;
      return true;
    });
  }, [config.fields, contextFilter, config.postingSlug]);

  const handleRefresh = async (): Promise<void> => {
    await listQuery.refetch();
  };

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

  const handleDeleteClick = (row: Record<string, unknown>): void => {
    setRowToDelete(row); 
  };

  const confirmDelete = (): void => {
    if (!rowToDelete) return;
    const id = Number(rowToDelete.id ?? rowToDelete.Id);
    if (!id) return;
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

    const firstMissingRequiredField = visibleFields.find((field) => isRequiredFieldMissing(field, payload[field.key]));

    if (firstMissingRequiredField) {
      toast.error(`${t(firstMissingRequiredField.label)} * - ${t('aqua.common.requiredField')}`);
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  
  // Frontend Arama İşlemi
  let rows = canQueryList ? listQuery.data?.data ?? [] : [];
  if (searchTerm && rows.length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    rows = rows.filter((row) => Object.values(row).some((val) => String(val).toLowerCase().includes(lowerSearch)));
  }

  const totalCount = listQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount);

  // CRM Tablo Stilleri
  const headStyle = `text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider py-2 px-4 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer select-none border-r border-slate-200 dark:border-white/[0.03] last:border-r-0 whitespace-nowrap bg-slate-50/90 dark:bg-[#130822]/90 text-left`;
  const cellStyle = `text-slate-600 dark:text-slate-400 px-4 py-2 border-r border-slate-100 dark:border-white/[0.03] last:border-r-0 text-sm align-middle whitespace-nowrap`;

  return (
    <div className="space-y-4">
      {/* 1. Header (Başlık ve Araç Çubuğu) */}
      <div className="flex flex-col gap-4 bg-white/70 dark:bg-[#1a1025]/60 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-sm rounded-2xl p-4 transition-all duration-300">
        {!hidePageHeader && (
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">{localizedTitle}</h1>
            <p className="text-sm text-muted-foreground">{localizedDescription}</p>
          </div>
        )}

        <div className={`flex flex-col lg:flex-row items-center justify-between gap-3 ${!hidePageHeader ? 'border-t border-white/5 pt-4' : ''}`}>
          <PageToolbar
            searchPlaceholder={t('aqua.common.quickSearch', 'Hızlı Ara...')}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={handleRefresh}
            rightSlot={
              <div className="flex flex-wrap items-center gap-2">
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 bg-transparent text-gray-400 border-white/10 hover:bg-white/5 hover:text-white">
                      <span className="font-medium text-sm">{pageSize}</span>
                      <ChevronDown size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-20 bg-[#151025] border border-white/10 shadow-2xl rounded-xl overflow-hidden p-1">
                      {[10, 20, 50, 100].map((size) => (
                          <DropdownMenuItem key={size} onClick={() => setPageSize(size)} className={`flex items-center justify-center text-xs font-medium px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${pageSize === size ? 'bg-pink-500/10 text-pink-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                              {size}
                          </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ColumnPreferencesPopover
                  pageKey={`aqua-${config.key}`}
                  userId={user?.id}
                  columns={baseColumns.map((col) => ({ key: col.key, label: t(col.label) }))}
                  visibleColumns={visibleColumns}
                  columnOrder={columnOrder}
                  onVisibleColumnsChange={setVisibleColumns}
                  onColumnOrderChange={setColumnOrder}
                />

                {/* Yeni Kayıt Ekle Butonu - SADECE ANA TABLODA (hidePageHeader false ise) GÖSTERİLİR */}
                {!config.readOnly && !hidePageHeader && (
                  <Button onClick={handleCreate} disabled={!canQueryList} className="ml-2 bg-linear-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25 border-0 hover:opacity-95">
                    <Plus size={16} className="mr-2" />
                    {t('aqua.common.new')}
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* 2. Tablo Gövdesi */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0713] flex flex-col overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[680px] sm:min-w-[820px] caption-bottom text-sm relative">
            <thead className="bg-[#151025] sticky top-0 z-10 shadow-sm">
              <tr className="h-10 hover:bg-transparent border-b border-slate-200 dark:border-white/10">
                <th className={headStyle} onClick={() => handleSort('Id')}>
                  <div className="flex items-center gap-2">
                    {t('aqua.common.id')}
                    {sortConfig?.key === 'Id' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />) : (<ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />)}
                  </div>
                </th>
                
                {displayedColumns.map((column) => (
                  <th key={column.key} className={headStyle} onClick={() => handleSort(column.key)}>
                    <div className="flex items-center gap-2">
                      {t(column.label)}
                      {sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />) : (<ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />)}
                    </div>
                  </th>
                ))}
                <th className={`${headStyle} text-right cursor-default hover:text-slate-500 dark:hover:text-slate-400`}>{t('aqua.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {!canQueryList ? (
                <tr><td colSpan={displayedColumns.length + 2} className="text-center py-20 text-muted-foreground bg-slate-50 dark:bg-white/5 font-medium">{t('aqua.common.noData')}</td></tr>
              ) : listQuery.isLoading ? (
                <tr>
                  <td colSpan={displayedColumns.length + 2} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-current text-pink-500" />
                      <span className="text-sm font-medium text-muted-foreground animate-pulse">{t('aqua.common.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={displayedColumns.length + 2} className="text-center py-20 text-muted-foreground bg-slate-50 dark:bg-white/5 font-medium">{t('aqua.common.noData')}</td></tr>
              ) : (
                rows.map((row) => {
                  const id = Number(row.id ?? row.Id);
                  const status = Number(row.status ?? row.Status);
                  const isSelected = rowSelectionEnabled && selectedRowId === id;

                  return (
                    <tr key={id} className={`h-10 border-b border-slate-100 dark:border-white/5 transition-colors duration-200 hover:bg-pink-50/40 dark:hover:bg-pink-500/5 group last:border-0 ${rowSelectionEnabled ? 'cursor-pointer' : ''} ${isSelected ? 'bg-pink-50/60 dark:bg-pink-500/10' : ''}`} onClick={() => { if (rowSelectionEnabled) onRowSelect?.(row); }}>
                      <td className={`${cellStyle} font-mono text-xs`}>{id}</td>
                      {displayedColumns.map((column) => (
                        <td key={column.key} className={cellStyle}>
                          {(() => {
                            const rawValue = row[column.key];
                            const lookupLabel = lookupLabelsByFieldAndValue[column.key]?.[String(rawValue)];
                            const selectLabel = selectOptionLabelsByFieldAndValue[column.key]?.[String(rawValue)];
                            return lookupLabel ?? selectLabel ?? formatCellValue(rawValue, t);
                          })()}
                        </td>
                      ))}
                      <td className={`${cellStyle} text-right w-[1%] whitespace-nowrap`}>
                        <div className="flex items-center justify-end gap-1">
                          {!config.readOnly && (
                            <>
                              <Button variant="ghost" size="icon" title={t('aqua.common.edit', 'Düzenle')} onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 transition-colors">
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" title={t('aqua.common.delete', 'Sil')} onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                          {config.postingSlug && !config.autoPostOnSave && status === 0 && (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); postMutation.mutate({ slug: config.postingSlug!, id }); }} disabled={postMutation.isPending}>{t('aqua.common.post')}</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Sayfalama (Pagination) */}
        <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between w-full shrink-0">
          <span className="text-sm text-slate-500">{rangeStart}-{rangeEnd} / {totalCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))} disabled={pageNumber <= 1}>{t('aqua.common.previous')}</Button>
            <Button variant="outline" size="sm" onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))} disabled={pageNumber >= totalPages}>{t('aqua.common.next')}</Button>
          </div>
        </div>
      </div>

      {/* 4. CRM Uyumlu Şık Ekle/Düzenle Form Dialog */}
      {!config.readOnly && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="[&>button]:hidden bg-white dark:bg-[#130822] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white max-w-3xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            
            <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1025]/50 flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-pink-500 to-orange-500 p-0.5 shadow-lg shadow-pink-500/20">
                   <div className="h-full w-full bg-white dark:bg-[#130822] rounded-[14px] flex items-center justify-center">
                     <FileText size={24} className="text-pink-600 dark:text-pink-500" />
                   </div>
                 </div>
                 <div className="space-y-1 text-left">
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {editingRow ? t('aqua.common.editRecord', 'Kaydı Düzenle') : t('aqua.common.createRecord', 'Yeni Kayıt')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                      {localizedTitle} modülü için bilgileri doldurun.
                    </DialogDescription>
                 </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X size={20} />
              </Button>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {visibleFields.map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}>
                    <Label htmlFor={field.key} className={LABEL_STYLE}>
                      <ChevronRight size={14} className="text-pink-500" />
                      {t(field.label)} {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={String(formValues[field.key] ?? '')}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={`${INPUT_STYLE} min-h-[100px] py-3 resize-none`}
                      />
                    )}

                    {field.type === 'select' && (
                      <Combobox
                        options={field.lookup ? (lookupOptionsByField[field.key] ?? []).map((o) => ({ value: String(o.value), label: o.label })) : (field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : [])).map((o) => ({ value: String(o.value), label: t(o.label) }))}
                        value={String(formValues[field.key] ?? '')}
                        onValueChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}
                        placeholder={t('aqua.common.select')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.noResults')}
                      />
                    )}

                    {(field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'datetime') && (
                      <Input
                        id={field.key}
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                        required={field.required}
                        step={field.type === 'number' ? resolveNumberInputStep(field) : undefined}
                        min={field.type === 'number' ? field.numberMin : undefined}
                        max={field.type === 'number' ? field.numberMax : undefined}
                        inputMode={field.type === 'number' ? 'decimal' : undefined}
                        placeholder={field.placeholder}
                        value={normalizeInputValue(field, formValues[field.key])}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={INPUT_STYLE}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1025]/50 flex-col sm:flex-row gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="w-full sm:w-auto h-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">
                {t('aqua.common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-11 rounded-xl bg-linear-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25 hover:opacity-95 border-0">
                {isSubmitting ? t('aqua.common.saving') : t('aqua.common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. Şık Silme Onay Dialog'u (Geliştirilmiş Tipografi) */}
      <Dialog open={!!rowToDelete} onOpenChange={(open) => !open && setRowToDelete(null)}>
        <DialogContent className="[&>button]:hidden bg-white dark:bg-[#130822] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white max-w-sm w-[95%] shadow-2xl sm:rounded-2xl p-0 overflow-hidden">
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-5">
               <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                 <AlertTriangle size={32} className="text-red-500" />
               </div>
               <div className="space-y-3">
                 <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('aqua.common.confirmDelete', 'Emin misiniz?')}
                 </h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                    Bu kaydı kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
                 </p>
               </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1025]/50 flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setRowToDelete(null)} className="w-full sm:w-auto h-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">
                {t('aqua.common.cancel', 'İptal')}
              </Button>
              <Button onClick={confirmDelete} disabled={isDeleting} className="w-full sm:w-auto h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 border-0">
                {isDeleting ? t('aqua.common.deleting', 'Siliniyor...') : t('aqua.common.delete', 'Sil')}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}