import { lazy, type ComponentType } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import { RouteErrorFallback } from '@/components/shared/RouteErrorFallback';
import { ForbiddenPage } from '@/components/shared/ForbiddenPage';
import AuthLayout from '@/layouts/AuthLayout';

const lazyImport = <T extends Record<string, unknown>, K extends keyof T>(
  factory: () => Promise<T>,
  name: K
) =>
  lazy(async () => {
    const module = await factory();
    return { default: module[name] as ComponentType };
  });

const LoginPage = lazyImport(() => import('@/features/auth'), 'LoginPage');
const ResetPasswordPage = lazyImport(() => import('@/features/auth'), 'ResetPasswordPage');
const ForgotPasswordPage = lazyImport(() => import('@/features/auth'), 'ForgotPasswordPage');
const UserManagementPage = lazyImport(() => import('@/features/user-management'), 'UserManagementPage');
const MailSettingsPage = lazyImport(() => import('@/features/mail-settings'), 'MailSettingsPage');
const StockListPage = lazyImport(() => import('@/features/stock'), 'StockListPage');
const StockDetailPage = lazyImport(() => import('@/features/stock'), 'StockDetailPage');
const PermissionDefinitionsPage = lazyImport(() => import('@/features/access-control'), 'PermissionDefinitionsPage');
const PermissionGroupsPage = lazyImport(() => import('@/features/access-control'), 'PermissionGroupsPage');
const UserGroupAssignmentsPage = lazyImport(() => import('@/features/access-control'), 'UserGroupAssignmentsPage');
const HangfireMonitoringPage = lazyImport(() => import('@/features/hangfire-monitoring'), 'HangfireMonitoringPage');
const ProfilePage = lazyImport(() => import('@/features/user-detail-management'), 'ProfilePage');
const ProjectsPage = lazyImport(() => import('@/features/aqua'), 'ProjectsPage');
const CagesPage = lazyImport(() => import('@/features/aqua'), 'CagesPage');
const ProjectCageAssignmentsPage = lazyImport(() => import('@/features/aqua'), 'ProjectCageAssignmentsPage');
const WeatherSeveritiesPage = lazyImport(() => import('@/features/aqua'), 'WeatherSeveritiesPage');
const WeatherTypesPage = lazyImport(() => import('@/features/aqua'), 'WeatherTypesPage');
const NetOperationTypesPage = lazyImport(() => import('@/features/aqua'), 'NetOperationTypesPage');
const GoodsReceiptsPage = lazyImport(() => import('@/features/aqua'), 'GoodsReceiptsPage');
const FeedingsPage = lazyImport(() => import('@/features/aqua'), 'FeedingsPage');
const MortalitiesPage = lazyImport(() => import('@/features/aqua'), 'MortalitiesPage');
const TransfersPage = lazyImport(() => import('@/features/aqua'), 'TransfersPage');
const ShipmentsPage = lazyImport(() => import('@/features/aqua'), 'ShipmentsPage');
const StockConvertsPage = lazyImport(() => import('@/features/aqua'), 'StockConvertsPage');
const DailyWeathersPage = lazyImport(() => import('@/features/aqua'), 'DailyWeathersPage');
const NetOperationsPage = lazyImport(() => import('@/features/aqua'), 'NetOperationsPage');
const GoodsReceiptLinesPage = lazyImport(() => import('@/features/aqua'), 'GoodsReceiptLinesPage');
const GoodsReceiptFishDistributionsPage = lazyImport(() => import('@/features/aqua'), 'GoodsReceiptFishDistributionsPage');
const FeedingLinesPage = lazyImport(() => import('@/features/aqua'), 'FeedingLinesPage');
const FeedingDistributionsPage = lazyImport(() => import('@/features/aqua'), 'FeedingDistributionsPage');
const TransferLinesPage = lazyImport(() => import('@/features/aqua'), 'TransferLinesPage');
const ShipmentLinesPage = lazyImport(() => import('@/features/aqua'), 'ShipmentLinesPage');
const MortalityLinesPage = lazyImport(() => import('@/features/aqua'), 'MortalityLinesPage');
const StockConvertLinesPage = lazyImport(() => import('@/features/aqua'), 'StockConvertLinesPage');
const NetOperationLinesPage = lazyImport(() => import('@/features/aqua'), 'NetOperationLinesPage');
const BatchMovementsPage = lazyImport(() => import('@/features/aqua'), 'BatchMovementsPage');
const CageBalancesPage = lazyImport(() => import('@/features/aqua'), 'CageBalancesPage');
const ProjectDetailReportPage = lazyImport(() => import('@/features/aqua'), 'ProjectDetailReportPage');
const AquaDashboardPage = lazyImport(() => import('@/features/aqua'), 'AquaDashboardPage');
const QuickSetupPage = lazyImport(() => import('@/features/aqua/operations/quick-setup'), 'QuickSetupPage');
const QuickDailyEntryPage = lazyImport(() => import('@/features/aqua/operations/quick-daily-entry'), 'QuickDailyEntryPage');
const WelcomePage = lazyImport(() => import('@/features/welcome'), 'WelcomePage');

