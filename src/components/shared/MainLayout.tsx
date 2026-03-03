import { type ReactElement, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoader } from './PageLoader';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RoutePermissionGuard } from '@/features/access-control/components/RoutePermissionGuard';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { filterNavItemsByPermission } from '@/features/access-control/utils/filterNavItems';
import { 
  Shield01Icon,
  PackageIcon, 
  UserCircleIcon,
} from 'hugeicons-react';
import { Waves, BookOpen, BarChart3 } from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon?: ReactElement;
  children?: NavItem[];
  defaultExpanded?: boolean;
}
interface MainLayoutProps {
  navItems?: NavItem[];
}

export function MainLayout({ navItems }: MainLayoutProps): ReactElement {
  const { t } = useTranslation();
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();

  const defaultNavItems: NavItem[] = useMemo(() => {
    const iconSize = 22;

    const logicalMenuStructure: NavItem[] = [
      {
        title: t('sidebar.aquaOperations', { defaultValue: 'Aqua İşlemleri' }),
        icon: <Waves size={iconSize} className="text-emerald-500" />,
        children: [
          { title: t('sidebar.aquaQuickSetup', { defaultValue: 'Hızlı Kurulum' }), href: '/aqua/operations/quick-setup' },
          { title: t('sidebar.aquaQuickDailyEntry', { defaultValue: 'Hızlı Günlük Giriş' }), href: '/aqua/operations/quick-daily-entry' },
          { title: t('sidebar.aquaGoodsReceipts', { defaultValue: 'Mal Kabul (Balık/Yem)' }), href: '/aqua/operations/goods-receipts' },
          { title: t('sidebar.aquaFeedings', { defaultValue: 'Besleme (Sabah/Akşam)' }), href: '/aqua/operations/feedings' },
          { title: t('sidebar.aquaMortalities', { defaultValue: 'Ölüm' }), href: '/aqua/operations/mortalities' },
          { title: t('sidebar.aquaTransfers', { defaultValue: 'Transfer' }), href: '/aqua/operations/transfers' },
          { title: t('sidebar.aquaShipments', { defaultValue: 'Sevkiyat' }), href: '/aqua/operations/shipments' },
          { title: t('sidebar.aquaStockConverts', { defaultValue: 'Stock Convert' }), href: '/aqua/operations/stock-converts' },
          { title: t('sidebar.aquaDailyWeathers', { defaultValue: 'Günlük Hava Durumu' }), href: '/aqua/operations/daily-weathers' },
          { title: t('sidebar.aquaNetOperations', { defaultValue: 'Ağ İşlemleri' }), href: '/aqua/operations/net-operations' },
        ],
      },
      {
        title: t('sidebar.aquaReports', { defaultValue: 'Aqua Raporları' }),
        icon: <BarChart3 size={iconSize} className="text-indigo-500" />,
        children: [
          { title: t('sidebar.aquaDashboard', { defaultValue: 'Dashboard' }), href: '/aqua/dashboard' },
          { title: t('sidebar.aquaProjectDetailReport', { defaultValue: 'Proje Detay Raporu' }), href: '/aqua/reports/project-detail' },
          { title: t('sidebar.aquaBatchMovements', { defaultValue: 'Batch Movement' }), href: '/aqua/reports/batch-movements' },
          { title: t('sidebar.aquaCageBalances', { defaultValue: 'Kafes Balance' }), href: '/aqua/reports/cage-balances' },
        ],
      },
      {
        title: t('sidebar.aquaDefinitions', { defaultValue: 'Aqua Tanımları' }),
        icon: <BookOpen size={iconSize} className="text-cyan-500" />,
        children: [
          { title: t('sidebar.aquaProjects', { defaultValue: 'Projeler' }), href: '/aqua/definitions/projects' },
          { title: t('sidebar.aquaCages', { defaultValue: 'Kafesler' }), href: '/aqua/definitions/cages' },
          { title: t('sidebar.aquaProjectCageAssignments', { defaultValue: 'Proje-Kafes Atama' }), href: '/aqua/definitions/project-cage-assignments' },
          { title: t('sidebar.aquaWeatherSeverities', { defaultValue: 'Hava Durumu Şiddet Tanımı' }), href: '/aqua/definitions/weather-severities' },
          { title: t('sidebar.aquaWeatherTypes', { defaultValue: 'Hava Durumu Tip Tanımı' }), href: '/aqua/definitions/weather-types' },
          { title: t('sidebar.aquaNetOperationTypes', { defaultValue: 'Ağ İşlem Tipleri' }), href: '/aqua/definitions/net-operation-types' },
        ],
      },
      {
        title: t('sidebar.productAndStock'),
        icon: <PackageIcon size={iconSize} className="text-pink-500" />,
        children: [
          { title: t('sidebar.stockManagement'), href: '/stocks' },
        ],
      },
      {
        title: t('sidebar.accessControl'),
        icon: <Shield01Icon size={iconSize} className="text-violet-500" />,
        children: [
          { title: t('sidebar.userManagement'), href: '/user-management' },
          { title: t('sidebar.mailSettings'), href: '/users/mail-settings' },
          { title: t('sidebar.permissionDefinitions'), href: '/access-control/permission-definitions' },
          { title: t('sidebar.permissionGroups'), href: '/access-control/permission-groups' },
          { title: t('sidebar.userGroupAssignments'), href: '/access-control/user-group-assignments' },
          { title: t('menu', { ns: 'hangfire-monitoring', defaultValue: 'Hangfire İzleme' }), href: '/hangfire-monitoring' },
        ],
      },
      {
        title: t('userDetailManagement.profilePageTitle'),
        icon: <UserCircleIcon size={iconSize} className="text-indigo-500" stroke="currentColor" />,
        href: '/profile',
      },
    ];

    return logicalMenuStructure;
  }, [t]);

  const items = useMemo(() => {
    const raw = navItems ?? defaultNavItems;
    if (isLoading) return raw;
    if (permissions) return filterNavItemsByPermission(raw, permissions);
    if (isError) return raw;
    return raw;
  }, [navItems, defaultNavItems, permissions, isLoading, isError]);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#f8f9fc] dark:bg-[#0c0516] font-['Outfit'] transition-colors duration-300">
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-pink-300/30 dark:bg-pink-600/5 blur-[120px] mix-blend-multiply dark:mix-blend-normal transition-colors duration-500" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-300/30 dark:bg-orange-600/5 blur-[100px] mix-blend-multiply dark:mix-blend-normal transition-colors duration-500" />
      </div>

      <div className="relative z-20 h-full">
        <Sidebar items={items} />
      </div>

      <div className="flex flex-1 flex-col h-full overflow-hidden relative z-10">
        <Navbar />
        <TooltipProvider delayDuration={200}>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 text-foreground scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className="w-full min-h-full">
              <Suspense fallback={<PageLoader />}>
                <RoutePermissionGuard />
              </Suspense>
            </div>
          </main>
        </TooltipProvider>
        <Footer />
      </div>
      
    </div>
  );
}
