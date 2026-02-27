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

import loginImage from '../../../../public/logo.png';

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

  const inputGroupBase = 'flex items-stretch rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-[border-color,box-shadow] duration-200 focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/20';
  const inputGroupInvalid = 'border-red-500/70 focus-within:border-red-500 focus-within:ring-red-500/20';
  const iconSlotBase = 'flex items-center justify-center w-10 shrink-0 bg-white/5 text-slate-400 transition-colors duration-200 group-focus-within:text-pink-400';

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#0f0518] text-white font-['Plus_Jakarta_Sans']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        input { color-scheme: dark; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a1225 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: white;
          color-scheme: dark;
        }
      `}</style>

      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${showAnimation ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-pink-900/15 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-orange-900/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#0f0518]/60 to-[#0f0518]" />
      </div>

      <AuthBackground isActive={showAnimation} />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-[fadeIn_1s_ease-out]">
        <LanguageSwitcher variant="icon" />
        <button
          onClick={() => setShowAnimation(!showAnimation)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 backdrop-blur-xl
            ${showAnimation
              ? 'bg-pink-500/20 border-pink-500/50 text-pink-400 hover:bg-pink-500/30'
              : 'bg-white/10 border-white/20 text-slate-300 hover:text-pink-400 hover:bg-white/15'}
          `}
          title={showAnimation ? t('auth.login.animationOff') : t('auth.login.animationOn')}
        >
          {showAnimation ? <EnergyEllipseIcon size={18} /> : <UnavailableIcon size={18} />}
        </button>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center px-3 py-3 overflow-hidden">
        <div className="w-full max-w-[380px] flex-1 flex flex-col justify-center min-h-0">
          <div className="rounded-2xl border border-white/10 bg-[#140a1e]/80 backdrop-blur-xl shadow-xl py-5 px-4 sm:px-5">
            <div className="text-center mb-4">
              <img
                src={loginImage}
                alt="V3RII"
                className="mx-auto h-20 w-auto object-contain"
              />
              <h1 className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-400">
                {t('auth.login.title')}
              </h1>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
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
                            className="flex-1 min-w-0 h-10 rounded-none border-0 bg-transparent py-2 pl-2 pr-2 text-sm text-white placeholder:text-slate-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 justify-between font-normal"
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
                            className="flex-1 min-w-0 h-10 rounded-none border-0 bg-transparent py-2 pl-2 pr-3 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                            className="flex-1 min-w-0 h-10 rounded-none border-0 bg-transparent py-2 pl-2 pr-10 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                            onKeyDown={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                            onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible((v) => !v)}
                            className="flex items-center justify-center w-9 shrink-0 text-slate-400 hover:text-white transition-colors"
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

                <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-white/20 bg-white/10 accent-pink-500 size-3.5"
                            />
                            {t('auth.login.rememberMe')}
                          </label>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Link to="/auth/forgot-password" className="hover:text-pink-400 transition-colors">
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-10 rounded-xl bg-linear-to-r from-pink-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-pink-500/25 transition hover:opacity-95 active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isPending ? t('auth.login.processing') : t('auth.login.submitButton')}
                </button>
              </form>
            </Form>
          </div>
        </div>

        <footer className="shrink-0 flex flex-col items-center gap-2 py-2">
          <p className="text-slate-500 text-[11px] uppercase tracking-wider text-center max-w-[260px] leading-tight">
            <Trans
              i18nKey="auth.login.slogan"
              components={{ 1: <span className="text-pink-400 font-semibold" /> }}
            />
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <a href="tel:+905070123018" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Telefon">
              <Call02Icon size={16} />
            </a>
            <a href="https://v3rii.com" target="_blank" rel="noreferrer" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Web">
              <Globe02Icon size={16} />
            </a>
            <a href="mailto:info@v3rii.com" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="E-posta">
              <Mail02Icon size={16} />
            </a>
            <a href="https://wa.me/905070123018" target="_blank" rel="noreferrer" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="WhatsApp">
              <WhatsappIcon size={16} />
            </a>
            <a href="https://t.me/v3rii" target="_blank" rel="noreferrer" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Telegram">
              <TelegramIcon size={16} />
            </a>
            <a href="https://instagram.com/v3rii" target="_blank" rel="noreferrer" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Instagram">
              <InstagramIcon size={16} />
            </a>
            <a href="https://x.com/v3rii" target="_blank" rel="noreferrer" className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="X">
              <NewTwitterIcon size={16} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}