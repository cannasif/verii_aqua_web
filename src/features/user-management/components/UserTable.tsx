import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit2, Mail } from 'lucide-react';

export function UserTable({ onEdit }: any): ReactElement {
  const { t } = useTranslation(['user-management', 'common']);

  const users = [
    { id: 1, name: 'adminv3rii.com', email: 'admin@v3rii.com', role: 'Admin', status: true },
    { id: 2, name: 'can', email: 'can.nasif@v3rii.com', role: 'Admin', status: true },
    { id: 3, name: 'efe', email: 'alagozefe331@gmail.com', role: 'Admin', status: true },
    { id: 4, name: 'Efe1357', email: 'efe.alagoz@v3rii.com', role: 'Manager', status: true },
  ];

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-blue-900/20">
            <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
              <TableHead className="w-[80px] text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 py-4 pl-6">ID</TableHead>
              {/* HATA FIX: Çeviri anahtarları düzeltildi */}
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 py-4">
                {t('table.username', { ns: 'user-management' })}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 py-4">
                {t('table.email', { ns: 'user-management' })}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 py-4">
                {t('table.role', { ns: 'user-management' })}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 py-4 text-center">
                {t('table.status', { ns: 'user-management' })}
              </TableHead>
              <TableHead className="w-[100px] text-right py-4 pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b border-slate-100 dark:border-cyan-800/20 hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-colors">
                <TableCell className="font-mono text-xs text-slate-400 dark:text-slate-500 pl-6">#{user.id}</TableCell>
                <TableCell className="font-semibold text-sm text-slate-900 dark:text-slate-200">{user.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="size-3 text-cyan-500 dark:text-cyan-400" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-100 dark:bg-blue-900/30 border-0 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-md px-2 py-0.5">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch checked={user.status} className="data-[state=checked]:bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                       {t('common.active')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)} className="text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/30 rounded-xl">
                    <Edit2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-blue-950/40 border-t border-slate-200 dark:border-cyan-800/30 rounded-b-2xl">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
           {t('stock.list.total', { ns: 'common' })} <span className="text-slate-900 dark:text-white font-bold">{users.length}</span> {t('common.records')}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs bg-white dark:bg-transparent border-slate-200 dark:border-white/10 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            {t('common.previous')}
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs bg-white dark:bg-transparent border-slate-200 dark:border-white/10 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
