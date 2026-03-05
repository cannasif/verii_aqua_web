import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { getPermissionDisplayMeta, getPermissionModuleDisplayMeta, isLeafPermissionCode } from '../utils/permission-config';
import { cn } from '@/lib/utils';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function PermissionDefinitionMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'code',
    sortDirection: 'asc',
  });

  const items = (data?.data ?? []).filter((d) => d.isActive && isLeafPermissionCode(d.code));
  const [search, setSearch] = useState('');

  const getDisplayLabel = useCallback(
    (code: string, name: string | null | undefined): string => {
      const trimmedName = (name ?? '').trim();
      if (trimmedName) return trimmedName;
      const meta = getPermissionDisplayMeta(code);
      if (meta) return t(meta.key, meta.fallback);
      return code;
    },
    [t]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const display = getDisplayLabel(item.code, item.name);
      return (item.code ?? '').toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q) || display.toLowerCase().includes(q);
    });
  }, [items, search, getDisplayLabel]);

  const groupedItems = useMemo(() => {
    const buckets = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const prefix = (item.code ?? '').split('.').filter(Boolean)[0] ?? 'other';
      const meta = getPermissionModuleDisplayMeta(prefix);
      const groupLabel = meta ? t(meta.key, meta.fallback) : prefix;
      const existing = buckets.get(groupLabel);
      if (existing) {
        existing.push(item);
      } else {
        buckets.set(groupLabel, [item]);
      }
    }

    const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([groupLabel, groupItems]) => ({
      groupLabel,
      items: groupItems.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '')),
    }));
  }, [filteredItems, t]);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      const ids = new Set<number>(value);
      for (const item of filteredItems) ids.add(item.id);
      onChange(Array.from(ids));
    } else {
      const filteredIds = new Set<number>(filteredItems.map((i) => i.id));
      onChange(value.filter((id) => !filteredIds.has(id)));
    }
  };

  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    const selected = new Set<number>(value);
    return filteredItems.every((i) => selected.has(i.id));
  }, [filteredItems, value]);

  if (isLoading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400 py-4 font-medium animate-pulse">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('permissionGroups.search')}
        disabled={disabled}
        className="bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white rounded-xl h-10 focus-visible:ring-pink-500/20"
      />
      
      <div className="flex items-center gap-2 px-1">
        <Checkbox
          id="select-all-permissions"
          checked={allFilteredSelected}
          onCheckedChange={(c) => handleSelectAll(!!c)}
          disabled={disabled || filteredItems.length === 0}
          className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 border-slate-300 dark:border-white/20"
        />
        <label htmlFor="select-all-permissions" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
          {t('permissionGroups.selectAll')}
        </label>
      </div>

      {/* ASIL DÜZELTİLEN LİSTE ALANI */}
      <div className="max-h-[300px] overflow-y-auto border border-border dark:border-white/10 rounded-xl p-3 space-y-4 bg-slate-50/50 dark:bg-black/20 custom-scrollbar transition-colors">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center font-medium">{t('permissionGroups.noDefinitions')}</p>
        ) : (
          groupedItems.map(({ groupLabel, items: group }) => (
            <div key={groupLabel} className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-pink-600 dark:text-pink-400/80 px-1 mb-1">
                {groupLabel}
              </div>
              <div className="space-y-1">
                {group.map((item) => {
                  const display = getDisplayLabel(item.code, item.name);
                  const isSelected = value.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                        isSelected ? "bg-pink-500/5 dark:bg-pink-500/10" : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <Checkbox
                        id={`perm-${item.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(item.id)}
                        disabled={disabled}
                        className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 border-slate-300 dark:border-white/20"
                      />
                      <label htmlFor={`perm-${item.id}`} className="text-sm cursor-pointer flex-1 group-hover:translate-x-0.5 transition-transform">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{display}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {item.code}
                          </span>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}