import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Columns3, EyeOff, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { saveColumnPreferences } from '@/lib/column-preferences';

const ID_COLUMN_KEY = 'id';

export interface ColumnDef {
  key: string;
  label: string;
}

interface ColumnPreferencesPopoverProps {
  pageKey: string;
  userId?: number;
  columns: ColumnDef[];
  visibleColumns: string[];
  columnOrder: string[];
  onVisibleColumnsChange: (visible: string[]) => void;
  onColumnOrderChange: (order: string[]) => void;
}

export function ColumnPreferencesPopover({
  pageKey,
  userId,
  columns,
  visibleColumns,
  columnOrder,
  onVisibleColumnsChange,
  onColumnOrderChange,
}: ColumnPreferencesPopoverProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const columnMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const displayColumns = columnOrder.filter((k) => visibleColumns.includes(k));
  const hiddenColumns = columnOrder.filter((k) => !visibleColumns.includes(k));

  const toggleColumn = (key: string): void => {
    if (key === ID_COLUMN_KEY) return;
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter((k) => k !== key)
      : [...visibleColumns, key].sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b));
    onVisibleColumnsChange(next);
    saveColumnPreferences(pageKey, userId, { order: columnOrder, visibleKeys: next });
  };

  const moveColumn = (key: string, direction: 'up' | 'down'): void => {
    if (key === ID_COLUMN_KEY) return;
    const visibleOrdered = columnOrder.filter((k) => visibleColumns.includes(k));
    const idx = visibleOrdered.indexOf(key);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= visibleOrdered.length) return;
    const next = [...visibleOrdered];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    const hidden = columnOrder.filter((k) => !visibleColumns.includes(k));
    const newOrder = [...next, ...hidden];
    onColumnOrderChange(newOrder);
    onVisibleColumnsChange(next);
    saveColumnPreferences(pageKey, userId, { order: newOrder, visibleKeys: next });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3 sm:px-4 border-slate-200 dark:border-cyan-800/30 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/50 rounded-xl transition-all text-xs sm:text-sm"
        >
          {/* BURASI DÜZELTİLDİ: Yazı küçük ekranda gizlenir, sadece ikon kalır */}
          <Columns3 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.editColumns')}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-72 p-0 bg-white/95 dark:bg-blue-950/95 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/40 shadow-2xl rounded-2xl z-50 overflow-hidden">
        <div className="p-2 space-y-2">
          <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest px-2 py-1.5 flex items-center gap-2">
            <Eye className="w-3 h-3" />
            {t('activityManagement.columnCustomization.visibleColumns')}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {displayColumns.map((key) => {
              const col = columnMap.get(key);
              if (!col) return null;
              const isId = key === ID_COLUMN_KEY;
              const idx = displayColumns.indexOf(key);
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-blue-900/40 group transition-colors"
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {!isId && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-pink-500 dark:hover:bg-blue-900/60"
                          onClick={() => moveColumn(key, 'up')}
                          disabled={idx <= 1}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-pink-500 dark:hover:bg-blue-900/60"
                          onClick={() => moveColumn(key, 'down')}
                          disabled={idx >= displayColumns.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{col.label}</span>
                  </div>
                  {!isId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-slate-400 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      onClick={() => toggleColumn(key)}
                      title={t('activityManagement.columnCustomization.hiddenColumns')}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {hiddenColumns.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2 py-1.5 pt-3 border-t border-slate-100 dark:border-cyan-800/30 flex items-center gap-2">
                 <EyeOff className="w-3 h-3" />
                {t('activityManagement.columnCustomization.hiddenColumns')}
              </div>
              <div className="space-y-1">
                {hiddenColumns.map((key) => {
                  const col = columnMap.get(key);
                  if (!col) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <span className="text-sm text-slate-500 dark:text-slate-500 truncate line-through decoration-slate-400/30">
                        {col.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-slate-400 hover:text-emerald-500 dark:hover:bg-emerald-500/10"
                        onClick={() => toggleColumn(key)}
                        title={t('activityManagement.columnCustomization.visibleColumns')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}