import { type ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { PermissionDefinitionMultiSelect } from './PermissionDefinitionMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { createPermissionGroupSchema, type CreatePermissionGroupSchema } from '../schemas/permission-group-schema';
import type { PermissionGroupDto } from '../types/access-control.types';
import { isZodFieldRequired } from '@/lib/zod-required';
import { Shield, Power, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePermissionGroupSchema) => void | Promise<void>;
  item?: PermissionGroupDto | null;
  isLoading?: boolean;
}

export function PermissionGroupForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
}: PermissionGroupFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreatePermissionGroupSchema>({
    resolver: zodResolver(createPermissionGroupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      isSystemAdmin: false,
      isActive: true,
      permissionDefinitionIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          description: item.description ?? '',
          isSystemAdmin: item.isSystemAdmin,
          isActive: item.isActive,
          permissionDefinitionIds: item.permissionDefinitionIds ?? [],
        });
      } else {
        form.reset({
          name: '',
          description: '',
          isSystemAdmin: false,
          isActive: true,
          permissionDefinitionIds: [],
        });
      }
    }
  }, [item, form, open]);

  const handleSubmit = async (data: CreatePermissionGroupSchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset();
      onOpenChange(false);
    }
  };

  const labelStyle = "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 transition-colors";
  const inputStyle = "bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 rounded-xl transition-all duration-300 h-11";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white max-w-2xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <DialogHeader className="px-8 py-6 border-b border-border dark:border-white/5 bg-muted/20 dark:bg-white/2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-200 dark:border-pink-500/20">
              <Shield className="w-5 h-5 text-pink-600 dark:text-pink-500" />
            </div>
            {item ? t('permissionGroups.form.editTitle') : t('permissionGroups.form.addTitle')}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {item ? t('permissionGroups.form.editDescription') : t('permissionGroups.form.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Form {...form}>
            <form id="permission-group-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle} required={isZodFieldRequired(createPermissionGroupSchema, 'name')}>
                      {t('permissionGroups.form.name')}
                      <FieldHelpTooltip text={t('help.permissionGroup.name')} />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={inputStyle} placeholder={t('permissionGroups.form.namePlaceholder')} maxLength={100} />
                    </FormControl>
                    <FormMessage className="text-[10px] text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>
                      {t('permissionGroups.form.description')}
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} className={cn(inputStyle, "min-h-[100px] resize-none py-3")} placeholder={t('permissionGroups.form.descriptionPlaceholder')} maxLength={500} />
                    </FormControl>
                    <FormMessage className="text-[10px] text-rose-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border dark:border-white/5 p-4 bg-muted/10 dark:bg-white/2 hover:bg-muted/20 dark:hover:bg-white/4 transition-colors">
                      <FormLabel className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <Power className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-500" />
                        {t('permissionGroups.form.isActive')}
                        <FieldHelpTooltip text={t('help.permissionGroup.isActive')} />
                      </FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-pink-600 scale-90" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="permissionDefinitionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>
                      {t('permissionGroups.form.permissions')}
                      <FieldHelpTooltip text={t('help.permissionGroup.permissions')} />
                    </FormLabel>
                    <FormControl>
                      <div className="bg-muted/5 dark:bg-white/1 rounded-xl border border-border dark:border-white/5 overflow-hidden">
                        <PermissionDefinitionMultiSelect value={field.value} onChange={field.onChange} disabled={isLoading} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] text-rose-500" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="px-8 py-6 border-t border-border dark:border-white/5 bg-muted/20 dark:bg-white/2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 px-6 font-bold transition-colors">
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="permission-group-form" 
            disabled={isLoading || !form.formState.isValid}
            className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-extrabold h-11 px-10 rounded-xl border-0 shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}