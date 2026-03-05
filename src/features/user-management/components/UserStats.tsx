import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function UserStats(): ReactElement {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('userManagement.stats.total'),
      value: '4',
      icon: Users,
      color: 'text-pink-600 dark:text-pink-500',
      bg: 'bg-pink-100 dark:bg-pink-500/10',
    },
    {
      title: t('userManagement.stats.active'),
      value: '4',
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10',
    },
    {
      title: t('userManagement.stats.inactive'),
      value: '0',
      icon: UserX,
      color: 'text-orange-600 dark:text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} transition-colors`}>
                <stat.icon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}