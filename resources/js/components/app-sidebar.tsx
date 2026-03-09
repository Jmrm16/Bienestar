'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
  BookOpen,
  Folder,
  LayoutGrid,
  Users,
  Layers,
  Flower,
  ChevronDown,
  Stethoscope ,
  Volleyball,
  PersonStanding,
  Receipt
} from 'lucide-react';
import AppLogo from './app-logo';
import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';

const mainNavItems: NavItem[] = [
  {
    title: 'Panel de control',
    url: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: 'Permanencia y Graduación',
    icon: Users,
    children: [
      {
        title: 'Informes',
        url: '/reportes/periodos',
        icon: BookOpen,
      },
      {
        title: 'Asignaturas',
        url: '/asignaturas',
        icon: BookOpen,
      },
      {
        title: 'Tutores',
        url: '/tutores',
        icon: Users,
      },
      {
        title: 'Carreras',
        url: '/carreras',
        icon: Folder,
      },

      {
        title: 'Notas',
        url: '/notas',
        icon: BookOpen,
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
    {
    title: 'Salud',
    url : '/salud',
    icon: Stethoscope 

   
  },

  {
    title: 'Deporte',
    url  : '/deportes',
    icon: Volleyball

  },
  
 
];

const footerNavItems: NavItem[] = [];

// Componente principal de navegación fijo
function NavMainFixed({ items }: { items: NavItem[] }) {
  const { url } = usePage();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  // Determinar qué submenús deben estar abiertos basado en la URL actual
  const shouldBeOpenTitles = useMemo(() => {
    const openTitles = new Set<string>();
    
    items.forEach(item => {
      if (item.children) {
        // Verificar si la URL actual coincide con algún hijo
        const hasActiveChild = item.children.some(child => {
          if (!child.url) return false;
          
          // Para dashboard, coincidencia exacta
          if (child.url === '/dashboard') {
            return url === '/dashboard';
          }
          
          // Para otras rutas, verificar si la URL comienza con la ruta del hijo
          return url.startsWith(child.url);
        });
        
        if (hasActiveChild && !isCollapsed) {
          openTitles.add(item.title);
        }
      }
    });
    
    return Array.from(openTitles);
  }, [url, items, isCollapsed]);

  // Inicializar submenús abiertos basado en la URL actual
  useEffect(() => {
    if (isCollapsed) {
      setOpenSubmenus(new Set());
    } else {
      setOpenSubmenus(new Set(shouldBeOpenTitles));
    }
  }, [shouldBeOpenTitles, isCollapsed]);

  // Verificar si un ítem está activo (para ítems sin hijos)
  const isItemActive = (item: NavItem): boolean => {
    if (!item.url) return false;
    
    if (item.url === '/dashboard') {
      return url === '/dashboard';
    }
    
    return url.startsWith(item.url);
  };

  // Verificar si un hijo está activo
  const isChildActive = (child: NavItem): boolean => {
    if (!child.url) return false;
    
    if (child.url === '/dashboard') {
      return url === '/dashboard';
    }
    
    return url.startsWith(child.url);
  };

  // Alternar submenú (abrir/cerrar)
  const toggleSubmenu = (title: string) => {
    if (isCollapsed) return;
    
    setOpenSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          {item.children ? (
            <>
              <button
                onClick={() => toggleSubmenu(item.title)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  openSubmenus.has(item.title) || isItemActive(item)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.title}</span>
                    <ChevronDown
                      className={clsx(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        openSubmenus.has(item.title) && 'rotate-180'
                      )}
                    />
                  </>
                )}
              </button>
              
              {!isCollapsed && openSubmenus.has(item.title) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.title}
                      href={child.url || ''}
                      className={clsx(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isChildActive(child)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground'
                      )}
                      prefetch
                    >
                      {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <SidebarMenuButton
              asChild
              isActive={isItemActive(item)}
              tooltip={isCollapsed ? item.title : undefined}
            >
              <Link href={item.url || ''} prefetch>
                {item.icon && <item.icon className="h-4 w-4" />}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </div>
  );
}

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
        <SidebarMenu>
          <NavMainFixed items={mainNavItems} />
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}