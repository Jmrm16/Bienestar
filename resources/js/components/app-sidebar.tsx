import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
  BookOpen,
  Folder,
  LayoutGrid,
  Users,
  Layers,
  Flower,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutGrid,
  },
    {
    title: 'Tutorias',
    icon: Users,
    children: [
      {
          title: 'Tutores',
          url: '/tutores',
          icon: Users,
      },
      {
          title: 'Asignaturas',
          url: '/asignaturas',
          icon: Users,
      },
      {
          title: 'Carreras',
          url: '/carreras',
          icon: Users,
      },
    ],
  },

  {
    title: 'Acompañamiento',
    icon: Layers,
    children: [
      {
        title: 'Estudiantes',
        url: '/estudiantes',
        icon: Users,
      },
    ],
  },
  {
    title: 'Cultura',
    url: '/culturas',
    icon: Flower,
  },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
