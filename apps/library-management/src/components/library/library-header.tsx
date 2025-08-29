"use client";

/**
 * Library Header Component
 * Header with current library context and navigation
 */

import React from "react";
import Link from "next/link";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useAuthContext } from "@/lib/auth/context";
import { LibrarySwitcher } from "./library-switcher";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, User } from "lucide-react";

export function LibraryHeader(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Library Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-900"
            >
              <Building2 className="h-6 w-6 text-primary" />
              EzLib
            </Link>

            {currentLibrary && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {currentLibrary.name}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    ({currentLibrary.code})
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Center: Navigation */}
          {currentLibrary && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href={`/${currentLibrary.code}/dashboard`}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href={`/${currentLibrary.code}/books`}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Books
              </Link>
              <Link
                href={`/${currentLibrary.code}/members`}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Members
              </Link>
              <Link
                href={`/${currentLibrary.code}/circulation`}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Circulation
              </Link>
            </nav>
          )}

          {/* Right: Library Switcher and User Menu */}
          <div className="flex items-center gap-3">
            <LibrarySwitcher />

            {user && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  {user.email}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
