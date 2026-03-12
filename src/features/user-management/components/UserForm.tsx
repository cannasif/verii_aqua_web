import { type ReactElement, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Loader2, User, Mail, Lock, Shield, Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userFormSchema, userUpdateFormSchema } from '../types/user-types';
import { useUserAuthorityOptionsQuery } from '../hooks/useUserAuthorityOptionsQuery';
import { useUserPermissionGroupsForForm } from '../hooks/useUserPermissionGroupsForForm';
import { UserFormPermissionGroupSelect } from './UserFormPermissionGroupSelect';
import { usePermissionGroupOptionsQuery } from '../hooks/usePermissionGroupOptionsQuery';

export function UserForm({ open, onOpenChange, onSubmit, user, isLoading }: any): ReactElement {
  const { t } = useTranslation('common');
  const isEditMode = !!user;
  const roleOptionsQuery = useUserAuthorityOptionsQuery();
  const permissionGroups = useUserPermissionGroupsForForm(user?.id ?? null);
  const permissionGroupOptionsQuery = usePermissionGroupOptionsQuery();

  const form = useForm({
    resolver: zodResolver(isEditMode ? userUpdateFormSchema : userFormSchema),
    mode: 'onChange',
    defaultValues: { username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', roleId: 0, isActive: true, permissionGroupIds: [] },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          ...user,
          password: '',
          roleId: user.roleId || 0,
          permissionGroupIds: permissionGroups.data || []
        });
      } else {
        form.reset({ username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', roleId: 0, isActive: true, permissionGroupIds: [] });
      }
    }
  }, [open, user, permissionGroups.data]);

  const roleOptions = roleOptionsQuery.data || [];
  const permissionGroupOptions = permissionGroupOptionsQuery.data || [];

  const adminRoleId = useMemo(
    () => roleOptions.find((option) => option.label.trim().toLowerCase() === 'admin')?.value ?? null,
    [roleOptions]
  );
  const userRoleId = useMemo(
    () => roleOptions.find((option) => option.label.trim().toLowerCase() === 'user')?.value ?? null,
    [roleOptions]
  );
  const systemAdminGroupIds = useMemo(
    () => permissionGroupOptions.filter((option) => option.isSystemAdmin).map((option) => option.value),
    [permissionGroupOptions]
  );

  const selectedRoleId = form.watch('roleId');
  const selectedPermissionGroupIds = form.watch('permissionGroupIds') ?? [];
  const isAdminRole = adminRoleId !== null && selectedRoleId === adminRoleId;
  const isSubmitDisabled = isLoading || !form.formState.isValid;

  useEffect(() => {
    if (!adminRoleId || systemAdminGroupIds.length === 0) {
      return;
    }

    const selectedGroupIds = form.getValues('permissionGroupIds') ?? [];
    const hasSystemAdminGroup = systemAdminGroupIds.some((groupId) => selectedGroupIds.includes(groupId));

    if (selectedRoleId === adminRoleId && !hasSystemAdminGroup) {
      form.setValue(
        'permissionGroupIds',
        Array.from(new Set([...selectedGroupIds, ...systemAdminGroupIds])),
        { shouldDirty: true, shouldValidate: true }
      );
      return;
    }

    if (userRoleId !== null && selectedRoleId === userRoleId && hasSystemAdminGroup) {
      form.setValue(
        'permissionGroupIds',
        selectedGroupIds.filter((groupId) => !systemAdminGroupIds.includes(groupId)),
        { shouldDirty: true, shouldValidate: true }
      );
    }
  }, [adminRoleId, form, selectedRoleId, systemAdminGroupIds, userRoleId]);

  const handlePermissionGroupsChange = (ids: number[]): void => {
    if (!adminRoleId || systemAdminGroupIds.length === 0) {
      form.setValue('permissionGroupIds', ids, { shouldDirty: true, shouldValidate: true });
      return;
    }

    const hasSystemAdminGroup = systemAdminGroupIds.some((groupId) => ids.includes(groupId));

    if (hasSystemAdminGroup) {
      form.setValue('roleId', adminRoleId, { shouldDirty: true, shouldValidate: true });
      form.setValue(
        'permissionGroupIds',
        Array.from(new Set([...ids, ...systemAdminGroupIds])),
        { shouldDirty: true, shouldValidate: true }
      );
      return;
    }

    form.setValue('permissionGroupIds', ids, { shouldDirty: true, shouldValidate: true });
  };

  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";
  const labelStyle = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col transition-colors duration-300">
        
        <DialogHeader className="p-5 sm:p-6 md:p-8 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/10 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode
              ? t('userManagement.form.editUser')
              : t('userManagement.form.addUser')}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
            {isEditMode
              ? t('userManagement.form.editDescription')
              : t('userManagement.form.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 md:p-8 space-y-5 overflow-y-auto min-h-0 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel required className={labelStyle}><User className="size-3 text-cyan-600 dark:text-cyan-400" /> {t('userManagement.form.username')}</FormLabel>
                  <FormControl><Input {...field} className={inputStyle} disabled={isEditMode} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
              <FormField name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel required className={labelStyle}><Mail className="size-3 text-cyan-600 dark:text-cyan-400" /> {t('userManagement.form.email')}</FormLabel>
                  <FormControl><Input {...field} type="email" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
            </div>

            {!isEditMode && (
              <FormField name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel required className={labelStyle}><Lock className="size-3 text-cyan-600 dark:text-cyan-400" /> {t('userManagement.form.password')}</FormLabel>
                  <FormControl><Input {...field} type="password" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="roleId" render={({ field }) => (
                <FormItem>
                  <FormLabel required className={labelStyle}><Shield className="size-3 text-cyan-600 dark:text-cyan-400" /> {t('userManagement.form.role')}</FormLabel>
                  <Combobox 
                    options={roleOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    className={inputStyle}
                  />
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50 dark:bg-blue-900/10 self-end h-11 transition-colors">
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer">
                  <Power className="size-3.5 text-emerald-600 dark:text-emerald-500" /> {t('userManagement.form.isActive')}
                </FormLabel>
                <Switch 
                  checked={form.watch('isActive')} 
                  onCheckedChange={(v) => form.setValue('isActive', v)} 
                  className="data-[state=checked]:bg-cyan-600" 
                />
              </FormItem>
            </div>

            <FormField name="permissionGroupIds" render={() => (
              <FormItem className="space-y-3">
                <FormLabel className={labelStyle}>{t('userManagement.form.permissionGroups')}</FormLabel>
                <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-1 bg-slate-50 dark:bg-transparent">
                  <UserFormPermissionGroupSelect
                    value={selectedPermissionGroupIds}
                    onChange={handlePermissionGroupsChange}
                    isAdminRole={isAdminRole}
                  />
                </div>
              </FormItem>
            )} />

            <DialogFooter className="pt-6 border-t border-slate-100 dark:border-cyan-800/30 sticky bottom-0 bg-white dark:bg-blue-950 transition-colors">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)} 
                className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-bold rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitDisabled}
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold h-11 px-10 rounded-xl border-0 shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
