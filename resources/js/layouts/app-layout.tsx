import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { usePage } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip'; // ✅ importa el TooltipProvider
import NotificationsAndAlerts from '@/components/notifications-and-alerts';

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
  const [loading, setLoading] = useState(true);
  const page = usePage();

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timeout);
  }, [page.url]);

  return (
    <>
      {loading && <Loader />}
      <TooltipProvider> {/* ✅ solo una vez aquí */}
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
          <div className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
            <NotificationsAndAlerts className="mb-4" />
            {children}
          </div>
        </AppLayoutTemplate>
      </TooltipProvider>
    </>
  );
};
