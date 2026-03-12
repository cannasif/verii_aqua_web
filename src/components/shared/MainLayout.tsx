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
  const { t } = useTranslation(['common', 'hangfire-monitoring', 'user-detail-management']);
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();
  const sidebarT = (key: string): string => t(`sidebar.${key}`, { ns: 'common' });

  const defaultNavItems: NavItem[] = useMemo(() => {
    const iconSize = 22;

    const logicalMenuStructure: NavItem[] = [
      {
        title: sidebarT('aquaOperations'),
        icon: <Waves size={iconSize} className="text-emerald-500" />,
        children: [
          { title: sidebarT('aquaQuickSetup'), href: '/aqua/operations/quick-setup' },
          { title: sidebarT('aquaQuickDailyEntry'), href: '/aqua/operations/quick-daily-entry' },
          { title: sidebarT('aquaGoodsReceipts'), href: '/aqua/operations/goods-receipts' },
          { title: sidebarT('aquaFeedings'), href: '/aqua/operations/feedings' },
          { title: sidebarT('aquaMortalities'), href: '/aqua/operations/mortalities' },
          { title: sidebarT('aquaTransfers'), href: '/aqua/operations/transfers' },
          { title: sidebarT('aquaShipments'), href: '/aqua/operations/shipments' },
          { title: sidebarT('aquaStockConverts'), href: '/aqua/operations/stock-converts' },
          { title: sidebarT('aquaDailyWeathers'), href: '/aqua/operations/daily-weathers' },
          { title: sidebarT('aquaNetOperations'), href: '/aqua/operations/net-operations' },
        ],
      },
      {
        title: sidebarT('aquaReports'),
        icon: <BarChart3 size={iconSize} className="text-indigo-500" />,
        children: [
          { title: sidebarT('aquaDashboard'), href: '/aqua/dashboard' },
          { title: sidebarT('aquaProjectDetailReport'), href: '/aqua/reports/project-detail' },
          { title: sidebarT('aquaBatchMovements'), href: '/aqua/reports/batch-movements' },
          { title: sidebarT('aquaCageBalances'), href: '/aqua/reports/cage-balances' },
        ],
      },
      {
        title: sidebarT('aquaDefinitions'),
        icon: <BookOpen size={iconSize} className="text-cyan-500" />,
        children: [
          { title: sidebarT('aquaProjects'), href: '/aqua/definitions/projects' },
          { title: sidebarT('aquaCages'), href: '/aqua/definitions/cages' },
          { title: sidebarT('aquaProjectCageAssignments'), href: '/aqua/definitions/project-cage-assignments' },
          { title: sidebarT('aquaWeatherSeverities'), href: '/aqua/definitions/weather-severities' },
          { title: sidebarT('aquaWeatherTypes'), href: '/aqua/definitions/weather-types' },
          { title: sidebarT('aquaNetOperationTypes'), href: '/aqua/definitions/net-operation-types' },
        ],
      },
      {
        title: sidebarT('productAndStock'),
        icon: <PackageIcon size={iconSize} className="text-pink-500" />,
        children: [
          { title: sidebarT('stockManagement'), href: '/stocks' },
        ],
      },
      {
        title: sidebarT('accessControl'),
        icon: <Shield01Icon size={iconSize} className="text-violet-500" />,
        children: [
          { title: sidebarT('userManagement'), href: '/user-management' },
          { title: sidebarT('mailSettings'), href: '/users/mail-settings' },
          { title: sidebarT('permissionDefinitions'), href: '/access-control/permission-definitions' },
          { title: sidebarT('permissionGroups'), href: '/access-control/permission-groups' },
          { title: sidebarT('userGroupAssignments'), href: '/access-control/user-group-assignments' },
          { title: t('menu', { ns: 'hangfire-monitoring' }), href: '/hangfire-monitoring' },
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
 
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#f8f9fc] dark:bg-[#020c16] font-['Outfit'] transition-colors duration-300">
      
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
 
         <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[#00f7ff]/15 dark:bg-transparent blur-[120px] mix-blend-multiply transition-colors duration-500" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#ff4d79]/10 dark:bg-transparent blur-[100px] mix-blend-multiply transition-colors duration-500" />

 
         <div className="absolute top-[-30%] left-[20%] w-[80vw] h-[150vh] bg-gradient-to-b from-[#ffedb3]/10 via-[#00f7ff]/5 to-transparent blur-[120px] -rotate-12 mix-blend-screen opacity-0 dark:opacity-100 transition-opacity duration-500" />
         <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[120vh] bg-gradient-to-b from-[#00cec9]/10 via-[#0984e3]/5 to-transparent blur-[100px] rotate-[15deg] mix-blend-screen opacity-0 dark:opacity-100 transition-opacity duration-500" />
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
