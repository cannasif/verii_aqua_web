import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Combobox } from '@/components/ui/combobox';
import { useUserListForAssignments } from '../hooks/useUserListForAssignments';
import { useUserPermissionGroupsQuery } from '../hooks/useUserPermissionGroupsQuery';
import { useSetUserPermissionGroupsMutation } from '../hooks/useSetUserPermissionGroupsMutation';
import { PermissionGroupMultiSelect } from './PermissionGroupMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { UserCheck, ShieldPlus, Save, Loader2, Info } from 'lucide-react';

export function UserGroupAssignmentsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: usersResponse, isLoading: usersLoading } = useUserListForAssignments({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'Id',
    sortDirection: 'asc',
  });
  const users = usersResponse?.data ?? [];
  const { data: userGroups, isLoading: userGroupsLoading } = useUserPermissionGroupsQuery(selectedUserId);
  const setUserGroups = useSetUserPermissionGroupsMutation(selectedUserId ?? 0);

  useEffect(() => {
    setPageTitle(t('userGroupAssignments.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const serverGroupIdsKey = (userGroups?.permissionGroupIds ?? []).join(',');
  const parsedServerGroupIds = useMemo<number[]>(
    () => (serverGroupIdsKey ? serverGroupIdsKey.split(',').map((x) => parseInt(x, 10)) : []),
    [serverGroupIdsKey]
  );

  useEffect(() => {
    setSelectedGroupIds(parsedServerGroupIds.length > 0 ? [...parsedServerGroupIds] : []);
    setHasChanges(false);
  }, [parsedServerGroupIds]);

  const handleGroupIdsChange = (ids: number[]): void => {
    setSelectedGroupIds(ids);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    if (selectedUserId == null) return;
    await setUserGroups.mutateAsync({ permissionGroupIds: selectedGroupIds });
    setHasChanges(false);
  };

  const userOptions = users.map((u) => ({
    value: u.id.toString(),
    label: u.fullName || u.username || u.email || `User ${u.id}`,
  }));

  const labelStyle = "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 mb-3";

  return (
    <div className="w-full space-y-8 pb-10">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.userGroupAssignments'), isActive: true }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 transition-colors">
            <UserCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              {t('userGroupAssignments.title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium transition-colors">
              {t('userGroupAssignments.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl p-6 md:p-8 space-y-8 transition-all duration-300">
        
        {/* Kullanıcı Seçim Alanı */}
        <div className="max-w-md">
          <label className={labelStyle}>
            <UserCheck className="size-3.5 text-cyan-600 dark:text-cyan-400" />
            {t('userGroupAssignments.selectUser')}
            <FieldHelpTooltip text={t('help.userAssignment.user')} />
          </label>
          <Combobox
            options={userOptions}
            value={selectedUserId?.toString() ?? ''}
            onValueChange={(v) => setSelectedUserId(v ? parseInt(v, 10) : null)}
            placeholder={t('userGroupAssignments.selectUserPlaceholder')}
            searchPlaceholder={t('common.search')}
            emptyText={t('userGroupAssignments.noUsers')}
            disabled={usersLoading}
            className="h-11 bg-slate-50 dark:bg-blue-900/20 border-slate-200 dark:border-cyan-800/30 rounded-xl"
          />
        </div>

        {/* Grup Atama Alanı */}
        {selectedUserId != null && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-6">
            <div className="h-px bg-slate-100 dark:bg-cyan-800/20 w-full" />
            
            <div>
              <label className={labelStyle}>
                <ShieldPlus className="size-3.5 text-blue-600 dark:text-blue-400" />
                {t('userGroupAssignments.assignedGroups')}
                <FieldHelpTooltip text={t('help.userAssignment.groups')} />
              </label>
              
              {userGroupsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-blue-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30">
                  <Loader2 className="size-8 animate-spin text-cyan-500 mb-2" />
                  <span className="text-sm font-medium">{t('common.loading')}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 overflow-hidden bg-slate-50/30 dark:bg-transparent shadow-sm">
                    <PermissionGroupMultiSelect
                      value={selectedGroupIds}
                      onChange={handleGroupIdsChange}
                      disabled={setUserGroups.isPending}
                    />
                  </div>

                  {/* Sistem Admin Notu */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <Info className="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                      {t('help.userAssignment.systemAdminNote')}
                    </p>
                  </div>

                  {/* Kaydet Butonu - Sadece Değişiklik Varsa */}
                  {hasChanges && (
                    <div className="flex justify-end items-center gap-3 pt-4 animate-in zoom-in-95 duration-300">
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest italic">
                        {t('userGroupAssignments.unsavedChanges')}
                      </span>
                      <div className="flex items-center gap-2">
                        <FieldHelpTooltip text={t('help.userAssignment.save')} side="top" />
                        <Button 
                          onClick={handleSave} 
                          disabled={setUserGroups.isPending}
                          className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold h-11 px-10 rounded-xl border-0 shadow-lg shadow-cyan-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                          {setUserGroups.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                          {setUserGroups.isPending ? t('common.saving') : t('common.save')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kullanıcı Seçilmediğinde Gösterilen Placeholder */}
        {!selectedUserId && !usersLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-blue-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30">
            <div className="p-4 bg-white dark:bg-blue-950 rounded-full shadow-sm">
              <UserCheck className="size-10 text-slate-300 dark:text-cyan-900/50" />
            </div>
            <div className="max-w-xs">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                {t('userGroupAssignments.selectUserHint')}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                {t('help.userAssignment.user')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
