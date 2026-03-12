import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import type { FilterRow, FilterColumnConfig } from '@/lib/advanced-filter-types';
import {
  getOperatorsForColumn,
  getDefaultOperatorForColumn,
} from '@/lib/advanced-filter-types';
import { Plus, Search, Trash2, Filter } from 'lucide-react';

export interface AdvancedFilterProps {
  columns: readonly FilterColumnConfig[];
  defaultColumn: string;
  draftRows: FilterRow[];
  onDraftRowsChange: (rows: FilterRow[]) => void;
  onSearch: () => void;
  onClear: () => void;
  translationNamespace?: string;
  embedded?: boolean;
}

function generateId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdvancedFilter({
  columns,
  defaultColumn,
  draftRows,
  onDraftRowsChange,
  onSearch,
  onClear,
  translationNamespace = 'common',
  embedded = false,
}: AdvancedFilterProps): ReactElement {
  const { t } = useTranslation([translationNamespace, 'common']);

  // Yeni satır eklerken defaultColumn'un columns dizisinde olup olmadığını kontrol ediyoruz
  const addRow = (): void => {
    const safeDefault = columns.find(c => c.value === defaultColumn) ? defaultColumn : columns[0]?.value;
    if (!safeDefault) return; // Eğer sütun yoksa ekleme

    onDraftRowsChange([
      ...draftRows,
      { 
        id: generateId(), 
        column: safeDefault, 
        operator: getDefaultOperatorForColumn(safeDefault, columns), 
        value: '' 
      },
    ]);
  };

  const removeRow = (id: string): void => {
    onDraftRowsChange(draftRows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<Omit<FilterRow, 'id'>>): void => {
    onDraftRowsChange(
      draftRows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Sütun değiştiyse operatörü o sütunun varsayılanına sıfırla
        if (patch.column !== undefined) {
          next.operator = getDefaultOperatorForColumn(patch.column, columns);
          next.value = ''; // Sütun değişince eski değeri de temizlemek mantıklıdır
        }
        return next;
      })
    );
  };

  const getLabel = (key: string, fallback?: string): string => {
    const nsVal = t(`advancedFilter.${key}`, { ns: translationNamespace });
    if (nsVal && nsVal !== `advancedFilter.${key}`) return nsVal;
    const commonVal = t(`advancedFilter.${key}`, { ns: 'common' });
    if (commonVal && commonVal !== `advancedFilter.${key}`) return commonVal;
    return fallback ?? key;
  };

  const getOperatorLabel = (operator: string): string => {
    const keyMap: Record<string, string> = {
      Contains: 'operatorContains',
      StartsWith: 'operatorStartsWith',
      EndsWith: 'operatorEndsWith',
      Equals: 'operatorEquals',
      '>': 'operator>',
      '>=': 'operator>=',
      '<': 'operator<',
      '<=': 'operator<=',
    };

    const translationKey = keyMap[operator];
    if (!translationKey) return operator;
    return getLabel(translationKey, operator);
  };

  const getColumnLabel = (c: FilterColumnConfig & { translatedLabel?: string }): string => {
    if (c.translatedLabel) return c.translatedLabel;

    const nsVal = t(c.labelKey, { ns: translationNamespace });
    if (nsVal && nsVal !== c.labelKey) return nsVal;
    
    const globalVal = t(c.labelKey, { ns: 'common' });
    if (globalVal && globalVal !== c.labelKey) return globalVal;
    
    return c.value;
  };

  // Pop-up içine sığması için bileşenleri daralttık ve flex yapılarını güncelledik
  return (
    <div className={embedded ? 'p-4 flex flex-col gap-4' : 'rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-white/50 dark:bg-blue-950/60 backdrop-blur-xl p-5 flex flex-col gap-4 shadow-xl'}>
      
      {/* Üst Başlık ve Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
          <div className="p-1.5 bg-pink-500/10 rounded-lg">
            <Search className="w-4 h-4 text-pink-500" />
          </div>
          {getLabel('title', t('common.advancedFilter.title', { ns: 'common', defaultValue: 'Gelişmiş Filtre' }))}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addRow} 
            className="h-8 rounded-lg border-cyan-200 dark:border-cyan-800/50 bg-cyan-50/50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-800/40 transition-colors font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {getLabel('add', t('common.advancedFilter.add', { ns: 'common', defaultValue: 'Filtre Ekle' }))}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onClear} 
            className="h-8 rounded-lg border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {getLabel('clear', t('common.advancedFilter.clear', { ns: 'common', defaultValue: 'Temizle' }))}
          </Button>
          <Button 
            type="button" 
            size="sm" 
            onClick={onSearch} 
            className="h-8 rounded-lg bg-pink-600 hover:bg-pink-500 text-white border-0 shadow-md shadow-pink-500/20 font-bold transition-transform hover:scale-105"
          >
            {getLabel('search', t('common.advancedFilter.search', { ns: 'common', defaultValue: 'Ara' }))}
          </Button>
        </div>
      </div>

      {/* Filtre Satırları */}
      {draftRows.length > 0 ? (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {draftRows.map((row) => {
            const colConfig = columns.find((c) => c.value === row.column);
            const isDate = colConfig?.type === 'date';

            return (
              <div key={row.id} className="flex items-center gap-2 bg-slate-50 dark:bg-blue-900/30 p-2 rounded-xl border border-slate-200 dark:border-cyan-800/30 transition-all hover:border-pink-500/50">
                
                {/* Sütun Seçici */}
                <Combobox
                  options={columns.map((c) => ({ value: c.value, label: getColumnLabel(c) }))}
                  value={row.column}
                  onValueChange={(v) => updateRow(row.id, { column: v })}
                  placeholder={getLabel('column', t('common.advancedFilter.column', { ns: 'common', defaultValue: 'Sütun' }))}
                  searchPlaceholder={t('common.search', { ns: 'common', defaultValue: 'Ara...' })}
                  emptyText={t('common.noResults', { ns: 'common', defaultValue: 'Sonuç yok' })}
                  className="flex-1 min-w-[120px] h-9 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-white focus-visible:ring-pink-500/20 text-xs font-semibold rounded-lg"
                />

                {/* Operatör Seçici */}
                <Combobox
                  options={getOperatorsForColumn(row.column, columns).map((op) => ({ value: op, label: getOperatorLabel(op) }))}
                  value={row.operator}
                  onValueChange={(v) => updateRow(row.id, { operator: v })}
                  placeholder={getLabel('operator', t('common.advancedFilter.operator', { ns: 'common', defaultValue: 'Operatör' }))}
                  searchPlaceholder={t('common.search', { ns: 'common', defaultValue: 'Ara...' })}
                  emptyText={t('common.noResults', { ns: 'common', defaultValue: 'Sonuç yok' })}
                  className="w-[100px] shrink-0 h-9 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-cyan-600 dark:text-cyan-400 focus-visible:ring-pink-500/20 text-xs font-black text-center rounded-lg"
                />

                {/* Değer Girdisi */}
                {colConfig?.type === 'boolean' ? (
                  <Combobox
                    options={[
                      { value: '_none', label: getLabel('value', t('common.advancedFilter.value', { ns: 'common', defaultValue: 'Değer' })) },
                      { value: 'true', label: t('advancedFilter.true', { ns: 'common', defaultValue: 'Evet' }) },
                      { value: 'false', label: t('advancedFilter.false', { ns: 'common', defaultValue: 'Hayır' }) },
                    ]}
                    value={row.value.toLowerCase() === 'true' ? 'true' : row.value.toLowerCase() === 'false' ? 'false' : '_none'}
                    onValueChange={(v) => updateRow(row.id, { value: v === '_none' ? '' : v })}
                    placeholder={getLabel('value', t('common.advancedFilter.value', { ns: 'common', defaultValue: 'Değer' }))}
                    searchPlaceholder={t('common.search', { ns: 'common', defaultValue: 'Ara...' })}
                    emptyText={t('common.noResults', { ns: 'common', defaultValue: 'Sonuç yok' })}
                    className="flex-1 min-w-[100px] h-9 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-white focus-visible:ring-pink-500/20 text-xs font-semibold rounded-lg"
                  />
                ) : (
                  <Input
                    type={isDate ? 'date' : 'text'}
                    placeholder={getLabel('value', t('common.advancedFilter.value', { ns: 'common', defaultValue: 'Değer' }))}
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className="flex-1 min-w-[100px] h-9 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-white focus-visible:border-pink-500 focus-visible:ring-pink-500/20 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium"
                  />
                )}

                {/* Satır Silme Butonu */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  onClick={() => removeRow(row.id)}
                  title={getLabel('remove', t('common.advancedFilter.remove', { ns: 'common', defaultValue: 'Kaldır' }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-cyan-800/30 rounded-xl bg-slate-50/50 dark:bg-blue-900/10">
          <Filter className="w-8 h-8 text-slate-300 dark:text-cyan-800/50 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Henüz filtre eklenmedi.<br/>Yukarıdaki butondan yeni filtre ekleyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}