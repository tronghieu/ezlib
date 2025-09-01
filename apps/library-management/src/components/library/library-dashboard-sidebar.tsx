"use client";

/**
 * Library Dashboard Sidebar Navigation
 * Sidebar navigation component for library management with permission-based filtering
 */

import React from "react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-context";
import {
  Book,
  Users,
  ArrowRightLeft,
  BarChart3,
  Settings,
  Home,
  Search,
  BookOpen,
  UserCheck,
  Package,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { LibrarySwitcher } from "@/components/library/library-switcher";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  requiredPermissions?: string[];
}

export function LibraryDashboardSidebar(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const pathname = usePathname();

  if (!currentLibrary) {
    return <div>Loading...</div>;
  }

  // Main navigation items with permission requirements
  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      href: `/${currentLibrary.code}/dashboard`,
      icon: Home,
      description: "Library overview and statistics",
    },
    {
      title: "Inventory",
      href: `/${currentLibrary.code}/inventory`,
      icon: Book,
      description: "Manage book collection",
      requiredPermissions: ["books.view"],
    },
    {
      title: "Members",
      href: `/${currentLibrary.code}/members`,
      icon: Users,
      description: "Member registration and management",
      requiredPermissions: ["members.view"],
    },
    {
      title: "Circulation",
      href: `/${currentLibrary.code}/circulation`,
      icon: ArrowRightLeft,
      description: "Check-in/out and renewals",
      requiredPermissions: ["transactions.create"],
    },
    {
      title: "Reports",
      href: `/${currentLibrary.code}/reports`,
      icon: BarChart3,
      description: "Analytics and reports",
      requiredPermissions: ["reports.view"],
    },
  ];

  // Quick access items
  const quickAccessItems: NavItem[] = [
    {
      title: "Search",
      href: `/${currentLibrary.code}/search`,
      icon: Search,
      description: "Search books and members",
    },
    {
      title: "Add Book",
      href: `/${currentLibrary.code}/inventory/add`,
      icon: BookOpen,
      description: "Add new book to inventory",
      requiredPermissions: ["books.create"],
    },
    {
      title: "Register Member",
      href: `/${currentLibrary.code}/members/add`,
      icon: UserCheck,
      description: "Register new library member",
      requiredPermissions: ["members.create"],
    },
    {
      title: "Quick Checkout",
      href: `/${currentLibrary.code}/circulation/checkout`,
      icon: Package,
      description: "Quick book checkout",
      requiredPermissions: ["transactions.create"],
    },
  ];

  // Settings and admin items
  const settingsItems: NavItem[] = [
    {
      title: "Settings",
      href: `/${currentLibrary.code}/settings`,
      icon: Settings,
      description: "Library configuration",
      requiredPermissions: ["settings.manage"],
    },
  ];

  // Filter items based on user permissions
  const filterByPermissions = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.requiredPermissions) return true;
      // For now, show all items - permission system can be enhanced later
      // TODO: Implement proper permission checking based on currentLibrary.user_role
      return true;
    });
  };

  const filteredNavigation = filterByPermissions(navigationItems);
  const filteredQuickAccess = filterByPermissions(quickAccessItems);
  const filteredSettings = filterByPermissions(settingsItems);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <LibrarySwitcher />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Access */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredQuickAccess.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSettings.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
