import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadLanguage } from '@/lib/i18n';
import { Combobox } from '@/components/ui/combobox';
import { 
  Mail02Icon, 
  Moon02Icon, 
  LanguageSquareIcon, 
  UserIcon, 
  ArrowRight01Icon,
  Logout02Icon,
  Sun01Icon,
  ShieldEnergyIcon,
  Cancel01Icon 
} from 'hugeicons-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog"; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useUserDetailByUserId } from '@/features/user-detail-management/hooks/useUserDetailByUserId';
import { getImageUrl } from '@/features/user-detail-management/utils/image-url';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfileDetails: () => void;
}

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', short: 'TR' },
  { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', short: 'DE' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', short: 'IT' },
  { code: 'es', name: 'Español', flag: '🇪🇸', short: 'ES' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', short: 'AR' },
];

export function UserProfileModal({ 
  open, 
  onOpenChange,
  onOpenProfileDetails
}: UserProfileModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout, branch } = useAuthStore();
  const navigate = useNavigate();
  const { data: userDetail } = useUserDetailByUserId(user?.id || 0);

  const normalizedLang = i18n.language?.toLowerCase() === 'sa' ? 'ar' : i18n.language?.toLowerCase().split('-')[0] ?? 'tr';
  const currentLanguage = languages.find((lang) => lang.code === normalizedLang) || languages[0];
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const displayName = user?.name || user?.email || t('dashboard.user');
  const displayInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    navigate('/login');
  };

  const darkMode = theme === 'dark';

  const handleLanguageChange = async (value: string): Promise<void> => {
    const target = value.toLowerCase() === 'sa' ? 'ar' : value.toLowerCase();
    if (target === normalizedLang) return;
    setIsChangingLanguage(true);
    try {
      await loadLanguage(target);
      await i18n.changeLanguage(target);
      if (typeof window !== 'undefined') window.localStorage.setItem('i18nextLng', target);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 gap-0 border border-slate-200 dark:border-cyan-800/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col w-[95vw] md:max-w-4xl lg:max-w-[1000px] max-h-[92dvh] md:max-h-[620px] rounded-3xl md:rounded-[2.5rem] transition-all duration-500 [&>button:last-of-type]:hidden",
        darkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      )}>
        <DialogPrimitive.Close className={cn(
          "absolute right-4 top-4 md:right-6 md:top-6 z-50 rounded-xl p-2.5 transition-all duration-200",
          "active:scale-90",
          darkMode 
            ? "bg-white/10 text-slate-300 hover:bg-rose-600 hover:text-white" 
            : "bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white"
        )}>
          <Cancel01Icon size={20} strokeWidth={2.5} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        <DialogTitle className="sr-only">{t('sidebar.settings', { ns: 'common' })}</DialogTitle>

        <div className="flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden">
          
          {/* SOL PANEL (Avatar) */}
          <div className={cn(
            "w-full md:w-[320px] shrink-0 flex flex-col items-center justify-center md:justify-start md:pt-16 p-6 md:p-10 border-b md:border-b-0 md:border-r relative overflow-hidden transition-all duration-500",
            darkMode ? "bg-blue-950/40 border-cyan-800/30" : "bg-slate-50/80 border-slate-200"
          )}>
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
            
            <div className="relative group mb-4 md:mb-6 mt-4 md:mt-0">
              <div className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 rotate-2 transition-transform group-hover:rotate-0 duration-500 p-1 shadow-xl",
                darkMode ? "border-cyan-800/50 bg-blue-900/50" : "border-white bg-white"
              )}>
                {userDetail?.profilePictureUrl ? (
                  <img
                    src={getImageUrl(userDetail.profilePictureUrl) || ''}
                    alt={displayName}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
                      {displayInitials}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-xl border-4 border-slate-50 dark:border-blue-950 flex items-center justify-center shadow-lg">
                <ShieldEnergyIcon size={14} className="text-white" />
              </div>
            </div>

            <div className="text-center z-10 space-y-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight truncate max-w-[250px]">{displayName}</h2>
              <Badge variant="outline" className={cn(
                "rounded-lg font-bold py-1 px-4 text-[10px]",
                darkMode ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" : "border-cyan-200 bg-cyan-50 text-cyan-700"
              )}>
                {branch?.name || 'Administrator'}
              </Badge>
            </div>

            <div className="w-full mt-6 md:mt-8 flex justify-center z-10">
              <div className={cn("inline-flex items-center gap-3 p-2.5 px-4 rounded-xl transition-all border", darkMode ? "bg-blue-900/20 border-cyan-800/30" : "bg-white border-slate-200 shadow-sm")}>
                <Mail02Icon size={16} className="text-cyan-500 shrink-0" />
                <span className="text-[11px] font-semibold truncate text-slate-500 dark:text-slate-400">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* SAĞ PANEL (Ayarlar) */}
          <div className="flex-1 p-6 md:p-10 lg:p-12 flex flex-col min-h-0 relative">
            <div className="flex items-center gap-3 mb-6 md:mb-8 shrink-0">
              <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
              <h3 className="text-xl md:text-2xl font-black tracking-widest uppercase text-slate-900 dark:text-white">{t('sidebar.settings', { ns: 'common' })}</h3>
            </div>

            <div className={cn(
              "flex flex-col gap-3 md:gap-4 flex-none md:flex-1 pr-1",
              "md:overflow-y-auto custom-scrollbar"
            )}>
              <button
                className={cn(
                  "group w-full p-4 flex items-center justify-between border rounded-2xl transition-all duration-300",
                  darkMode ? "border-cyan-800/30 bg-blue-900/10 hover:border-cyan-500/50 hover:bg-blue-900/20" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-cyan-200"
                )}
                onClick={onOpenProfileDetails}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-xl shadow-sm", darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
                    <UserIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('profile.title')}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('customerManagement.form.editDescription')}</p>
                  </div>
                </div>
                <ArrowRight01Icon size={18} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className={cn(
                "group w-full p-4 flex items-center justify-between border rounded-2xl transition-all",
                darkMode ? "border-cyan-800/30 bg-blue-900/10" : "border-slate-200 bg-slate-50/50"
              )}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn("p-2.5 rounded-xl shadow-sm", darkMode ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600")}>
                    <LanguageSquareIcon size={20} />
                  </div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('language_choice')}</p>
                </div>
                <Combobox
                  options={languages.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))}
                  value={currentLanguage.code}
                  onValueChange={handleLanguageChange}
                  placeholder={currentLanguage.short}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.noResults')}
                  disabled={isChangingLanguage}
                  className={cn(
                    "w-24 md:w-28 h-9 shadow-sm focus:ring-0 font-bold text-xs transition-all rounded-xl",
                    darkMode ? "bg-blue-950/60 border-cyan-800/50 hover:bg-blue-900/50 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                />
              </div>

              <div className={cn(
                "group w-full p-4 flex items-center justify-between border rounded-2xl transition-all",
                darkMode ? "border-cyan-800/30 bg-blue-900/10" : "border-slate-200 bg-slate-50/50"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-xl shadow-sm", darkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600")}>
                    {darkMode ? <Moon02Icon size={20} /> : <Sun01Icon size={20} />}
                  </div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('appearance')}</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={() => setTheme(darkMode ? 'light' : 'dark')} 
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>
            </div>

            {/* DÜZELTİLMİŞ ZARİF MAVİ ÇIKIŞ BUTONU */}
            <div className="mt-5 md:mt-6 pt-5 border-t border-slate-200 dark:border-cyan-800/20 shrink-0">
              <Button
                className="w-full h-11 rounded-xl text-white font-bold text-sm bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all shadow-md shadow-cyan-500/20 border-0"
                onClick={handleLogout}
              >
                <Logout02Icon size={18} className="mr-2.5" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
