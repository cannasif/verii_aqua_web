import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge'; // HATA FIX: Badge eklendi
import { Search, Globe, ChevronRight, CheckCircle2 } from 'lucide-react';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { cn } from '@/lib/utils';
import type { PermissionDefinitionDto } from '../types/access-control.types';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

export function PermissionDefinitionMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  
  // HATA FIX: Hook parametre beklediği için sayfalama değerleri eklendi
  const { data: permissionsResponse, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'Name',
    sortDirection: 'asc'
  });

  const [searchTerm, setSearchTerm] = useState('');

  // HATA FIX: permissionsResponse.data üzerinden filtreleme yapıldı ve tip atandı
  const filteredPermissions = useMemo(() => {
    const items = permissionsResponse?.data || [];
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (p: PermissionDefinitionDto) =>
        p.name.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower)
    );
  }, [permissionsResponse, searchTerm]);

  const togglePermission = (id: number) => {
    if (disabled) return;
    const newValue = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newValue);
  };

  const toggleAll = () => {
    if (disabled) return;
    if (value.length === filteredPermissions.length && filteredPermissions.length > 0) {
      onChange([]);
    } else {
      onChange(filteredPermissions.map((p: PermissionDefinitionDto) => p.id));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] animate-in fade-in duration-500 bg-white dark:bg-blue-950/20">
      {/* Arama Alanı - Aqua Tasarım */}
      <div className="p-4 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/50 dark:bg-blue-900/10">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 rounded-xl h-10 focus-visible:ring-cyan-500/20 transition-all text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center justify-between mt-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={filteredPermissions.length > 0 && value.length === filteredPermissions.length}
              onCheckedChange={toggleAll}
              disabled={disabled || filteredPermissions.length === 0}
              className="border-slate-300 dark:border-cyan-800 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
              {t('permissionGroups.selectAll', { defaultValue: 'Tümünü Seç' })}
            </span>
          </label>
          <Badge variant="outline" className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800/50 rounded-md">
            {value.length} / {filteredPermissions.length}
          </Badge>
        </div>
      </div>

      {/* Yetki Listesi - HATA FIX: ScrollArea yerine custom-scrollbar kullanıldı */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[500px]">
        <div className="space-y-2">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 animate-pulse text-sm font-medium">
              {t('common.loading')}...
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-sm italic">
              {t('common.noData')}
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                <Globe className="w-3 h-3" /> {t('permissionGroups.moduleTitle', { defaultValue: 'AQUA MODÜLÜ' })}
              </p>
              {filteredPermissions.map((permission: PermissionDefinitionDto) => {
                const isSelected = value.includes(permission.id);
                return (
                  <div
                    key={permission.id}
                    onClick={() => togglePermission(permission.id)}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 shadow-sm"
                        : "bg-white dark:bg-blue-900/10 border-slate-100 dark:border-cyan-800/10 hover:border-cyan-200 dark:hover:border-cyan-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        isSelected 
                          ? "bg-cyan-600 border-cyan-600 text-white" 
                          : "bg-transparent border-slate-300 dark:border-cyan-800 group-hover:border-cyan-500"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shadow-sm" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-sm font-bold truncate transition-colors",
                          isSelected ? "text-cyan-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {permission.name}
                        </span>
                        <code className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {permission.code}
                        </code>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all opacity-0 group-hover:opacity-100",
                      isSelected ? "text-cyan-500 translate-x-1" : "text-slate-300"
                    )} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}