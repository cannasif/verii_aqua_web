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
  selectedProjectId: number | null;
  onCreateProject: (data: ProjectFormSchema) => Promise<void>;
  onSelectProject: (projectId: number) => void;
  isCreating: boolean;
}

export function ProjectStepCard({
  projects,
  isLoadingProjects,
  selectedProjectId,
  onCreateProject,
  onSelectProject,
  isCreating,
}: ProjectStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema) as Resolver<ProjectFormSchema>,
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
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickSetup.step1Title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">{t('aqua.quickSetup.code')}</FormLabel>
                  <FormControl>
                    <Input className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">{t('aqua.quickSetup.name')}</FormLabel>
                  <FormControl>
                    <Input className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">{t('aqua.quickSetup.startDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCreating} className="w-full bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 rounded-xl shadow-lg shadow-pink-500/20">
              {t('aqua.quickSetup.createProject')}
            </Button>
          </form>
        </Form>
        
        <div className="relative flex items-center py-2">
           <div className="grow border-t border-white/10"></div>
           <span className="shrink-0 mx-4 text-sm text-slate-500">{t('aqua.quickSetup.orSelectExisting')}</span>
           <div className="grow border-t border-white/10"></div>
        </div>

        <Combobox
          options={projectOptions}
          value={selectedProjectId != null ? String(selectedProjectId) : ''}
          onValueChange={(v) => { if (v) onSelectProject(Number(v)); }}
          placeholder={t('aqua.quickSetup.selectProject')}
          searchPlaceholder={t('common.search')}
          emptyText={t('common.noResults')}
          disabled={isLoadingProjects}
          className="w-full bg-[#0b0713] border-white/10 text-white"
        />
      </CardContent>
    </Card>
  );
}
