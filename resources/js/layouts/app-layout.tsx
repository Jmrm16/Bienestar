import AppLayoutTemplate from "@/layouts/app/app-sidebar-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotificationsAndAlerts from "@/components/notifications-and-alerts";
import { type BreadcrumbItem } from "@/types";
import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <div className="transition-opacity duration-300">
          <NotificationsAndAlerts className="mb-4" />
          {children}
        </div>
      </AppLayoutTemplate>
    </TooltipProvider>
  );
}
