import { type ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Loader2, User, Mail, Lock, Shield, Power } from 'lucide-react';
import { userFormSchema, userUpdateFormSchema } from '../types/user-types';
import { useUserAuthorityOptionsQuery } from '../hooks/useUserAuthorityOptionsQuery';
import { useUserPermissionGroupsForForm } from '../hooks/useUserPermissionGroupsForForm';
import { UserFormPermissionGroupSelect } from './UserFormPermissionGroupSelect';

export function UserForm({ open, onOpenChange, onSubmit, user, isLoading }: any): ReactElement {
  const isEditMode = !!user;
  const roleOptionsQuery = useUserAuthorityOptionsQuery();
  const permissionGroups = useUserPermissionGroupsForForm(user?.id ?? null);

  const form = useForm({
    resolver: zodResolver(isEditMode ? userUpdateFormSchema : userFormSchema),
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

  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";
  const labelStyle = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col transition-colors duration-300">
        
        <DialogHeader className="p-5 sm:p-6 md:p-8 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/10 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Kullanıcı bilgilerini ve yetkilerini buradan yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 sm:p-6 md:p-8 space-y-5 overflow-y-auto min-h-0 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><User className="size-3 text-cyan-600 dark:text-cyan-400" /> Kullanıcı Adı</FormLabel>
                  <FormControl><Input {...field} className={inputStyle} disabled={isEditMode} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
              <FormField name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Mail className="size-3 text-cyan-600 dark:text-cyan-400" /> E-Posta</FormLabel>
                  <FormControl><Input {...field} type="email" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
            </div>

            {!isEditMode && (
              <FormField name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Lock className="size-3 text-cyan-600 dark:text-cyan-400" /> Şifre</FormLabel>
                  <FormControl><Input {...field} type="password" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="roleId" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Shield className="size-3 text-cyan-600 dark:text-cyan-400" /> Rol</FormLabel>
                  <Combobox 
                    options={(roleOptionsQuery.data || []).map(o => ({ value: String(o.value), label: o.label }))}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    className={inputStyle}
                  />
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )} />
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50 dark:bg-blue-900/10 self-end h-11 transition-colors">
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer">
                  <Power className="size-3.5 text-emerald-600 dark:text-emerald-500" /> Aktif mi?
                </FormLabel>
                <Switch 
                  checked={form.watch('isActive')} 
                  onCheckedChange={(v) => form.setValue('isActive', v)} 
                  className="data-[state=checked]:bg-cyan-600" 
                />
              </FormItem>
            </div>

            <FormField name="permissionGroupIds" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={labelStyle}>Yetki Grupları</FormLabel>
                <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-1 bg-slate-50 dark:bg-transparent">
                  <UserFormPermissionGroupSelect value={field.value} onChange={field.onChange} />
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
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold h-11 px-10 rounded-xl border-0 shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}