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
import { Plus, Search, Trash2 } from 'lucide-react';

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

  const addRow = (): void => {
    onDraftRowsChange([
      ...draftRows,
      { id: generateId(), column: defaultColumn, operator: getDefaultOperatorForColumn(defaultColumn, columns), value: '' },
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
        if (patch.column !== undefined) {
          next.operator = getDefaultOperatorForColumn(patch.column, columns);
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

  return (
    <div className={embedded ? 'p-4 space-y-4' : 'rounded-xl border border-slate-200 dark:border-cyan-800/30 bg-white/50 dark:bg-blue-950/60 backdrop-blur-xl p-4 space-y-4'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-pink-500" />
          {getLabel('title', t('common.advancedFilter.title', { ns: 'common', defaultValue: 'Gelişmiş Filtre' }))}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 border-slate-200 dark:border-cyan-800/50 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/50">
            <Plus className="h-4 w-4 mr-1 text-pink-500" />
            {getLabel('add', t('common.advancedFilter.add', { ns: 'common', defaultValue: 'Filtre Ekle' }))}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="h-8 border-slate-200 dark:border-cyan-800/50 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/50">
            {getLabel('clear', t('common.advancedFilter.clear', { ns: 'common', defaultValue: 'Temizle' }))}
          </Button>
          <Button type="button" size="sm" onClick={onSearch} className="h-8 bg-pink-600 hover:bg-pink-500 text-white border-0 shadow-md shadow-pink-500/20">
            {getLabel('search', t('common.advancedFilter.search', { ns: 'common', defaultValue: 'Ara' }))}
          </Button>
        </div>
      </div>
      {draftRows.length > 0 && (
        <div className="space-y-3 mt-4">
          {draftRows.map((row) => {
            const colConfig = columns.find((c) => c.value === row.column);
            const isDate = colConfig?.type === 'date';
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-2 bg-slate-50/50 dark:bg-blue-900/20 p-2 rounded-xl border border-slate-100 dark:border-cyan-800/30 transition-all hover:border-pink-500/30">
                <Combobox
                  options={columns.map((c) => ({
                    value: c.value,
                    label: getColumnLabel(c),
                  }))}
                  value={row.column}
                  onValueChange={(v) => updateRow(row.id, { column: v })}
                  placeholder={getLabel('column', t('common.advancedFilter.column', { ns: 'common', defaultValue: 'Sütun' }))}
                  searchPlaceholder={t('common.search', { ns: 'common', defaultValue: 'Ara...' })}
                  emptyText={t('common.noResults', { ns: 'common', defaultValue: 'Sonuç yok' })}
                  className="w-full sm:w-[160px] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-slate-200 focus-visible:ring-pink-500/20"
                />
                <Combobox
                  options={getOperatorsForColumn(row.column, columns).map((op) => ({
                    value: op,
                      label: getOperatorLabel(op),
                  }))}
                  value={row.operator}
                  onValueChange={(v) => updateRow(row.id, { operator: v })}
                  placeholder={getLabel('operator', t('common.advancedFilter.operator', { ns: 'common', defaultValue: 'Operatör' }))}
                  searchPlaceholder={t('common.search', { ns: 'common', defaultValue: 'Ara...' })}
                  emptyText={t('common.noResults', { ns: 'common', defaultValue: 'Sonuç yok' })}
                  className="w-full sm:w-[130px] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-slate-200 focus-visible:ring-pink-500/20"
                />
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
                    className="w-full sm:w-[160px] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-slate-200 focus-visible:ring-pink-500/20"
                  />
                ) : (
                  <Input
                    type={isDate ? 'date' : 'text'}
                    placeholder={getLabel('value', t('common.advancedFilter.value', { ns: 'common', defaultValue: 'Değer' }))}
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className="w-full sm:w-[160px] h-10 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/50 text-slate-900 dark:text-slate-200 focus-visible:border-pink-500 focus-visible:ring-pink-500/20 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  onClick={() => removeRow(row.id)}
                  aria-label={getLabel('remove', t('common.advancedFilter.remove', { ns: 'common', defaultValue: 'Kaldır' }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
