import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Combobox } from '@/components/ui/combobox';
import { loadLanguage } from '@/lib/i18n'; 

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'icon'; 
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps): ReactElement {
  const { t, i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const normalizedLang = i18n.language?.toLowerCase() === 'sa' ? 'ar' : i18n.language?.toLowerCase() ?? 'tr';
  const baseLang = normalizedLang.split('-')[0];
  const currentLanguage = languages.find((lang) => lang.code === baseLang) || languages[0];

  const handleLanguageChange = async (value: string): Promise<void> => {
    const target = value.toLowerCase() === 'sa' ? 'ar' : value.toLowerCase();
    if (target === baseLang) return;
    setIsChanging(true);
    try {
      await loadLanguage(target);
      await i18n.changeLanguage(target);
      if (typeof window !== 'undefined') window.localStorage.setItem('i18nextLng', target);
    } finally {
      setIsChanging(false);
    }
  };

  const languageOptions = languages.map((language) => ({
    value: language.code,
    label: `${language.flag} ${language.name}`,
  }));

  return (
    <Combobox
      options={languageOptions}
      value={currentLanguage.code}
      onValueChange={handleLanguageChange}
      placeholder={`${currentLanguage.flag} ${currentLanguage.name}`}
      searchPlaceholder={t('common.search')}
      emptyText={t('common.noResults')}
      disabled={isChanging}
      className={
        variant === 'default'
          ? "w-[130px] h-9 bg-secondary/50 border-input text-foreground rounded-full focus:ring-1 focus:ring-pink-500/20 focus:border-pink-500/50 hover:bg-accent transition-colors border shadow-none"
          : "w-12 h-12 rounded-full border border-white/20 bg-zinc-900/80 backdrop-blur-xl shadow-lg shadow-black/40 flex items-center justify-center p-0 ring-0 focus:ring-0 transition-all duration-300 hover:scale-110 active:scale-95 text-slate-200 hover:text-sky-400 hover:bg-zinc-800 hover:border-sky-500/30 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
      }
    />
  );
}
