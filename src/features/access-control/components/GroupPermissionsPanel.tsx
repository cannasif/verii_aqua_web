import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermissionGroupQuery } from '../hooks/usePermissionGroupQuery';
import { useSetPermissionGroupPermissionsMutation } from '../hooks/useSetPermissionGroupPermissionsMutation';
import { PermissionDefinitionMultiSelect } from './PermissionDefinitionMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { ShieldCheck, Save, Loader2, Info } from 'lucide-react';

interface GroupPermissionsPanelProps {
  groupId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_IDS: number[] = [];

export function GroupPermissionsPanel({
  groupId,
  open,
  onOpenChange,
}: GroupPermissionsPanelProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data: group } = usePermissionGroupQuery(groupId);
  const setPermissions = useSetPermissionGroupPermissionsMutation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const isSystemAdminGroup = group?.isSystemAdmin === true;

  const serverIds = useMemo(() => group?.permissionDefinitionIds ?? EMPTY_IDS, [group?.permissionDefinitionIds]);

  useEffect(() => {
    setSelectedIds(serverIds.length > 0 ? [...serverIds] : []);
  }, [open, serverIds]);

  const handleSave = async (): Promise<void> => {
    if (groupId == null) return;
    await setPermissions.mutateAsync({ id: groupId, dto: { permissionDefinitionIds: selectedIds } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white max-w-2xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <DialogHeader className="px-8 py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/50 dark:bg-blue-900/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            {t('permissionGroups.permissionsPanel.title')}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{group?.name}</span> - {t('permissionGroups.permissionsPanel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isSystemAdminGroup && (
            <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-3">
              <Info className="w-5 h-5 shrink-0" />
              {t('permissionGroups.systemAdminLocked', 'System Admin grubu yetkileri kilitlidir ve değiştirilemez.')}
            </div>
          )}
          
          {group?.permissionCodes && group.permissionCodes.length > 0 && (
            <div className="mb-8 p-5 bg-slate-50/50 dark:bg-blue-900/10 rounded-2xl border border-slate-100 dark:border-cyan-800/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <Info className="w-3 h-3" />
                {t('permissionGroups.permissionsPanel.currentCodes')}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.permissionCodes.map((code) => (
                  <Badge key={code} variant="secondary" className="bg-white dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-cyan-800/30 font-mono text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 inline-flex items-center gap-2">
              {t('permissionGroups.form.permissions')}
              <FieldHelpTooltip text={t('help.permissionGroup.permissions')} />
            </p>
            <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 overflow-hidden bg-slate-50 dark:bg-blue-950/40 shadow-sm">
              <PermissionDefinitionMultiSelect value={selectedIds} onChange={setSelectedIds} disabled={setPermissions.isPending || isSystemAdminGroup} />
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 border-t border-slate-100 dark:border-cyan-800/20 bg-slate-50/50 dark:bg-blue-900/10">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={setPermissions.isPending} className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-bold rounded-xl transition-colors">
            {t('common.cancel')}
          </Button>
          <div className="inline-flex items-center gap-2 ml-2">
            <FieldHelpTooltip text={t('help.permissionGroup.save')} side="top" />
            <Button 
              onClick={handleSave} 
              disabled={setPermissions.isPending || isSystemAdminGroup}
              className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold h-11 px-10 rounded-xl border-0 shadow-lg shadow-cyan-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2"
            >
              {setPermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {setPermissions.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}