const WINDO_FORM_ROUTE = '/';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: <WelcomePage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: 'user-management', element: <UserManagementPage /> },
      { path: 'users/mail-settings', element: <MailSettingsPage /> },
      { path: 'stocks', element: <StockListPage /> },
      { path: 'stocks/:id', element: <StockDetailPage /> },
      { path: 'access-control/permission-definitions', element: <PermissionDefinitionsPage /> },
      { path: 'access-control/permission-groups', element: <PermissionGroupsPage /> },
      { path: 'access-control/user-group-assignments', element: <UserGroupAssignmentsPage /> },
      { path: 'hangfire-monitoring', element: <HangfireMonitoringPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'aqua/definitions/projects', element: <ProjectsPage /> },
      { path: 'aqua/definitions/cages', element: <CagesPage /> },
      { path: 'aqua/definitions/project-cage-assignments', element: <ProjectCageAssignmentsPage /> },
      { path: 'aqua/definitions/weather-severities', element: <WeatherSeveritiesPage /> },
      { path: 'aqua/definitions/weather-types', element: <WeatherTypesPage /> },
      { path: 'aqua/definitions/net-operation-types', element: <NetOperationTypesPage /> },
      { path: 'aqua/operations/quick-setup', element: <QuickSetupPage /> },
      { path: 'aqua/operations/quick-daily-entry', element: <QuickDailyEntryPage /> },
      { path: 'aqua/operations/goods-receipts', element: <GoodsReceiptsPage /> },
      { path: 'aqua/operations/feedings', element: <FeedingsPage /> },
      { path: 'aqua/operations/mortalities', element: <MortalitiesPage /> },
      { path: 'aqua/operations/transfers', element: <TransfersPage /> },
      { path: 'aqua/operations/shipments', element: <ShipmentsPage /> },
      { path: 'aqua/operations/weighings', element: <Navigate to="/aqua/operations/stock-converts" replace /> },
      { path: 'aqua/operations/stock-converts', element: <StockConvertsPage /> },
      { path: 'aqua/operations/daily-weathers', element: <DailyWeathersPage /> },
      { path: 'aqua/operations/net-operations', element: <NetOperationsPage /> },
      { path: 'aqua/operations/goods-receipt-lines', element: <GoodsReceiptLinesPage /> },
      { path: 'aqua/operations/goods-receipt-fish-distributions', element: <GoodsReceiptFishDistributionsPage /> },
      { path: 'aqua/operations/feeding-lines', element: <FeedingLinesPage /> },
      { path: 'aqua/operations/feeding-distributions', element: <FeedingDistributionsPage /> },
      { path: 'aqua/operations/transfer-lines', element: <TransferLinesPage /> },
      { path: 'aqua/operations/shipment-lines', element: <ShipmentLinesPage /> },
      { path: 'aqua/operations/mortality-lines', element: <MortalityLinesPage /> },
      { path: 'aqua/operations/weighing-lines', element: <Navigate to="/aqua/operations/stock-convert-lines" replace /> },
      { path: 'aqua/operations/stock-convert-lines', element: <StockConvertLinesPage /> },
      { path: 'aqua/operations/net-operation-lines', element: <NetOperationLinesPage /> },
      { path: 'aqua/reports/batch-movements', element: <BatchMovementsPage /> },
      { path: 'aqua/reports/cage-balances', element: <CageBalancesPage /> },
      { path: 'aqua/reports/project-detail', element: <ProjectDetailReportPage /> },
      { path: 'aqua/dashboard', element: <AquaDashboardPage /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/reset-password',
    element: <AuthLayout />,
    children: [{ index: true, element: <ResetPasswordPage /> }],
  },
], {
  basename: WINDO_FORM_ROUTE,
});
