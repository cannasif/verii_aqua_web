import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { MailSettingsForm } from '../components/MailSettingsForm';
import { useSmtpSettingsQuery } from '../hooks/useSmtpSettingsQuery';
import { useUpdateSmtpSettingsMutation } from '../hooks/useUpdateSmtpSettingsMutation';
import { Mail } from 'lucide-react';
import type { SmtpSettingsFormSchema } from '../types/smtpSettings';

export function MailSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const { data, isLoading } = useSmtpSettingsQuery();
  const updateMutation = useUpdateSmtpSettingsMutation();

  useEffect(() => {
    setPageTitle(t('mailSettings.PageTitle'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const handleSubmit = async (values: SmtpSettingsFormSchema): Promise<void> => {
    await updateMutation.mutateAsync({
      host: values.host,
      port: values.port,
      enableSsl: values.enableSsl,
      username: values.username,
      ...(values.password ? { password: values.password } : {}),
      fromEmail: values.fromEmail,
      fromName: values.fromName,
      timeout: values.timeout,
    });
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-10 overflow-hidden w-full">
      {/* Arka Plan Modern Parlama Efektleri - Hem Light Hem Dark için optimize edildi */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/5 dark:bg-pink-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 shadow-lg shadow-pink-500/5 transition-colors">
              <Mail className="w-6 h-6 text-pink-600 dark:text-pink-500" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">
              {t('mailSettings.PageTitle')}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 ml-1 transition-colors">
            {t('mailSettings.PageDescription')}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <MailSettingsForm
          data={data}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}