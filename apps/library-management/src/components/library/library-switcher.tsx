"use client";

/**
 * Library Switcher Component
 * Dropdown for switching between accessible libraries
 */

import React, { useState } from "react";
import { Check, Building2, Plus, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLibraryContext } from "@/lib/contexts/library-context";
import type { LibraryWithAccess } from "@/types";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function LibrarySwitcher(): React.JSX.Element {
  const { currentLibrary, availableLibraries, selectLibrary, isLoading } =
    useLibraryContext();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [isOpen, setIsOpen] = useState(false);

  const handleLibrarySelect = (library: LibraryWithAccess) => {
    selectLibrary(library);
    setIsOpen(false);

    // Navigate to the selected library's dashboard
    window.location.href = `/${library.code}/dashboard`;
  };

  const handleBackToSelection = () => {
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!currentLibrary) {
    return (
      <Button
        onClick={handleBackToSelection}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Building2 className="h-4 w-4" />
        Select Library
      </Button>
    );
  }

  // If user has access to only one library, show simple display
  if (availableLibraries.length <= 1) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
        <Building2 className="h-5 w-5 text-gray-600" />
        {!isCollapsed && (
          <span className="text-sm font-medium text-gray-900">
            {currentLibrary.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              variant="outline"
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <div className="leading-none">
                    <span className="font-medium truncate-ellipsis">
                      {currentLibrary.name}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[280px]">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Available Libraries
            </div>

            {availableLibraries.map((library) => (
              <DropdownMenuItem
                key={library.id}
                onClick={() => handleLibrarySelect(library)}
                className="flex items-center gap-2 px-2 py-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center justify-center w-6 h-6">
                    {currentLibrary.id === library.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {library.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-mono">{library.code}</span>
                      <span>•</span>
                      <span className="capitalize">{library.user_role}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleBackToSelection}
              className="flex items-center gap-2 px-2 py-2 cursor-pointer text-gray-600"
            >
              <Plus className="h-4 w-4" />
              <span>View All Libraries</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
