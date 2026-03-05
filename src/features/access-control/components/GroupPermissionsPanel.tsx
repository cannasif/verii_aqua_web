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
      <DialogContent className="bg-card dark:bg-[#130822] border-border dark:border-white/10 text-foreground dark:text-white max-w-2xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <DialogHeader className="px-6 py-5 border-b border-border dark:border-white/5 bg-muted/20 dark:bg-[#1a1025]/50">
          <DialogTitle className="text-slate-900 dark:text-white font-bold">
            {t('permissionGroups.permissionsPanel.title')}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
            {group?.name} - {t('permissionGroups.permissionsPanel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          {isSystemAdminGroup && (
            <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
              {t('permissionGroups.systemAdminLocked', 'System Admin grubu değiştirilemez')}
            </div>
          )}
          {group?.permissionCodes && group.permissionCodes.length > 0 && (
            <div className="mb-6 p-4 bg-muted/10 dark:bg-white/2 rounded-xl border border-border dark:border-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {t('permissionGroups.permissionsPanel.currentCodes')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.permissionCodes.map((code) => (
                  <Badge key={code} variant="secondary" className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-0 font-mono text-[10px] px-2 py-0.5">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 inline-flex items-center gap-2">
              {t('permissionGroups.form.permissions')}
              <FieldHelpTooltip text={t('help.permissionGroup.permissions')} />
            </p>
            <div className="rounded-xl border border-border dark:border-white/5 overflow-hidden bg-background/50 dark:bg-transparent">
              <PermissionDefinitionMultiSelect value={selectedIds} onChange={setSelectedIds} disabled={setPermissions.isPending || isSystemAdminGroup} />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-5 border-t border-border dark:border-white/5 bg-muted/20 dark:bg-[#1a1025]/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={setPermissions.isPending} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold">
            {t('common.cancel')}
          </Button>
          <span className="inline-flex items-center gap-2 ml-2">
            <FieldHelpTooltip text={t('help.permissionGroup.save')} side="top" />
            <Button 
              onClick={handleSave} 
              disabled={setPermissions.isPending || isSystemAdminGroup}
              className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-extrabold h-10 px-8 rounded-xl border-0 shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all"
            >
              {setPermissions.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}