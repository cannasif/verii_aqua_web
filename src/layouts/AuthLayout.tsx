import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/shared/PageLoader';

export default function AuthLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}
