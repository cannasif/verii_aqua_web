import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'; 
import { cn } from '@/lib/utils'; 
import { Settings02Icon, Cancel01Icon } from 'hugeicons-react';

export function FloatingSettings() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[30] flex flex-col items-center gap-3">
         

      <div className={cn(
        "flex flex-col gap-3 transition-all duration-300 origin-bottom",
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-10 pointer-events-none absolute bottom-0"
      )}>
        <div className="rounded-full shadow-2xl bg-white dark:bg-[#150a25] border border-slate-200 dark:border-white/10 p-0.5">
            <ThemeToggle variant="icon" />
        </div>

        <div className="rounded-full shadow-2xl bg-white dark:bg-[#150a25] border border-slate-200 dark:border-white/10 p-0.5">
            <LanguageSwitcher variant="icon" />
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white dark:bg-[#150a25] border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
      >
        {isOpen ? (
            <Cancel01Icon size={22} className="text-red-500" />
        ) : (
            <Settings02Icon size={22} />
        )}
      </button>

    </div>
  );
}