"use client";

/**
 * Library Dashboard Sidebar Navigation
 * Sidebar navigation component for library management with role-based filtering
 */

import React from "react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-provider";
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
}

export function LibrarySidebar(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const pathname = usePathname();

  if (!currentLibrary) {
    return <>...</>;
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
      href: `/${currentLibrary.code}/books`,
      icon: Book,
      description: "Manage book collection",
    },
    {
      title: "Members",
      href: `/${currentLibrary.code}/members`,
      icon: Users,
      description: "Member registration and management",
    },
    {
      title: "Circulation",
      href: `/${currentLibrary.code}/circulation`,
      icon: ArrowRightLeft,
      description: "Check-in/out and renewals",
    },
    {
      title: "Reports",
      href: `/${currentLibrary.code}/reports`,
      icon: BarChart3,
      description: "Analytics and reports",
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
      href: `/${currentLibrary.code}/books/add`,
      icon: BookOpen,
      description: "Add new book to inventory",
    },
    {
      title: "Register Member",
      href: `/${currentLibrary.code}/members/add`,
      icon: UserCheck,
      description: "Register new library member",
    },
    {
      title: "Quick Checkout",
      href: `/${currentLibrary.code}/circulation/checkout`,
      icon: Package,
      description: "Quick book checkout",
    },
  ];

  // Settings and admin items
  const settingsItems: NavItem[] = [
    {
      title: "Settings",
      href: `/${currentLibrary.code}/settings`,
      icon: Settings,
      description: "Library configuration",
    },
  ];

  // Show all navigation items - role-based access control is handled at the page level

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
              {navigationItems.map((item) => (
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
              {quickAccessItems.map((item) => (
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
              {settingsItems.map((item) => (
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
