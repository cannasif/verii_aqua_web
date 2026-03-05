import { type ReactElement, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Plus, Search, RefreshCw, X, Settings, Shield, Edit2, Trash2 } from 'lucide-react';
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
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';
import { useCreatePermissionGroupMutation } from '../hooks/useCreatePermissionGroupMutation';
import { useUpdatePermissionGroupMutation } from '../hooks/useUpdatePermissionGroupMutation';
import { useDeletePermissionGroupMutation } from '../hooks/useDeletePermissionGroupMutation';
import { PermissionGroupForm } from './PermissionGroupForm';
import { GroupPermissionsPanel } from './GroupPermissionsPanel';
import type { PermissionGroupDto } from '../types/access-control.types';
import type { CreatePermissionGroupSchema } from '../schemas/permission-group-schema';
import { cn } from '@/lib/utils';

const EMPTY_ITEMS: PermissionGroupDto[] = [];

export function PermissionGroupsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionGroupDto | null>(null);
  const [permissionsPanelOpen, setPermissionsPanelOpen] = useState(false);
  const [permissionsPanelGroupId, setPermissionsPanelGroupId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionGroupDto | null>(null);

  const { data, isLoading } = usePermissionGroupsQuery({
    pageNumber,
    pageSize,
    sortBy: 'updatedDate',
    sortDirection: 'desc',
  });

  const createMutation = useCreatePermissionGroupMutation();
  const updateMutation = useUpdatePermissionGroupMutation();
  const deleteMutation = useDeletePermissionGroupMutation();

  const items = data?.data ?? EMPTY_ITEMS;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [items, searchTerm]);

  useEffect(() => {
    setPageTitle(t('permissionGroups.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
  };

  const handleAddClick = (): void => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEditClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
    setEditingItem(item);
    setFormOpen(true);
  };

  const handlePermissionsClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
    setPermissionsPanelGroupId(item.id);
    setPermissionsPanelOpen(true);
  };

  const handleFormSubmit = async (formData: CreatePermissionGroupSchema): Promise<void> => {
    if (editingItem?.isSystemAdmin) return;
    if (editingItem) {
      const updateDto = {
        name: formData.name,
        description: formData.description ?? undefined,
        isSystemAdmin: editingItem.isSystemAdmin,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({ id: editingItem.id, dto: updateDto });
    } else {
      const createDto = { ...formData, isSystemAdmin: false, description: formData.description ?? undefined };
      await createMutation.mutateAsync(createDto);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
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
    <div className="w-full space-y-8 pb-10">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.permissionGroups'), isActive: true }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-500 border border-pink-200 dark:border-pink-500/20 shadow-lg shadow-pink-500/5 transition-colors">
            <Shield className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors leading-none">
              {t('permissionGroups.title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium transition-colors">
              {t('permissionGroups.description')}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all border-0 shrink-0"
        >
          <Plus size={18} className="mr-2" />
          {t('permissionGroups.add')}
        </Button>
      </div>

      <div className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-all duration-300">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-pink-600 dark:group-focus-within:text-pink-500 transition-colors" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-background dark:bg-[#0b0713] border-slate-200 dark:border-white/5 text-foreground dark:text-white focus-visible:ring-pink-500/20 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={14} className="text-slate-400 hover:text-slate-900 dark:hover:text-white" />
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-11 w-11 border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl shrink-0 transition-colors">
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all duration-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/2">
              <TableRow className="border-b border-slate-200 dark:border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider px-6 py-4">{t('permissionGroups.table.name')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4">{t('permissionGroups.table.isSystemAdmin')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4">{t('permissionGroups.table.isActive')}</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4">{t('permissionGroups.table.permissionCount')}</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider px-6 py-4">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 animate-pulse font-medium">{t('common.loading')}</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-500 dark:text-slate-400 font-medium">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 group transition-colors">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors px-6 py-4">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0 rounded-md text-[10px] font-bold uppercase tracking-tighter px-2", item.isSystemAdmin ? "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-500" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400")}>
                        {item.isSystemAdmin ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0 rounded-md text-[10px] font-bold uppercase tracking-tighter px-2", item.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-500" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-500")}>
                        {item.isActive ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{(item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0)}</span>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePermissionsClick(item)}
                          className="size-9 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          disabled={item.isSystemAdmin}
                        >
                          <Settings size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(item)}
                          className="size-9 text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-lg transition-colors"
                          disabled={item.isSystemAdmin}
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          onClick={() => handleDeleteClick(item)}
                          disabled={item.isSystemAdmin}
                        >
                          <Trash2 size={18} />
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
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-[#0b0713]/50 border-t border-slate-200 dark:border-white/5 transition-colors">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('permissionGroups.table.showing', {
                from: (pageNumber - 1) * pageSize + 1,
                to: Math.min(pageNumber * pageSize, totalCount),
                total: totalCount,
              })}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="h-8 px-4 border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-xs font-bold transition-colors">
                {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))} disabled={pageNumber >= totalPages} className="h-8 px-4 border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-xs font-bold transition-colors">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <PermissionGroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <GroupPermissionsPanel groupId={permissionsPanelGroupId} open={permissionsPanelOpen} onOpenChange={setPermissionsPanelOpen} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md transition-colors duration-300">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <Trash2 className="size-5 text-rose-600 dark:text-rose-500" />
              {t('permissionGroups.delete.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              {t('permissionGroups.delete.confirmMessage', {
                name: itemToDelete?.name ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending} className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-bold transition-colors">
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} className="bg-rose-600 hover:bg-rose-500 rounded-xl px-8 font-bold border-0 shadow-lg shadow-rose-500/20 text-white transition-all">
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}