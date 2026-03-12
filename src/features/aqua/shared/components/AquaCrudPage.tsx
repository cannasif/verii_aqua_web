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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Plus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, X, AlertTriangle, FileText,
  ChevronRight, Edit, Trash2, Menu, FileSpreadsheet, Presentation, Filter, GripVertical,
  CheckCircle2, Copy, Eye, Download
} from 'lucide-react';
import type { AquaCrudConfig, AquaCrudContextFilter, AquaFieldConfig } from '../types/aqua-crud';
import { aquaCrudApi } from '../api/aqua-crud-api';
import { PageToolbar, ColumnPreferencesPopover, AdvancedFilter } from '@/components/shared';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import type { FilterRow, FilterColumnConfig } from '@/lib/advanced-filter-types';

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const INPUT_STYLE = `
  h-11 rounded-xl w-full
  bg-slate-50 dark:bg-blue-950/50
  border border-slate-200 dark:border-cyan-800/50
  text-slate-900 dark:text-slate-100 text-sm
  placeholder:text-slate-400 dark:placeholder:text-slate-500 
  focus-visible:bg-white dark:focus-visible:bg-blue-950
  focus-visible:border-cyan-500 dark:focus-visible:border-cyan-500/70
  focus-visible:ring-2 focus-visible:ring-cyan-500/10 focus-visible:ring-offset-0
  transition-all duration-200
  read-only:opacity-80 read-only:cursor-default
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

// PREMIUM ÖZELLİK: Tıkla ve Kopyala Bileşeni
function CopyableCell({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text || text === '-') return <span>{text}</span>;
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group flex items-center gap-2">
      <span className="font-mono text-[11.5px] font-bold text-slate-700 dark:text-cyan-100 tracking-tight">{text}</span>
      <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 active:scale-90">
        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

const DraggableTh = ({ id, children, className, onClick, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { id: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.9 : 1, zIndex: isDragging ? 50 : 'auto', position: isDragging ? 'relative' : 'static', backgroundColor: isDragging ? 'rgba(6, 182, 212, 0.05)' : undefined };

  return (
    <th ref={setNodeRef} style={style} className={`${className} ${isDragging ? 'shadow-2xl ring-1 ring-cyan-500/20 backdrop-blur-xl' : ''}`} {...props}>
      <div className="flex items-center gap-1.5">
        <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-blue-900/50 p-1 rounded-md transition-colors touch-none text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" title="Sürükle bırak">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 flex items-center gap-2 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors select-none" onClick={onClick}>{children}</div>
      </div>
    </th>
  );
};

export function AquaCrudPage({
  config, contextFilter, hidePageHeader = false, disablePageTitleSync = false, rowSelectionEnabled = false, selectedRowId = null, onRowSelect,
}: AquaCrudPageProps): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const localizedTitle = t(config.title);
  const localizedDescription = t(config.description);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageNumber, setPageNumber] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'Id', direction: 'desc' });

  const [showFilters, setShowFilters] = useState(false);
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);

  // PREMIUM ÖZELLİK: Çoklu Seçim State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // PREMIUM ÖZELLİK: Sağ Çekmece (Detay Görüntüleme)
  const [viewingRow, setViewingRow] = useState<Record<string, unknown> | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => getInitialValues(config));
  const [rowToDelete, setRowToDelete] = useState<Record<string, unknown> | null>(null);

  const filterColumns = useMemo<FilterColumnConfig[]>(() => {
    return config.fields.map(field => {
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
      if (field.type === 'number') type = 'number';
      if (field.type === 'date' || field.type === 'datetime') type = 'date';
      if ((field.type as string) === 'checkbox' || (field.type as string) === 'boolean') type = 'boolean';
      return { value: field.key, type, labelKey: field.label, translatedLabel: t(field.label) } as FilterColumnConfig & { translatedLabel: string };
    });
  }, [config.fields, t]);

  const baseColumns = useMemo(() => {
    if (config.columns && config.columns.length > 0) return config.columns;
    return config.fields.slice(0, 5).map((field) => ({ key: field.key, label: field.label }));
  }, [config.columns, config.fields]);

  const defaultColumnKeys = useMemo(() => baseColumns.map((c) => c.key), [baseColumns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => defaultColumnKeys);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => defaultColumnKeys);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveColumnPreferences(`aqua-${config.key}`, user?.id, { order: newOrder, visibleKeys: visibleColumns });
        return newOrder;
      });
    }
  };

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
    setSelectedIds([]); // Filtre değişince seçimleri temizle
  }, [searchTerm, pageSize, sortConfig, appliedFilterRows]);

  const handleAdvancedSearch = () => { setAppliedFilterRows(draftFilterRows); setShowFilters(false); };
  const handleAdvancedClear = () => { setDraftFilterRows([]); setAppliedFilterRows([]); };
  const hasFiltersActive = appliedFilterRows.some((r) => r.value != null && String(r.value).trim() !== '');

  const effectiveFilters = useMemo(() => {
    const filters: Array<{ column: string; operator: string; value: string }> = [];
    if (contextFilter && contextFilter.value != null) filters.push({ column: contextFilter.fieldKey, operator: 'eq', value: String(contextFilter.value) });
    appliedFilterRows.forEach(row => {
      if (row.column && row.value != null && String(row.value).trim() !== '') {
         filters.push({ column: row.column, operator: row.operator || 'contains', value: String(row.value) });
      }
    });
    return filters.length > 0 ? filters : undefined;
  }, [contextFilter, appliedFilterRows]);

  const canQueryList = contextFilter ? contextFilter.value != null : true;

  const listQuery = useQuery({
    queryKey: ['aqua', config.key, pageNumber, pageSize, searchTerm, sortConfig, effectiveFilters],
    queryFn: () => aquaCrudApi.getList(config.endpoint, { pageNumber, pageSize, sortBy: sortConfig?.key ?? 'Id', sortDirection: sortConfig?.direction ?? 'desc', filters: effectiveFilters, filterLogic: 'and' }),
    staleTime: config.listStaleTimeMs,
    enabled: canQueryList,
  });

  const lookupFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (field.type !== 'select' || !field.lookup) return false;
      if (
        contextFilter &&
        contextFilter.hideFieldInForm &&
        contextFilter.lockValue &&
        contextFilter.fieldKey === field.key
      ) {
        return false;
      }
      return true;
    });
  }, [config.fields, contextFilter]);

  const lookupQueries = useQueries({
    queries: lookupFields.map((field) => ({
      queryKey: ['aqua-lookup', config.key, field.key],
      queryFn: async () => {
        let pageNumber = 1, totalCount = 0; const allRows: Record<string, unknown>[] = [];
        do {
          const response = await aquaCrudApi.getList(field.lookup!.endpoint, { pageNumber, pageSize: LOOKUP_PAGE_SIZE, sortBy: 'Id', sortDirection: 'asc' });
          totalCount = response.totalCount ?? 0; allRows.push(...(response.data ?? [])); pageNumber += 1;
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
          try { await aquaCrudApi.postDocument(config.postingSlug, createdId); toast.success(t('aqua.toast.posted')); } 
          catch (error) { toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')); }
        }
      } else { toast.success(t('aqua.toast.created')); }
      setFormOpen(false); setEditingRow(null); setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.createFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => aquaCrudApi.update(config.endpoint, id, payload),
    onSuccess: async (_, variables) => {
      if (config.autoPostOnSave && config.postingSlug) {
        try { await aquaCrudApi.postDocument(config.postingSlug, variables.id); toast.success(t('aqua.toast.posted')); } 
        catch (error) { toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')); }
      } else { toast.success(t('aqua.toast.updated')); }
      setFormOpen(false); setEditingRow(null); setFormValues(getInitialValues(config));
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aquaCrudApi.remove(config.endpoint, id),
    onSuccess: () => {
      toast.success(t('aqua.toast.deleted')); setRowToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    },
    onError: (error) => { toast.error(error instanceof Error ? error.message : t('aqua.toast.deleteFailed')); setRowToDelete(null); },
  });

  const postMutation = useMutation({
    mutationFn: ({ slug, id }: { slug: string; id: number }) => aquaCrudApi.postDocument(slug, id),
    onSuccess: () => { toast.success(t('aqua.toast.posted')); void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('aqua.toast.postFailed')),
  });

  // Toplu Silme Fonksiyonu
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(t('aqua.common.confirmBulkDelete', `Seçili ${selectedIds.length} kaydı silmek istediğinize emin misiniz?`))) return;
    
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => aquaCrudApi.remove(config.endpoint, id)));
      toast.success(t('aqua.common.bulkDeleteSuccess', `${selectedIds.length} kayıt başarıyla silindi.`));
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: ['aqua', config.key] });
    } catch (e) {
      toast.error(t('aqua.common.bulkDeleteError', 'Toplu silme işlemi sırasında bazı hatalar oluştu.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const lookupOptionsByField = useMemo((): Record<string, Array<{ label: string; value: string }>> => {
    const result: Record<string, Array<{ label: string; value: string }>> = {};
    lookupFields.forEach((field, index) => {
      const queryData = lookupQueries[index]?.data?.data ?? [];
      const valueKey = field.lookup!.valueKey;
      result[field.key] = queryData.map((item) => {
        const value = item[valueKey]; const label = resolveLookupLabel(item, field);
        if (value == null || label == null) return null;
        return { value: String(value), label };
      }).filter((item): item is { label: string; value: string } => item !== null);
    });
    return result;
  }, [lookupFields, lookupQueries]);

  const lookupLabelsByFieldAndValue = useMemo((): Record<string, Record<string, string>> => {
    const result: Record<string, Record<string, string>> = {};
    Object.entries(lookupOptionsByField).forEach(([fieldKey, options]) => { result[fieldKey] = options.reduce<Record<string, string>>((acc, option) => { acc[option.value] = option.label; return acc; }, {}); });
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

  const visibleFields = useMemo(() => config.fields.filter((field) => {
    if (contextFilter?.hideFieldInForm && contextFilter.fieldKey === field.key) return false;
    if (config.postingSlug && field.key.toLowerCase() === 'status') return false;
    return true;
  }), [config.fields, contextFilter, config.postingSlug]);

  const hasMissingRequiredField = useMemo(() => {
    const candidatePayload: Record<string, unknown> = {};
    for (const field of config.fields) {
      candidatePayload[field.key] = normalizeFieldValue(field, formValues[field.key]);
    }

    if (contextFilter?.lockValue && contextFilter.value != null) {
      candidatePayload[contextFilter.fieldKey] = contextFilter.value;
    }

    return visibleFields.some((field) => isRequiredFieldMissing(field, candidatePayload[field.key]));
  }, [config.fields, contextFilter, formValues, visibleFields]);

  const handleCreate = (): void => {
    if (contextFilter?.lockValue && contextFilter.value == null) { toast.error(t('aqua.common.requiredField')); return; }
    setEditingRow(null); const initial = getInitialValues(config);
    if (contextFilter?.lockValue && contextFilter.value != null) initial[contextFilter.fieldKey] = String(contextFilter.value);
    setFormValues(initial); setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>): void => {
    setEditingRow(row); const nextValues: Record<string, unknown> = {};
    for (const field of config.fields) nextValues[field.key] = normalizeInputValue(field, row[field.key] ?? '');
    setFormValues({ ...getInitialValues(config), ...nextValues }); setFormOpen(true);
  };

  const handleDeleteClick = (row: Record<string, unknown>): void => { setRowToDelete(row); };
  const confirmDelete = (): void => {
    if (!rowToDelete) return; const id = Number(rowToDelete.id ?? rowToDelete.Id);
    if (!id) return; deleteMutation.mutate(id);
  };

  const handleSubmit = (): void => {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) payload[field.key] = normalizeFieldValue(field, formValues[field.key]);
    const statusFallback = resolveStatusFallbackValue(config);
    if (statusFallback != null && (payload.status == null || payload.status === '')) payload.status = statusFallback;
    if (contextFilter?.lockValue) {
      if (contextFilter.value == null) { toast.error(t('aqua.common.requiredField')); return; }
      payload[contextFilter.fieldKey] = contextFilter.value;
    }
    const firstMissingRequiredField = visibleFields.find((field) => isRequiredFieldMissing(field, payload[field.key]));
    if (firstMissingRequiredField) { toast.error(`${t(firstMissingRequiredField.label)} * - ${t('aqua.common.requiredField')}`); return; }
    if (editingRow) {
      const id = Number(editingRow.id ?? editingRow.Id); if (!id) return;
      updateMutation.mutate({ id, payload }); return;
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
  
  let rows = canQueryList ? listQuery.data?.data ?? [] : [];
  if (searchTerm && rows.length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    rows = rows.filter((row) => Object.values(row).some((val) => String(val).toLowerCase().includes(lowerSearch)));
  }

  const totalCount = listQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount);

  // Çoklu Seçim Yönlendiricileri
  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length && rows.length > 0) setSelectedIds([]);
    else setSelectedIds(rows.map(row => Number(row.id ?? row.Id)).filter(id => !isNaN(id)));
  };
  const toggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const getFormattedCellValue = (row: Record<string, unknown>, columnKey: string): string => {
    const rawValue = row[columnKey];
    const lookupLabel = lookupLabelsByFieldAndValue[columnKey]?.[String(rawValue)];
    const selectLabel = selectOptionLabelsByFieldAndValue[columnKey]?.[String(rawValue)];
    return String(lookupLabel ?? selectLabel ?? formatCellValue(rawValue, t));
  };

  // PREMIUM ÖZELLİK: Dinamik Hücre Render İşlemi (Rozetler ve Kopyalama)
  const renderCellContent = (columnKey: string, formattedValue: string) => {
    const lowerKey = columnKey.toLowerCase();
    
    // Status (Durum) ise Renkli Rozet Bas
    if (lowerKey === 'status' || lowerKey === 'durum' || lowerKey === 'isactive') {
      const valLower = formattedValue.toLowerCase();
      let colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50";
      
      if (valLower.includes('post') || valLower.includes('onay') || valLower.includes('aktif') || valLower.includes('yes') || valLower.includes('evet') || valLower === '1') {
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (valLower.includes('bekliyor') || valLower.includes('taslak') || valLower === '0') {
        colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else if (valLower.includes('iptal') || valLower.includes('ret') || valLower.includes('hayır') || valLower.includes('no') || valLower === '2') {
        colorClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      }
      return <Badge className={`rounded-md text-[10px] font-bold uppercase tracking-tighter px-2.5 py-0.5 border ${colorClass}`}>{formattedValue}</Badge>;
    }
    
    // Kod/No içeren bir alansa "Tıkla-Kopyala" bileşeni yap
    if (lowerKey.includes('no') || lowerKey.includes('code') || lowerKey.includes('kod') || lowerKey.includes('mail')) {
      return <CopyableCell text={formattedValue} />;
    }

    return formattedValue;
  };

  const handleExportExcel = async () => {
    try {
      const dataToExport = rows.map((row) => {
        const exportRow: Record<string, string | number> = {};
        exportRow[t('aqua.common.id', 'ID')] = Number(row.id ?? row.Id);
        displayedColumns.forEach((col) => { exportRow[t(col.label)] = getFormattedCellValue(row, col.key); });
        return exportRow;
      });
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(dataToExport); const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Export"); XLSX.writeFile(wb, `${config.key}-export.xlsx`);
      toast.success(t('aqua.common.exportSuccess', 'Başarıyla dışa aktarıldı.'));
    } catch (error) { toast.error(t('aqua.common.exportError', 'Excel kütüphanesi eksik veya hata.')); }
  };

  const handleExportPDF = async () => {
    try {
      const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new JsPDF();
      const tableColumn = [t('aqua.common.id', 'ID'), ...displayedColumns.map((col) => t(col.label))];
      const tableRows = rows.map((row) => [
        String(Number(row.id ?? row.Id)),
        ...displayedColumns.map((col) => getFormattedCellValue(row, col.key))
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows });
      doc.save(`${config.key}-export.pdf`);
      toast.success(t('aqua.common.exportSuccess', 'Başarıyla dışa aktarıldı.'));
    } catch (error) {
      console.error(error);
      toast.error(t('aqua.common.exportError', 'PDF kütüphanesi eksik veya hata oluştu.'));
    }
  };

  const handleExportPowerPoint = async () => {
    try {
      const { default: PptxGenJS } = await import('pptxgenjs');
      const pptx = new PptxGenJS();
      const slide = pptx.addSlide();
      slide.addText(localizedTitle, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true });
      const headers = [t('aqua.common.id', 'ID'), ...displayedColumns.map((col) => t(col.label))];
      const tableRows = rows.map((row) => [
        String(Number(row.id ?? row.Id)),
        ...displayedColumns.map((col) => getFormattedCellValue(row, col.key))
      ]);
      const tableData: Array<Array<{ text: string }>> = [
        headers.map(text => ({ text })),
        ...tableRows.map(rowArr => rowArr.map(text => ({ text }))),
      ];
      slide.addTable(tableData, { x: 0.5, y: 1.5, w: '90%' });
      pptx.writeFile({ fileName: `${config.key}-export.pptx` });
      toast.success(t('aqua.common.exportSuccess', 'Başarıyla dışa aktarıldı.'));
    } catch (error) {
      console.error(error);
      toast.error(t('aqua.common.exportError', 'PowerPoint kütüphanesi eksik veya hata oluştu.'));
    }
  };

  const headStyle = `text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider py-3 px-4 border-r border-slate-200 dark:border-cyan-800/30 last:border-r-0 bg-slate-50 dark:bg-blue-950/80 text-left transition-colors`;
  const cellStyle = `text-slate-700 dark:text-slate-300 px-4 py-3 border-r border-slate-200 dark:border-cyan-800/30 last:border-r-0 text-sm align-middle whitespace-nowrap transition-colors`;

  const tableContainerClass = hidePageHeader ? "w-full flex flex-col bg-transparent relative" : "bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl flex flex-col overflow-hidden transition-all duration-300 relative";

  return (
    <>
      <div className={hidePageHeader ? "w-full relative pb-10" : "w-full space-y-6 relative pb-10"}>
        {!hidePageHeader && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">{localizedTitle}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors mt-1">{localizedDescription}</p>
              </div>

              <div className="flex items-center gap-3">
                {!config.readOnly && (
                  <Button onClick={handleCreate} disabled={!canQueryList} className="px-6 bg-linear-to-r from-cyan-600 to-blue-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform border-0 hover:text-white h-11">
                    <Plus size={18} className="mr-2" />
                    {t('aqua.common.new')}
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl p-5 flex flex-col gap-5 transition-all duration-300">
              <PageToolbar
                searchPlaceholder={t('common.search', { defaultValue: 'Ara...' })}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={async () => { await listQuery.refetch(); }}
                rightSlot={
                  <div className="flex flex-wrap items-start sm:items-center gap-2 w-full flex-1">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white">
                            <span className="font-medium text-sm">{pageSize}</span><ChevronDown size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-20 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-xl overflow-hidden p-1">
                            {[10, 20, 50, 100].map((size) => (
                                <DropdownMenuItem key={size} onSelect={() => setPageSize(size)} className={`flex items-center justify-center text-xs font-medium px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${pageSize === size ? 'bg-cyan-50 dark:bg-cyan-800/30 text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white'}`}>{size}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                          <Button variant={hasFiltersActive ? 'default' : 'outline'} className={`h-10 px-3 sm:px-4 rounded-xl border transition-all duration-300 ${hasFiltersActive ? 'bg-cyan-50 dark:bg-cyan-800/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-800/50' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white'}`}>
                            <Filter className="sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">{t('common.filters', 'Filtreler')}</span>
                            {hasFiltersActive && <span className="ml-2 flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-[calc(100vw-2rem)] sm:w-[420px] p-0 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-2xl overflow-hidden z-50">
                          <AdvancedFilter columns={filterColumns} defaultColumn={filterColumns[0]?.value} draftRows={draftFilterRows} onDraftRowsChange={setDraftFilterRows} onSearch={handleAdvancedSearch} onClear={handleAdvancedClear} embedded />
                        </PopoverContent>
                      </Popover>

                      <ColumnPreferencesPopover pageKey={`aqua-${config.key}`} userId={user?.id} columns={baseColumns.map((col) => ({ key: col.key, label: t(col.label) }))} visibleColumns={visibleColumns} columnOrder={columnOrder} onVisibleColumnsChange={setVisibleColumns} onColumnOrderChange={setColumnOrder} />
                    </div>

                    <div className="ml-auto pl-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex items-center justify-center h-10 w-10 p-0 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white">
                            <Menu size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-xl overflow-hidden p-0">
                          <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {t('aqua.common.actions', 'İşlemler')}
                            </div>
                          </div>
                          <div className="h-px bg-slate-200 dark:bg-cyan-800/30 my-1"></div>
                          <div className="p-2 flex flex-col gap-1">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {t('aqua.common.export', 'Dışa Aktar')}
                            </div>
                            <DropdownMenuItem onSelect={handleExportExcel} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                              <FileSpreadsheet size={16} className="text-emerald-500" />
                              <span>{t('aqua.common.exportExcel', "Excel'e Aktar")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleExportPDF} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                              <FileText size={16} className="text-red-400" />
                              <span>{t('aqua.common.exportPDF', "PDF'e Aktar")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleExportPowerPoint} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                              <Presentation size={16} className="text-orange-400" />
                              <span>{t('aqua.common.exportPPT', "PowerPoint'e Aktar")}</span>
                            </DropdownMenuItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                  </div>
                }
              />
            </div>
          </>
        )}

        <div className={tableContainerClass}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto w-full custom-scrollbar pb-2">
              <table className="w-full min-w-[560px] sm:min-w-[700px] lg:min-w-[820px] caption-bottom text-sm relative border-collapse">
                <thead className="bg-slate-100 dark:bg-blue-950 sticky top-0 z-10 border-b border-slate-200 dark:border-cyan-800/30">
                  <tr className="h-10 hover:bg-transparent">
                    {/* PREMIUM ÖZELLİK: Çoklu Seçim - Tümünü Seç Checkbox */}
                    {!rowSelectionEnabled && (
                      <th className={`${headStyle} w-[40px] px-4 text-center cursor-default`}>
                        <Checkbox checked={selectedIds.length === rows.length && rows.length > 0} onCheckedChange={toggleSelectAll} className="border-slate-300 dark:border-cyan-700 data-[state=checked]:bg-cyan-600" />
                      </th>
                    )}
                    
                    <th className={`${headStyle} cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400`} onClick={() => handleSort('Id')}>
                      <div className="flex items-center gap-2">{t('aqua.common.id', 'ID')}{sortConfig?.key === 'Id' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-cyan-500" /> : <ArrowDown size={14} className="text-cyan-500" />) : (<ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />)}</div>
                    </th>

                    <SortableContext items={displayedColumns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
                      {displayedColumns.map((column) => (
                        <DraggableTh key={column.key} id={column.key} className={headStyle} onClick={() => handleSort(column.key)}>
                          {t(column.label)}{sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-cyan-500 ml-1" /> : <ArrowDown size={14} className="text-cyan-500 ml-1" />) : (<ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 ml-1" />)}
                        </DraggableTh>
                      ))}
                    </SortableContext>
                    <th className={`${headStyle} text-right cursor-default hover:text-slate-500 dark:hover:text-slate-400`}>{t('aqua.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!canQueryList ? (
                    <tr><td colSpan={displayedColumns.length + 3} className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">{t('aqua.common.noData')}</td></tr>
                  ) : listQuery.isLoading ? (
                    <tr>
                      <td colSpan={displayedColumns.length + 3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-current text-cyan-500" />
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{t('aqua.common.loading')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={displayedColumns.length + 3} className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">{t('aqua.common.noData')}</td></tr>
                  ) : (
                    rows.map((row) => {
                      const id = Number(row.id ?? row.Id);
                      const status = Number(row.status ?? row.Status);
                      const isSelected = rowSelectionEnabled ? selectedRowId === id : selectedIds.includes(id);
                      
                      return (
                        <tr key={id} className={`h-10 border-b border-slate-200 dark:border-cyan-800/30 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-blue-900/40 group last:border-0 bg-transparent ${rowSelectionEnabled ? 'cursor-pointer' : ''} ${isSelected ? 'bg-cyan-50 dark:bg-cyan-800/20' : ''}`} onClick={() => { if (rowSelectionEnabled) onRowSelect?.(row); }}>
                          {/* PREMIUM ÖZELLİK: Çoklu Seçim Checkbox */}
                          {!rowSelectionEnabled && (
                            <td className={`${cellStyle} px-4 text-center`}>
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectRow(id)} className="border-slate-300 dark:border-cyan-700 data-[state=checked]:bg-cyan-600" />
                            </td>
                          )}

                          <td className={`${cellStyle} font-mono text-xs`}><CopyableCell text={String(id)} /></td>
                          
                          {displayedColumns.map((column) => (
                            <td key={column.key} className={cellStyle}>
                              {/* Dinamik Render (Rozet ve Copy eklentisi ile) */}
                              {renderCellContent(column.key, getFormattedCellValue(row, column.key))}
                            </td>
                          ))}
                          <td className={`${cellStyle} text-right w-[1%] whitespace-nowrap`}>
                            <div className="flex items-center justify-end gap-1">
                              {/* PREMIUM ÖZELLİK: Sağ Çekmeceyi (View Detay) Açan Buton */}
                              <Button variant="ghost" size="icon" title="Detay Görüntüle" onClick={(e) => { e.stopPropagation(); setViewingRow(row); }} className="h-8 w-8 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors">
                                <Eye size={16} />
                              </Button>

                              {!config.readOnly && (
                                <>
                                  <Button variant="ghost" size="icon" title={t('aqua.common.edit', 'Düzenle')} onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                    <Edit size={16} />
                                  </Button>
                                  <Button variant="ghost" size="icon" title={t('aqua.common.delete', 'Sil')} onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }} className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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
          </DndContext>

          <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-cyan-800/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between w-full shrink-0 bg-slate-50 dark:bg-blue-950/50 relative z-10">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{rangeStart}-{rangeEnd} / {totalCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))} disabled={pageNumber <= 1} className="rounded-lg bg-white dark:bg-transparent border-slate-200 dark:border-cyan-800/30 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50">{t('aqua.common.previous')}</Button>
              <Button variant="outline" size="sm" onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))} disabled={pageNumber >= totalPages} className="rounded-lg bg-white dark:bg-transparent border-slate-200 dark:border-cyan-800/30 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50">{t('aqua.common.next')}</Button>
            </div>
          </div>
        </div>

        {/* PREMIUM ÖZELLİK: Çoklu Seçim / Havada Asılı Bar (Floating Action Bar) */}
        {!rowSelectionEnabled && selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/95 dark:bg-blue-950/95 backdrop-blur-xl border border-slate-700 dark:border-cyan-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-full px-4 sm:px-6 py-2.5 sm:py-3">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-0 pointer-events-none px-3 font-bold text-xs">
                {selectedIds.length} Seçildi
              </Badge>
              <div className="h-5 w-px bg-slate-700 dark:bg-cyan-800/50 hidden sm:block" />
              <Button size="sm" variant="ghost" onClick={handleExportExcel} className="text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-blue-900/50 rounded-xl h-8 font-bold text-xs transition-colors">
                <Download size={14} className="sm:mr-2" /> <span className="hidden sm:inline">Dışa Aktar</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleBulkDelete} disabled={isBulkDeleting} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl h-8 font-bold text-xs transition-colors">
                <Trash2 size={14} className="sm:mr-2" /> <span className="hidden sm:inline">{isBulkDeleting ? 'Siliniyor...' : 'Seçilenleri Sil'}</span>
              </Button>
            </div>
          </div>
        )}

        {!config.readOnly && (
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="[&>button]:hidden bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white max-w-3xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-950/50 flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
                     <div className="h-full w-full bg-white dark:bg-blue-950 rounded-[14px] flex items-center justify-center">
                       <FileText size={24} className="text-cyan-600 dark:text-cyan-500" />
                     </div>
                   </div>
                   <div className="space-y-1 text-left">
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {editingRow ? t('aqua.common.editRecord', 'Kaydı Düzenle') : t('aqua.common.createRecord', 'Yeni Kayıt')}
                      </DialogTitle>
                      <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">{localizedTitle} modülü için bilgileri doldurun.</DialogDescription>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full"><X size={20} /></Button>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-white dark:bg-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  {visibleFields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}>
                      <Label htmlFor={field.key} className={LABEL_STYLE}>
                        <ChevronRight size={14} className="text-cyan-500" />
                        {t(field.label)} {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' && (
                        <Textarea id={field.key} placeholder={field.placeholder} value={String(formValues[field.key] ?? '')} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))} className={`${INPUT_STYLE} min-h-[100px] py-3 resize-none`} />
                      )}
                      {field.type === 'select' && (
                        <Combobox options={field.lookup ? (lookupOptionsByField[field.key] ?? []).map((o) => ({ value: String(o.value), label: o.label })) : (field.options ?? (field.key.toLowerCase() === 'status' ? DOC_STATUS_OPTIONS : [])).map((o) => ({ value: String(o.value), label: t(o.label) }))} value={String(formValues[field.key] ?? '')} onValueChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))} placeholder={t('aqua.common.select')} searchPlaceholder={t('common.search')} emptyText={t('common.noResults')} className="bg-slate-50 dark:bg-blue-950/50 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30" />
                      )}
                      {(field.type === 'text' || field.type === 'number' || field.type === 'date' || field.type === 'datetime') && (
                        <Input id={field.key} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'} step={field.type === 'number' ? resolveNumberInputStep(field) : undefined} min={field.type === 'number' ? field.numberMin : undefined} max={field.type === 'number' ? field.numberMax : undefined} inputMode={field.type === 'number' ? 'decimal' : undefined} placeholder={field.placeholder} value={normalizeInputValue(field, formValues[field.key])} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))} className={INPUT_STYLE} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="px-6 py-5 border-t border-slate-200 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-950/50 flex-col sm:flex-row gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="w-full sm:w-auto h-11 rounded-xl bg-white dark:bg-transparent border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 text-slate-700 dark:text-slate-200">{t('aqua.common.cancel')}</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || hasMissingRequiredField} className="w-full sm:w-auto h-11 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 border-0 font-bold disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? t('aqua.common.saving') : t('aqua.common.save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={!!rowToDelete} onOpenChange={(open) => !open && setRowToDelete(null)}>
          <DialogContent className="[&>button]:hidden bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white max-w-sm w-[95%] shadow-2xl sm:rounded-2xl p-0 overflow-hidden">
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-5">
                 <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-600/10 flex items-center justify-center"><AlertTriangle size={32} className="text-red-600 dark:text-red-500" /></div>
                 <div className="space-y-3">
                   <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('aqua.common.confirmDelete', 'Emin misiniz?')}</h2>
                   <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">Bu kaydı kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?</p>
                 </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-950/50 flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setRowToDelete(null)} className="w-full sm:w-auto h-11 rounded-xl bg-white dark:bg-transparent border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 text-slate-700 dark:text-slate-200 font-medium">{t('aqua.common.cancel', 'İptal')}</Button>
                <Button onClick={confirmDelete} disabled={isDeleting} className="w-full sm:w-auto h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 border-0 font-bold">{isDeleting ? t('aqua.common.deleting', 'Siliniyor...') : t('aqua.common.delete', 'Sil')}</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PREMIUM ÖZELLİK: Detay Görüntüleme Modalı (Ortalanmış ve Taşma Korumalı) */}
        <Dialog open={!!viewingRow} onOpenChange={(open) => !open && setViewingRow(null)}>
          <DialogContent className="[&>button]:hidden bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white max-w-lg w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20"><FileText className="size-5 text-cyan-600 dark:text-cyan-400" /></div>
                  Kayıt Detayı
                </DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => setViewingRow(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20} /></Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white dark:bg-transparent">
              {viewingRow && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kayıt ID</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white"><CopyableCell text={String(viewingRow.id ?? viewingRow.Id)} /></p>
                  </div>
                  {displayedColumns.map(col => (
                    <div key={col.key} className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t(col.label)}</p>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-300">
                        {renderCellContent(col.key, getFormattedCellValue(viewingRow, col.key))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-cyan-800/20 bg-slate-50/50 dark:bg-blue-900/10 shrink-0 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingRow(null)} className="rounded-xl border-slate-200 dark:border-cyan-800/30 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-blue-900/30">Kapat</Button>
              {!config.readOnly && viewingRow && (
                <Button onClick={() => { handleEdit(viewingRow); setViewingRow(null); }} className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold border-0 shadow-lg shadow-cyan-500/20">Düzenle</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
