"use client";

/**
 * Library Dashboard Header
 * Header component with breadcrumbs, library context, and user information
 */

import React from "react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function LibraryHeader(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const pathname = usePathname();

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!currentLibrary) return [];

    const pathSegments = pathname.split("/").filter(Boolean);
    const libraryCode = pathSegments[0];
    const section = pathSegments[1] || "dashboard";
    const subsection = pathSegments[2];

    const items: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        href: `/${libraryCode}/dashboard`,
      },
    ];

    // Add section breadcrumb
    const sectionLabels: Record<string, string> = {
      dashboard: "Dashboard",
      inventory: "Inventory",
      members: "Members",
      circulation: "Circulation",
      reports: "Reports",
      settings: "Settings",
      search: "Search",
    };

    if (section && section !== "dashboard") {
      items.push({
        label: sectionLabels[section] || section,
        href: subsection ? `/${libraryCode}/${section}` : undefined,
      });
    }

    // Add subsection if exists
    if (subsection) {
      const subsectionLabels: Record<string, string> = {
        add: "Add New",
        edit: "Edit",
        checkout: "Checkout",
        checkin: "Check In",
        history: "History",
      };

      items.push({
        label: subsectionLabels[subsection] || subsection,
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem
                  className={index === 0 ? "hidden md:block" : ""}
                >
                  {item.href && index < breadcrumbItems.length - 1 ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Actions */}
      <div className="ml-auto flex items-center gap-2 px-4">
        {/* Global Search - Placeholder for future implementation */}
        <div className="relative hidden md:flex max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search books, members..."
            className="pl-9 bg-muted/50"
            disabled // Will be enabled when search functionality is implemented
          />
        </div>

        {/* Notifications - Placeholder for future implementation */}
        <Button variant="ghost" size="icon" disabled>
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
}
