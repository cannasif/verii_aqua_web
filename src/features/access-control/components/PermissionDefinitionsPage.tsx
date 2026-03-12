import { type ReactElement, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Plus, Search, RefreshCw, X, ShieldAlert, Edit2, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { useSyncPermissionDefinitionsMutation } from '../hooks/useSyncPermissionDefinitionsMutation';
import { useCreatePermissionDefinitionMutation } from '../hooks/useCreatePermissionDefinitionMutation';
import { useUpdatePermissionDefinitionMutation } from '../hooks/useUpdatePermissionDefinitionMutation';
import { useDeletePermissionDefinitionMutation } from '../hooks/useDeletePermissionDefinitionMutation';
import { PermissionDefinitionForm } from './PermissionDefinitionForm';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import type { CreatePermissionDefinitionSchema } from '../schemas/permission-definition-schema';
import { getPermissionDisplayMeta, PERMISSION_CODE_CATALOG } from '../utils/permission-config';
import { cn } from '@/lib/utils';

const EMPTY_PERMISSION_DEFINITIONS: PermissionDefinitionDto[] = [];

export function PermissionDefinitionsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const getPermissionTitle = (key: string, fallback: string): string =>
    t(key, { ns: 'common', defaultValue: fallback });
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionDefinitionDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionDefinitionDto | null>(null);

  const { data, isLoading } = usePermissionDefinitionsQuery({
    pageNumber,
    pageSize,
    sortBy: 'updatedDate',
    sortDirection: 'desc',
  });

  const createMutation = useCreatePermissionDefinitionMutation();
  const updateMutation = useUpdatePermissionDefinitionMutation();
  const deleteMutation = useDeletePermissionDefinitionMutation();
  const syncMutation = useSyncPermissionDefinitionsMutation();

  const items = data?.data ?? EMPTY_PERMISSION_DEFINITIONS;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    setPageTitle(t('permissionDefinitions.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((item) => {
      const meta = getPermissionDisplayMeta(item.code);
      const displayName = meta ? getPermissionTitle(meta.key, meta.fallback) : item.name;
      return (
        item.code.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower) ||
        displayName.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
      );
    });
  }, [items, searchTerm, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
  };

  const handleSyncFromRoutes = async (): Promise<void> => {
    const itemsToSync = PERMISSION_CODE_CATALOG.map((code) => {
      const meta = getPermissionDisplayMeta(code);
      const name = meta ? getPermissionTitle(meta.key, meta.fallback) : code;
      return { code, name, isActive: true };
    });
    await syncMutation.mutateAsync({ items: itemsToSync });
  };

  const handleAddClick = (): void => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEditClick = (item: PermissionDefinitionDto): void => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (formData: CreatePermissionDefinitionSchema): Promise<void> => {
    const dto = {
      ...formData,
      isActive: editingItem?.isActive ?? true,
      description: formData.description ?? undefined,
    };
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteClick = (item: PermissionDefinitionDto): void => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: t('sidebar.accessControl', { ns: 'common' }) }, { label: t('sidebar.permissionDefinitions', { ns: 'common' }), isActive: true }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            <ShieldAlert className="size-6 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {t('permissionDefinitions.title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              {t('permissionDefinitions.description')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSyncFromRoutes}
            disabled={isLoading || syncMutation.isPending}
            className="h-11 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-cyan-800/40 rounded-xl transition-all font-bold"
          >
            <RefreshCw size={16} className={cn("mr-2", syncMutation.isPending && "animate-spin")} />
            {t('permissionDefinitions.syncFromRoutes')}
          </Button>
          <Button 
            onClick={handleAddClick}
            className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all border-0"
          >
            <Plus size={18} className="mr-2" />
            {t('permissionDefinitions.add')}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-950/40 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-50 dark:bg-blue-900/20 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-blue-800/50 rounded-full transition-colors"
            >
              <X size={14} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" />
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-11 w-11 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/30 rounded-xl shrink-0 transition-colors">
          <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-blue-900/30">
              <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest py-4 px-6">{t('permissionDefinitions.table.code')}</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest py-4">{t('permissionDefinitions.table.name')}</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest py-4">{t('permissionDefinitions.table.isActive')}</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest py-4">{t('permissionDefinitions.table.updatedDate')}</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest py-4 px-6">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-500 animate-pulse font-medium">{t('common.loading')}</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-100 dark:border-cyan-800/10 hover:bg-slate-50 dark:hover:bg-blue-900/20 group transition-colors">
                    <TableCell className="px-6">
                      <code className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-slate-200 dark:border-cyan-800/30 px-2 py-1 rounded-md">
                        {item.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {(() => {
                            const meta = getPermissionDisplayMeta(item.code);
                            return meta ? getPermissionTitle(meta.key, meta.fallback) : item.name;
                          })()}
                        </span>
                        {(() => {
                          const meta = getPermissionDisplayMeta(item.code);
                          const displayName = meta ? getPermissionTitle(meta.key, meta.fallback) : item.name;
                          if (!meta || item.name.trim().toLowerCase() === displayName.trim().toLowerCase()) return null;
                          return <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{item.name}</span>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border border-transparent rounded-md text-[10px] font-bold uppercase tracking-tighter px-2.5 py-0.5", item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20")}>
                        {item.isActive ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs tabular-nums font-medium">
                      {item.updatedDate ? new Date(item.updatedDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="size-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-500 dark:hover:bg-rose-500/10 rounded-lg transition-colors" onClick={() => handleDeleteClick(item)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-blue-950/40 border-t border-slate-200 dark:border-cyan-800/30 gap-4 transition-colors">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              {t('permissionDefinitions.table.showing', {
                from: (pageNumber - 1) * pageSize + 1,
                to: Math.min(pageNumber * pageSize, totalCount),
                total: totalCount,
              })}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))} disabled={pageNumber >= totalPages} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <PermissionDefinitionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        usedCodes={items.map((x) => x.code)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 sm:p-8 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <Trash2 className="size-5 text-rose-600 dark:text-rose-500" />
              </div>
              {t('permissionDefinitions.delete.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium">
              {t('permissionDefinitions.delete.confirmMessage', {
                name: itemToDelete?.name ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending} className="border-slate-200 dark:border-cyan-800/30 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/30 font-bold rounded-xl h-11 px-6">
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-11 px-8 font-bold border-0 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
