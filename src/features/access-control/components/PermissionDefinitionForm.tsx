import { type ReactElement, useEffect, useMemo } from 'react';
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  createPermissionDefinitionSchema,
  type CreatePermissionDefinitionSchema,
} from '../schemas/permission-definition-schema';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { PERMISSION_CODE_CATALOG, getRoutesForPermissionCode, getPermissionDisplayMeta } from '../utils/permission-config';
import { Badge } from '@/components/ui/badge';
import { isZodFieldRequired } from '@/lib/zod-required';
import { ShieldAlert, Code, FileText, Save, X, Loader2, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePermissionDefinitionSchema) => void | Promise<void>;
  item?: PermissionDefinitionDto | null;
  isLoading?: boolean;
  usedCodes?: string[];
}

export function PermissionDefinitionForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
  usedCodes = [],
}: PermissionDefinitionFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreatePermissionDefinitionSchema>({
    resolver: zodResolver(createPermissionDefinitionSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isActive: true,
    },
  });

  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          code: item.code,
          name: item.name,
          description: item.description ?? '',
          isActive: item.isActive,
        });
      } else {
        form.reset({
          code: '',
          name: '',
          description: '',
          isActive: true,
        });
      }
    }
  }, [item, form, open]);

  const permissionCodeOptions: ComboboxOption[] = useMemo(() => {
    const usedSet = new Set(usedCodes.map((code) => code.toLowerCase()));
    const currentCode = item?.code?.toLowerCase();

    return PERMISSION_CODE_CATALOG.filter((code) => {
      const lowerCode = code.toLowerCase();
      if (currentCode && lowerCode === currentCode) return true;
      return !usedSet.has(lowerCode);
    }).map((code) => {
      const meta = getPermissionDisplayMeta(code);
      const title = meta ? t(meta.key, meta.fallback) : code;
      return { value: code, label: `${title} (${code})` };
    });
  }, [t, usedCodes, item?.code]);

  const handleSubmit = async (data: CreatePermissionDefinitionSchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset();
      onOpenChange(false);
    }
  };

  const labelStyle = "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/40 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 rounded-xl transition-all duration-300 h-11";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white max-w-2xl w-[95vw] sm:w-full shadow-2xl rounded-4xl p-0 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <DialogHeader className="px-8 py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            {item ? t('permissionDefinitions.form.editTitle') : t('permissionDefinitions.form.addTitle')}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {item ? t('permissionDefinitions.form.editDescription') : t('permissionDefinitions.form.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <Form {...form}>
            <form id="permission-definition-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle} required={isZodFieldRequired(createPermissionDefinitionSchema, 'code')}>
                      <Code className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> {t('permissionDefinitions.form.code')}
                      <FieldHelpTooltip text={t('help.permissionDefinition.code')} />
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={permissionCodeOptions}
                        value={field.value}
                        modal
                        onValueChange={(value) => {
                          field.onChange(value);
                          const meta = getPermissionDisplayMeta(value);
                          const title = meta ? t(meta.key, meta.fallback) : '';
                          if (!form.getValues('name') && title) {
                            form.setValue('name', title, { shouldDirty: true });
                          }
                        }}
                        placeholder={t('permissionDefinitions.form.codePlaceholder')}
                        searchPlaceholder={t('permissionDefinitions.form.codeSearchPlaceholder')}
                        emptyText={t('permissionDefinitions.form.codeEmpty')}
                        className={inputStyle}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] text-rose-500" />
                    
                    {/* Etkilenen Rotalar (Routes) */}
                    {field.value && (
                      <div className="mt-3 p-4 bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 rounded-xl transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                          <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {t('permissionDefinitions.form.affectedRoutes')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getRoutesForPermissionCode(field.value).length === 0 ? (
                            <span className="text-xs text-slate-500 dark:text-slate-500/70 font-medium italic">
                              {t('permissionDefinitions.form.affectedRoutesNone')}
                            </span>
                          ) : (
                            getRoutesForPermissionCode(field.value).map((route) => (
                              <Badge key={route} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 font-mono text-[10px] hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                {route}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle} required={isZodFieldRequired(createPermissionDefinitionSchema, 'name')}>
                      {t('permissionDefinitions.form.name')}
                      <FieldHelpTooltip text={t('help.permissionDefinition.name')} />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={inputStyle} placeholder={t('permissionDefinitions.form.namePlaceholder')} maxLength={150} />
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
                      <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> {t('permissionDefinitions.form.description')}
                      <FieldHelpTooltip text={t('help.permissionDefinition.description')} />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} className={cn(inputStyle, "min-h-[100px] resize-none py-3")} placeholder={t('permissionDefinitions.form.descriptionPlaceholder')} maxLength={500} />
                    </FormControl>
                    <FormMessage className="text-[10px] text-rose-500" />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-5 sm:px-8 sm:py-6 border-t border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 shrink-0 gap-3 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading} 
            className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-100 dark:hover:bg-blue-900/30 px-6 font-bold rounded-xl h-11 transition-all"
          >
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="permission-definition-form" 
            disabled={isLoading || !isFormValid}
            className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl border-0 shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}