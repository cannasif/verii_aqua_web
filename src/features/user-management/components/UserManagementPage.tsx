import { type ReactElement, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { UserStats } from './UserStats';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { UserPlus, Users } from 'lucide-react';
import type { UserDto } from '../types/user-types';

export function UserManagementPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [sortBy, setSortBy] = useState('Id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  useEffect(() => {
    setPageTitle(t('userManagement.menu'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Aqua Konsepti: Pembe yerine Cyan vurgulu ikon kutusu */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 transition-colors">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              {t('userManagement.menu')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium transition-colors">
              {t('userManagement.description')}
            </p>
          </div>
        </div>
        {/* Aqua Konsepti: Pembe gradient yerine Cyan/Blue gradient buton */}
        <Button 
          onClick={() => { setEditingUser(null); setFormOpen(true); }}
          className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-cyan-500/20 border-0 hover:opacity-95 transition-all active:scale-[0.98]"
        >
          <UserPlus className="mr-2 size-4" />
          {t('userManagement.addButton')}
        </Button>
      </div>

      <UserStats />

      {/* Aqua Konsepti: Mor dark bg yerine Blue-950/60 ve Cyan borderlar */}
      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all duration-300">
        <UserTable
          pageNumber={pageNumber}
          pageSize={20}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onPageChange={setPageNumber}
          onSortChange={(s: string, d: 'asc' | 'desc') => { setSortBy(s); setSortDirection(d); }}
          onEdit={(u: UserDto) => { setEditingUser(u); setFormOpen(true); }}
        />
      </div>

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data: any) => {
          if (editingUser) {
            await updateUser.mutateAsync({ id: editingUser.id, data });
          } else {
            await createUser.mutateAsync(data);
          }
          setFormOpen(false);
        }}
        user={editingUser}
        isLoading={createUser.isPending || updateUser.isPending}
      />
    </div>
  );
}