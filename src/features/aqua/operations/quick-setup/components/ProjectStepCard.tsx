import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { projectFormSchema, type ProjectFormSchema } from '../schema/quick-setup-schema';
import type { ProjectDto } from '../types/quick-setup-types';

interface ProjectStepCardProps {
  projects: ProjectDto[] | undefined;
  isLoadingProjects: boolean;
  onCreateProject: (data: ProjectFormSchema) => Promise<void>;
  onSelectProject: (projectId: number) => void;
  isCreating: boolean;
  selectedProjectId: number | null;
}

export function ProjectStepCard({
  projects,
  isLoadingProjects,
  onCreateProject,
  onSelectProject,
  isCreating,
  selectedProjectId,
}: ProjectStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema) as Resolver<ProjectFormSchema>,
    mode: 'onChange',
    defaultValues: {
      projectCode: '',
      projectName: '',
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const handleSubmit: SubmitHandler<ProjectFormSchema> = async (data) => {
    await onCreateProject(data);
    form.reset();
  };

  const projectOptions = useMemo(
    () =>
      (Array.isArray(projects) ? projects : []).map((p) => ({
        value: String(p.id),
        label: `${p.projectCode ?? ''} - ${p.projectName ?? ''}`,
      })),
    [projects]
  );

  return (
    // Mor zemin `#1a1025` silindi, yerine Deep Blue teması (`blue-950`) eklendi
    <Card className="bg-card dark:bg-blue-950/60 dark:backdrop-blur-xl border border-border dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-cyan-800/30 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {/* Pembe İkonlar Korundu */}
          <div className="h-8 w-8 rounded-lg bg-pink-100 border border-pink-200 dark:bg-pink-500/20 flex items-center justify-center dark:border-pink-500/30">
            <span className="text-pink-600 dark:text-pink-400 text-sm font-black">1</span>
          </div>
          {t('aqua.quickSetup.step1Title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="projectCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.code')}</FormLabel>
                    <FormControl>
                      {/* Mor zemin `#0b0713` silindi */}
                      <Input className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.name')}</FormLabel>
                    <FormControl>
                      <Input className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl placeholder:text-slate-500" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('aqua.quickSetup.startDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl dark:[&::-webkit-calendar-picker-indicator]:invert" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500 dark:text-rose-400" />
                </FormItem>
              )}
            />
            {/* Butondaki pembe-turuncu gradyanı koruduk */}
            <Button type="submit" disabled={isCreating || !form.formState.isValid} className="w-full sm:w-auto px-8 bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold hover:opacity-95 border-0 h-11 rounded-xl shadow-lg shadow-pink-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {t('aqua.quickSetup.createProject')}
            </Button>
          </form>
        </Form>
        
        <div className="relative flex items-center py-2">
           <div className="grow border-t border-border dark:border-cyan-800/30"></div>
           {/* Mor zemin `#1a1025` silindi, buradaki bg-card Deep Blue slate temasından gelir */}
           <span className="shrink-0 mx-4 text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 bg-card dark:bg-blue-950 rounded">{t('aqua.quickSetup.orSelectExisting')}</span>
           <div className="grow border-t border-border dark:border-cyan-800/30"></div>
        </div>

        <div className="w-full max-w-md">
            <Combobox
              options={projectOptions}
              value={selectedProjectId?.toString() || ""}
              onValueChange={(v) => { if (v) onSelectProject(Number(v)); }}
              placeholder={t('aqua.quickSetup.selectProject')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noResults')}
              disabled={isLoadingProjects}
              className="w-full bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground h-11 rounded-xl"
            />
        </div>
      </CardContent>
    </Card>
  );
}
