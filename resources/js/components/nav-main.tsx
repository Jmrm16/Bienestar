import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from '@/components/ui/sidebar';
  import { type NavItem } from '@/types';
  import { Link, usePage } from '@inertiajs/react';
  import { ChevronDown } from 'lucide-react';
  import { useState } from 'react';
  
  export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { url: currentUrl } = usePage();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
    const toggleDropdown = (title: string) => {
      setOpenDropdown((prev) => (prev === title ? null : title));
    };
  
    return (
      <SidebarGroup className="px-2 py-0">
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url === currentUrl;
            const hasChildren = item.children && item.children.length > 0;
  
            return (
              <SidebarMenuItem key={item.title}>
                {hasChildren ? (
                  <>
                    <SidebarMenuButton onClick={() => toggleDropdown(item.title)}>
                      {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform ${
                          openDropdown === item.title ? 'rotate-180' : ''
                        }`}
                      />
                    </SidebarMenuButton>
                    {openDropdown === item.title && (
                      <div className="ml-6 mt-1 space-y-1">
                        {hasChildren &&
                          item.children!.map((child) => (
                            <SidebarMenuButton
                              key={child.title}
                              asChild
                              isActive={child.url === currentUrl}
                            >
                              <Link
                                href={child.url!}
                                prefetch
                                className="text-sm text-muted-foreground hover:text-primary"
                              >
                                {child.title}
                              </Link>
                            </SidebarMenuButton>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url!} prefetch>
                      {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }
  