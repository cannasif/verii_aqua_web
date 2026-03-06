import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { loginRequestSchema } from '../types/auth';
import type { z } from 'zod';
import { useLogin } from '../hooks/useLogin';
import { useBranches } from '../hooks/useBranches';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenValid } from '@/utils/jwt';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { AuthBackground } from './AuthBackground';
import loginImage from '../../../../public/v3riiaqua.png';
import { 
  Location01Icon, 
  Mail02Icon, 
  LockKeyIcon, 
  ViewIcon, 
  ViewOffIcon, 
  Call02Icon,   
  Globe02Icon,      
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
  NewTwitterIcon,
  EnergyEllipseIcon, 
  UnavailableIcon,
  Alert02Icon 
} from 'hugeicons-react';

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: branches } = useBranches();
  const { mutate: login, isPending } = useLogin(branches);
  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    [branches]
  );
  const { logout } = useAuthStore();
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  
  const [showAnimation, setShowAnimation] = useState(true);

  const form = useForm<z.input<typeof loginRequestSchema>>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      branchId: '',
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (searchParams.get('sessionExpired') === 'true') {
      logout();
      toast.warning(t('auth.login.sessionExpired'));
      setSearchParams({}, { replace: true });
      return;
    }

    const storedToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (storedToken && isTokenValid(storedToken)) {
      navigate('/', { replace: true });
    }
  }, [searchParams, setSearchParams, t, navigate, logout]);

  const onSubmit = (data: z.output<typeof loginRequestSchema>): void => {
    login({ ...data });
  };

  const handleSocialClick = (e: React.MouseEvent, label: string) => {
    if (['Telegram', 'Instagram', 'X'].includes(label)) {
      e.preventDefault();
      toast.info(t('common.comingSoon'));
    }
  };

  const inputGroupBase = 'flex items-stretch rounded-xl border border-white/5 bg-[#020712]/70 overflow-hidden transition-all duration-300 focus-within:border-[#ff4d79]/40 focus-within:bg-[#020712]/90 focus-within:ring-1 focus-within:ring-[#ff4d79]/20';
  const inputGroupInvalid = 'border-red-500/50 focus-within:border-red-500 focus-within:ring-red-500/20';
  const iconSlotBase = 'flex items-center justify-center w-11 shrink-0 bg-transparent text-[#5c7c99] transition-colors duration-300 group-focus-within:text-[#ff4d79]';

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

      <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out ${showAnimation ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-[-30%] left-[30%] w-[80vw] h-[150vh] bg-gradient-to-b from-[#ffedb3]/15 via-[#70d6ff]/5 to-transparent blur-[120px] -rotate-12 mix-blend-screen pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[120vh] bg-gradient-to-b from-[#00cec9]/10 via-[#0984e3]/5 to-transparent blur-[100px] rotate-[15deg] mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010408] via-[#020c16]/70 to-transparent pointer-events-none" />
      </div>

      <AuthBackground isActive={showAnimation} />

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3 animate-[fadeIn_1s_ease-out]">
        <LanguageSwitcher variant="icon" />
        <button
          onClick={() => setShowAnimation(!showAnimation)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 backdrop-blur-xl
            ${showAnimation
              ? 'bg-[#00f7ff]/15 border-[#00f7ff]/40 text-[#00f7ff] hover:bg-[#00f7ff]/25 shadow-[0_0_15px_rgba(247,255,255,0.25)]'
              : 'bg-[#091b30]/40 border-white/10 text-[#5c7c99] hover:text-[#00f7ff] hover:bg-[#00f7ff]/10'}
          `}
          title={showAnimation ? t('auth.login.animationOff') : t('auth.login.animationOn')}
        >
          {showAnimation ? <EnergyEllipseIcon size={18} /> : <UnavailableIcon size={18} />}
        </button>
      </div>

      <div className="relative z-10 w-full min-h-dvh flex flex-col justify-between items-center px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <div className="w-full max-w-[390px] flex-1 flex flex-col justify-center min-h-0">
          <div className="rounded-[24px] border border-white/5 border-t-white/20 bg-[#091b30]/35 backdrop-blur-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] py-8 px-5 sm:px-8 relative overflow-hidden">
            <div className="text-center mb-6 relative z-10">
              <img
                src={loginImage}
                alt="V3RII AQUA"
                className="mx-auto h-24 sm:h-46 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,77,121,0.35)]"
              />
              <h1 className="mt-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5c7c99]">
                {t('auth.login.title')}
              </h1>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 relative z-10" noValidate>
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className={`group ${inputGroupBase} ${fieldState.invalid ? inputGroupInvalid : ''}`}>
                          <div className={iconSlotBase}>
                            <Location01Icon size={18} />
                          </div>
                          <Combobox
                            options={branchOptions}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder={t('auth.login.branchPlaceholder')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('common.noResults')}
                            className="flex-1 min-w-0 h-10 sm:h-11 rounded-none border-0 bg-transparent py-2 pl-2 pr-2 text-[12px] sm:text-[13px] text-white placeholder:text-[#5c7c99] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 justify-between font-normal truncate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className={`group ${inputGroupBase} ${fieldState.invalid ? inputGroupInvalid : ''}`}>
                          <div className={iconSlotBase}>
                            <Mail02Icon size={18} />
                          </div>
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('auth.login.emailPlaceholder')}
                            className="flex-1 min-w-0 h-10 sm:h-11 rounded-none border-0 bg-transparent py-2 pl-2 pr-3 text-[12px] sm:text-[13px] text-white placeholder:text-[#5c7c99] focus-visible:ring-0 focus-visible:ring-offset-0 truncate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className={`group ${inputGroupBase} ${fieldState.invalid ? inputGroupInvalid : ''}`}>
                          <div className={iconSlotBase}>
                            <LockKeyIcon size={18} />
                          </div>
                          <Input
                            {...field}
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder={t('auth.login.passwordPlaceholder')}
                            className="flex-1 min-w-0 h-10 sm:h-11 rounded-none border-0 bg-transparent py-2 pl-2 pr-10 text-[12px] sm:text-[13px] text-white placeholder:text-[#5c7c99] focus-visible:ring-0 focus-visible:ring-offset-0 truncate"
                            onKeyDown={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                            onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible((v) => !v)}
                            className="flex items-center justify-center w-10 sm:w-11 shrink-0 text-[#5c7c99] hover:text-[#ff4d79] transition-colors"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPasswordVisible ? <ViewOffIcon size={18} /> : <ViewIcon size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <div className="min-h-4 mt-1">
                        {fieldState.error && (
                          <FormMessage className="text-red-500 text-xs" />
                        )}
                        {!fieldState.error && capsLockActive && (
                          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                            <Alert02Icon size={14} />
                            {t('auth.login.capsLockOn')}
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#5c7c99] pt-1 pb-1 sm:pb-2">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-white/10 bg-[#020712] accent-[#ff4d79] size-3.5"
                            />
                            {t('auth.login.rememberMe')}
                          </label>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Link to="/auth/forgot-password" className="hover:text-white transition-colors">
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#ff4d79] to-[#ffb703] text-white text-[12px] sm:text-[13px] tracking-widest font-bold shadow-[0_10px_30px_-5px_rgba(255,77,121,0.5)] transition-all hover:opacity-95 hover:shadow-[0_15px_35px_-5px_rgba(255,77,121,0.7)] active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isPending ? t('auth.login.processing') : t('auth.login.submitButton')}
                </button>
              </form>
            </Form>
          </div>
        </div>

        <footer className="shrink-0 flex flex-col items-center gap-4 sm:gap-5 mt-6 sm:mt-0 py-4 sm:py-6 z-10 w-full">
          <p className="text-[#5c7c99] text-[9px] sm:text-[10.5px] uppercase tracking-[0.15em] text-center max-w-[280px] sm:max-w-[360px] leading-relaxed px-2">
            <Trans
              i18nKey="auth.login.slogan"
              components={{
                1: <span className="font-bold bg-gradient-to-r from-[#ff4d79] to-[#ffb703] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,77,121,0.3)]" />,
                2: <span className="font-bold bg-gradient-to-r from-[#00f7ff] to-[#0088ff] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,247,255,0.4)]" />,
                br: <br />
              }}
            />
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap px-2">
            {[
              { icon: <Call02Icon className="size-5 sm:size-[22px]" />, href: "tel:+905070123018", label: "Telefon" },
              { icon: <Globe02Icon className="size-5 sm:size-[22px]" />, href: "https://v3rii.com", label: "Web" },
              { icon: <Mail02Icon className="size-5 sm:size-[22px]" />, href: "mailto:info@v3rii.com", label: "E-posta" },
              { icon: <WhatsappIcon className="size-5 sm:size-[22px]" />, href: "https://wa.me/905070123018", label: "WhatsApp" },
              { icon: <TelegramIcon className="size-5 sm:size-[22px]" />, href: "https://t.me/v3rii", label: "Telegram" },
              { icon: <InstagramIcon className="size-5 sm:size-[22px]" />, href: "https://instagram.com/v3rii", label: "Instagram" },
              { icon: <NewTwitterIcon className="size-5 sm:size-[22px]" />, href: "https://x.com/v3rii", label: "X" }
            ].map((link, i) => (
              <a 
                key={i}
                href={link.href} 
                onClick={(e) => handleSocialClick(e, link.label)}
                target={link.href.startsWith('http') ? "_blank" : "_self"}
                rel={link.href.startsWith('http') ? "noreferrer" : ""}
                className="flex items-center justify-center size-10 sm:size-12 rounded-full border border-white/5 bg-[#020712]/50 text-[#5c7c99] backdrop-blur-md transition-all duration-300 hover:text-[#00f7ff] hover:border-[#00f7ff]/40 hover:bg-[#00f7ff]/10 hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(0,247,255,0.25)]" 
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}