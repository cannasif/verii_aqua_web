import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function UserStats(): ReactElement {
  // Eğer çeviriler user.json içindeyse 'user' namespace'ini ekleyin
  const { t } = useTranslation(['user-management', 'common']);

  const stats = [
    {
      // HATA FIX: Anahtar yolları kontrol edildi
      title: t('stats.totalUsers', { ns: 'user-management' }),
      value: '4',
      icon: Users,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-100 dark:bg-cyan-500/10',
    },
    {
      title: t('stats.activeUsers', { ns: 'user-management' }),
      value: '4',
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10',
    },
    {
      title: t('table.inactive', { ns: 'user-management' }),
      value: '0',
      icon: UserX,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} transition-colors border border-transparent dark:border-white/5`}>
                <stat.icon className="size-6" />
              </div>
              <div>
                {/* FIX: uppercase kaldırıldı veya kontrol altına alındı */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                   {stat.title}
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                   {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
