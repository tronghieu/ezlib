"use client";

/**
 * User Info Box Component
 * Displays user email and logout button
 */

import React from "react";
import { User, LogOut } from "lucide-react";
import { authUtils, useAuth } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/button";

export function UserInfoBox(): React.JSX.Element {
  const { user, loading } = useAuth();

  const handleLogout = async (): Promise<void> => {
    const { error } = await authUtils.signOut();
    if (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user || loading) {
    return <></>;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-sm mx-auto mt-5">
      {/* User information on top */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {authUtils.getUserDisplayName(user)}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* Full-width logout button below */}
      <Button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-red-600 hover:border-red-300 transition-colors duration-200"
      >
        <LogOut className="w-3 h-3" />
        <span>Logout</span>
      </Button>
    </div>
  );
}
