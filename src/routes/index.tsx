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

// const WINDO_FORM_ROUTE = '/crm-ui';
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
      { index: true, element: <Navigate to="/stocks" replace /> },
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
