import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { StockTable } from './StockTable';
import { PageToolbar, ColumnPreferencesPopover, AdvancedFilter } from '@/components/shared';
import { STOCK_QUERY_KEYS } from '../utils/query-keys';
import type { PagedFilter } from '@/types/api';
import { loadColumnPreferences } from '@/lib/column-preferences';
import type { FilterRow, FilterColumnConfig } from '@/lib/advanced-filter-types';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Filter, Menu, FileSpreadsheet, FileText, X } from 'lucide-react';

const STOCK_COLUMNS = [
  { key: 'Id', label: 'stock.list.id' },
  { key: 'ErpStockCode', label: 'stock.list.erpStockCode' },
  { key: 'StockName', label: 'stock.list.stockName' },
  { key: 'Unit', label: 'stock.list.unit' }
];

export function StockListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('Id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Gelişmiş Filtre Stateleri
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);

  // Sütun Tercihleri
  const defaultColumnKeys = useMemo(() => STOCK_COLUMNS.map(c => c.key), []);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => defaultColumnKeys);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => defaultColumnKeys);

  useEffect(() => {
    const prefs = loadColumnPreferences('aqua-stocks', user?.id, defaultColumnKeys);
    setVisibleColumns(prefs.visibleKeys);
    setColumnOrder(prefs.order);
  }, [user?.id, defaultColumnKeys]);

  useEffect(() => {
    setPageTitle(t('stock.list.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  // Sayfa başa dönsün
  useEffect(() => {
    setPageNumber(1);
  }, [searchTerm, pageSize, sortBy, sortDirection, appliedFilterRows]);

  const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc'): void => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const handleRowClick = (stockId: number): void => {
    navigate(`/stocks/${stockId}`);
  };

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEYS.LIST] });
    await queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEYS.LIST_WITH_IMAGES] });
  };

  // Filtreleme Ayarları
  const filterColumns = useMemo<(FilterColumnConfig & { translatedLabel?: string })[]>(() => [
    { value: 'ErpStockCode', type: 'string', labelKey: 'stock.list.erpStockCode', translatedLabel: t('stock.list.erpStockCode') },
    { value: 'StockName', type: 'string', labelKey: 'stock.list.stockName', translatedLabel: t('stock.list.stockName') },
    { value: 'Unit', type: 'string', labelKey: 'stock.list.unit', translatedLabel: t('stock.list.unit') },
  ], [t]);

  const handleAdvancedSearch = () => {
    setAppliedFilterRows(draftFilterRows);
    setShowFilters(false);
  };

  const handleAdvancedClear = () => {
    setDraftFilterRows([]);
    setAppliedFilterRows([]);
  };

  const removeFilter = (indexToRemove: number) => {
    const newFilters = appliedFilterRows.filter((_, i) => i !== indexToRemove);
    setAppliedFilterRows(newFilters);
    setDraftFilterRows(newFilters);
  };

  const filterOperatorMap: Record<string, string> = { eq: '=', neq: '!=', contains: 'içerir', startswith: 'ile başlar', endswith: 'ile biter' };
  const hasFiltersActive = appliedFilterRows.some((r) => r.value != null && String(r.value).trim() !== '');

  // API'ye gönderilecek filtreler
  const effectiveFilters = useMemo(() => {
    const filters: PagedFilter[] = [];
    if (searchTerm) {
      filters.push(
        { column: 'StockName', operator: 'contains', value: searchTerm },
        { column: 'ErpStockCode', operator: 'contains', value: searchTerm }
      );
    }
    appliedFilterRows.forEach(row => {
      if (row.column && row.value != null && String(row.value).trim() !== '') {
         filters.push({ column: row.column, operator: row.operator || 'contains', value: String(row.value) });
      }
    });
    return filters.length > 0 ? { filters } : {};
  }, [searchTerm, appliedFilterRows]);

  // Dummy Dışa Aktarım (Simülasyon için)
  const handleExport = (type: string) => {
    toast.success(t('aqua.common.exportSuccess', `Başarıyla ${type} dışa aktarıldı.`));
  };

  return (
    <div className="relative min-h-screen space-y-6 overflow-hidden w-full animate-in fade-in duration-500">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">
            {t('stock.list.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 font-medium transition-colors mt-1">
            {t('stock.list.description')}
          </p>
        </div>
      </div>

      {/* ARAÇ ÇUBUĞU & FİLTRELER */}
      <div className="relative z-10 bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl p-5 flex flex-col gap-5 shadow-sm transition-all duration-300">
        <PageToolbar
          searchPlaceholder={t('stock.list.search')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
          rightSlot={
            <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-blue-900/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white">
                    <span className="font-medium text-sm">{pageSize}</span>
                    <ChevronDown size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-20 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-xl overflow-hidden p-1">
                    {[10, 20, 50, 100].map((size) => (
                        <DropdownMenuItem key={size} onSelect={() => setPageSize(size)} className={`flex items-center justify-center text-xs font-medium px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${pageSize === size ? 'bg-cyan-50 dark:bg-cyan-800/30 text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white'}`}>
                            {size}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    variant={hasFiltersActive ? 'default' : 'outline'}
                    className={`h-10 px-4 rounded-xl border transition-all duration-300 ${
                      hasFiltersActive
                        ? 'bg-cyan-50 dark:bg-cyan-800/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-800/50'
                        : 'bg-slate-50 dark:bg-blue-900/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('common.filters', 'Filtreler')}</span>
                    {hasFiltersActive && <span className="ml-2 flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-[420px] p-0 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-2xl overflow-hidden z-50">
                  <AdvancedFilter
                    columns={filterColumns}
                    defaultColumn={filterColumns[0]?.value}
                    draftRows={draftFilterRows}
                    onDraftRowsChange={setDraftFilterRows}
                    onSearch={handleAdvancedSearch}
                    onClear={handleAdvancedClear}
                    embedded
                  />
                </PopoverContent>
              </Popover>

              <ColumnPreferencesPopover
                pageKey="aqua-stocks"
                userId={user?.id}
                columns={STOCK_COLUMNS.map((col) => ({ key: col.key, label: t(col.label) }))}
                visibleColumns={visibleColumns}
                columnOrder={columnOrder}
                onVisibleColumnsChange={setVisibleColumns}
                onColumnOrderChange={setColumnOrder}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center h-10 w-10 p-0 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-blue-900/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/50 hover:text-slate-900 dark:hover:text-white shrink-0">
                    <Menu size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-xl overflow-hidden p-0">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('aqua.common.actions', 'İşlemler')}</div>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-cyan-800/30 my-1"></div>
                  <div className="p-2 flex flex-col gap-1">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('aqua.common.export', 'Dışa Aktar')}</div>
                    <DropdownMenuItem onSelect={() => handleExport('Excel')} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50 cursor-pointer"><FileSpreadsheet size={16} className="text-emerald-500" /><span>{t('aqua.common.exportExcel', "Excel'e Aktar")}</span></DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport('PDF')} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/50 cursor-pointer"><FileText size={16} className="text-red-400" /><span>{t('aqua.common.exportPDF', "PDF'e Aktar")}</span></DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        {/* FİLTRE ÇİPLERİ */}
        {hasFiltersActive && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-cyan-800/30 animate-in fade-in duration-300">
            <span className="text-[11px] font-bold text-slate-400 dark:text-cyan-500/70 uppercase tracking-widest mr-1">Aktif Filtreler:</span>
            {appliedFilterRows.map((filter, idx) => {
              if (!filter.column || filter.value == null || String(filter.value).trim() === '') return null;
              // TS Hatasını çözdüğümüz type casting işlemi:
              const colDef = filterColumns.find(c => c.value === filter.column) as (FilterColumnConfig & { translatedLabel?: string }) | undefined;
              const colLabel = colDef?.translatedLabel || filter.column;
              const opLabel = filterOperatorMap[filter.operator || 'contains'] || filter.operator;
              
              return (
                <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30 flex items-center gap-1.5 rounded-xl">
                  <span className="font-bold opacity-80">{colLabel}</span>
                  <span className="text-cyan-500/60 font-black">{opLabel}</span>
                  <span className="font-black truncate max-w-[150px]">{String(filter.value)}</span>
                  <div className="w-px h-3 bg-cyan-200 dark:bg-cyan-800/50 mx-0.5" />
                  <button onClick={() => removeFilter(idx)} className="hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 rounded-full p-0.5"><X size={12} strokeWidth={3} /></button>
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleAdvancedClear} className="h-7 px-3 text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg ml-auto">Tümünü Temizle</Button>
          </div>
        )}
      </div>

      {/* TABLO ALANI */}
      <div className="relative z-10 bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        <StockTable
          pageNumber={pageNumber}
          pageSize={pageSize}
          sortBy={sortBy}
          sortDirection={sortDirection}
          filters={effectiveFilters}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onPageChange={setPageNumber}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}