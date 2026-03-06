import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordSchema, type ForgotPasswordRequest } from '../types/auth';
import { useForgotPassword } from '../hooks/useForgotPassword';
import type React from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail02Icon } from 'hugeicons-react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import loginImage from '../../../../public/v3riiaqua.png';

export function ForgotPasswordPage(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { mutate: requestPasswordReset, isPending } = useForgotPassword();

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordRequest): void => {
    requestPasswordReset(data.email);
  };

  const inputGroupBase = 'flex items-stretch rounded-xl border border-white/5 bg-[#020712]/70 overflow-hidden transition-all duration-300 focus-within:border-[#ff4d79]/40 focus-within:bg-[#020712]/90 focus-within:ring-1 focus-within:ring-[#ff4d79]/20';
  const iconSlotBase = 'flex items-center justify-center w-10 sm:w-11 shrink-0 bg-transparent text-[#5c7c99] transition-colors duration-300 group-focus-within:text-[#ff4d79]';

  return (
    <div className="relative w-full min-h-dvh overflow-x-hidden bg-[#020c16] text-[#d0e6ff] font-['Plus_Jakarta_Sans'] flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        input { color-scheme: dark; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #020712 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #ff4d79;
          color-scheme: dark;
        }
      `}</style>

      <div className="fixed inset-0 z-0 opacity-100">
        <div className="absolute top-[-30%] left-[30%] w-[80vw] h-[150vh] bg-gradient-to-b from-[#ffedb3]/15 via-[#70d6ff]/5 to-transparent blur-[120px] -rotate-12 mix-blend-screen pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[120vh] bg-gradient-to-b from-[#00cec9]/10 via-[#0984e3]/5 to-transparent blur-[100px] rotate-[15deg] mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010408] via-[#020c16]/70 to-transparent pointer-events-none" />
      </div>

      <div className="fixed top-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3 animate-[fadeIn_1s_ease-out]">
        <LanguageSwitcher variant="icon" />
      </div>

      <div className="relative z-10 w-full min-h-dvh flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[390px] flex-1 flex flex-col justify-center min-h-0">
          <div className="rounded-[24px] border border-white/5 border-t-white/20 bg-[#091b30]/35 backdrop-blur-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] py-8 px-5 sm:px-8 relative overflow-hidden">
            
            <div className="text-center mb-6 relative z-10">
              <img
                src={loginImage}
                alt={t('auth.forgotPassword.logoAlt')}
                className="mx-auto h-24 sm:h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,77,121,0.35)]"
              />
              <h1 className="mt-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5c7c99]">
                {t('auth.forgotPassword.title')}
              </h1>
            </div>

            <div className="mb-6 relative z-10">
              <p className="text-[#5c7c99] text-xs text-center leading-relaxed px-2">
                {t('auth.forgotPassword.description')}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative z-10" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className={`group ${inputGroupBase} ${fieldState.invalid ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-red-500/20' : ''}`}>
                          <div className={iconSlotBase}>
                            <Mail02Icon size={18} />
                          </div>
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('auth.forgotPassword.emailPlaceholder')}
                            className="flex-1 min-w-0 h-10 sm:h-11 rounded-none border-0 bg-transparent py-2 pl-2 pr-3 text-[12px] sm:text-[13px] text-white placeholder:text-[#5c7c99] focus-visible:ring-0 focus-visible:ring-offset-0 truncate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#ff4d79] to-[#ffb703] text-white text-[12px] sm:text-[13px] tracking-widest font-bold shadow-[0_10px_30px_-5px_rgba(255,77,121,0.5)] transition-all hover:opacity-95 hover:shadow-[0_15px_35px_-5px_rgba(255,77,121,0.7)] active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? t('auth.forgotPassword.processing') : t('auth.forgotPassword.submitButton')}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/auth/login')}
                    className="w-full h-11 sm:h-12 rounded-xl border border-white/5 bg-[#020712]/50 text-[#5c7c99] text-[12px] sm:text-[13px] font-medium tracking-wide transition-all duration-300 hover:text-white hover:bg-white/5"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}