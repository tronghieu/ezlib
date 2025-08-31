"use client";

/**
 * Library Card Component
 * Displays library information with role and access details
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Building2 } from "lucide-react";
import type { LibraryWithAccess } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LibraryCardProps {
  library: LibraryWithAccess;
  onClick?: (library: LibraryWithAccess) => void;
  isSelected?: boolean;
  className?: string;
}

export function LibraryCard({
  library,
  onClick,
  isSelected = false,
  className,
}: LibraryCardProps): React.JSX.Element {
  const handleClick = () => {
    if (onClick) {
      onClick(library);
    }
  };

  const address = library.address as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;

  const formatAddress = (addr: typeof address): string => {
    if (!addr) return "Address not available";

    const parts = [addr.city, addr.state, addr.country].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Address not available";
  };

  const stats = library.stats as {
    total_books?: number;
    active_members?: number;
  } | null;

  const formatRole = (role: string | undefined): string => {
    if (!role) return "User";

    switch (role) {
      case "owner":
        return "Owner";
      case "manager":
        return "Manager";
      case "librarian":
        return "Librarian";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "librarian":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
        "border-2 hover:border-primary/50",
        isSelected && "border-primary shadow-md",
        onClick && "hover:bg-accent/50",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
              {library.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="font-mono font-medium">{library.code}</span>
            </div>
          </div>
          <Badge className={getRoleColor(library.user_role)}>
            {formatRole(library.user_role)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">{formatAddress(address)}</span>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex gap-4 text-sm">
              {typeof stats.total_books === "number" && (
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="font-medium text-gray-900">
                    {stats.total_books.toLocaleString()}
                  </span>
                  <span>books</span>
                </div>
              )}
              {typeof stats.active_members === "number" && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-gray-900">
                    {stats.active_members.toLocaleString()}
                  </span>
                  <span>members</span>
                </div>
              )}
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>
              Member since {new Date(library.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  library.status === "active" ? "bg-green-500" : "bg-yellow-500"
                )}
              />
              <span className="text-xs text-gray-600 capitalize">
                {library.status}
              </span>
            </div>
            {onClick && (
              <div className="text-xs text-gray-400">Click to select →</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
