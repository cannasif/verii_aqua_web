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
  const { t } = useTranslation();

  // Örnek data (Senin mevcut datanla değişecek)
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
          <TableHeader className="bg-slate-50/50 dark:bg-white/2">
            <TableRow className="border-b border-border dark:border-white/5 hover:bg-transparent">
              <TableHead className="w-[80px] text-xs font-bold uppercase text-muted-foreground py-4">ID</TableHead>
              <TableHead className="text-xs font-bold uppercase text-muted-foreground py-4">{t('userManagement.columns.name')}</TableHead>
              <TableHead className="text-xs font-bold uppercase text-muted-foreground py-4">{t('userManagement.columns.email')}</TableHead>
              <TableHead className="text-xs font-bold uppercase text-muted-foreground py-4">{t('userManagement.columns.role')}</TableHead>
              <TableHead className="text-xs font-bold uppercase text-muted-foreground py-4 text-center">{t('userManagement.columns.status')}</TableHead>
              <TableHead className="w-[100px] text-right py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b border-border dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                <TableCell className="font-mono text-xs text-slate-400">#{user.id}</TableCell>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="size-3 text-pink-500" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-100 dark:bg-white/5 border-0 text-slate-700 dark:text-slate-300 font-medium rounded-md">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch checked={user.status} className="data-[state=checked]:bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-500">Aktif</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)} className="text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-xl">
                    <Edit2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-[#0b0713]/50 border-t border-border dark:border-white/5">
        <span className="text-xs font-medium text-muted-foreground">Toplam <span className="text-foreground dark:text-white font-bold">{users.length}</span> kayıt</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs dark:bg-transparent dark:border-white/10 dark:text-white">Geri</Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs dark:bg-transparent dark:border-white/10 dark:text-white">İleri</Button>
        </div>
      </div>
    </div>
  );
}
