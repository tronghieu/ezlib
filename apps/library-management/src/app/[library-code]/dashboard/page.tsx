"use client";

/**
 * Library Dashboard Page
 * Main dashboard for library operations and statistics
 */

import React from "react";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useLibraryStats } from "@/lib/hooks/use-library-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Users, ArrowRightLeft, TrendingUp } from "lucide-react";

export default function LibraryDashboardPage(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const { stats, isLoading: statsLoading } = useLibraryStats();

  if (!currentLibrary) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">No library selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {currentLibrary.name}
        </h1>
        <p className="text-gray-600">
          Your role:{" "}
          <span className="font-medium capitalize">
            {currentLibrary.user_role}
          </span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Books"
          value={stats.totalBooks}
          icon={<Book className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Active Members"
          value={stats.activeMembers}
          icon={<Users className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Current Checkouts"
          value={stats.currentCheckouts}
          icon={<ArrowRightLeft className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Library Score"
          value="95%"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={false}
          subtitle="Performance"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          title="Manage Books"
          description="Add, edit, or remove books from your library inventory"
          href={`/${currentLibrary.code}/books`}
          buttonText="Go to Books"
        />
        <QuickActionCard
          title="Manage Members"
          description="Register new members or update existing member information"
          href={`/${currentLibrary.code}/members`}
          buttonText="Go to Members"
        />
        <QuickActionCard
          title="Circulation"
          description="Check out books, process returns, and manage renewals"
          href={`/${currentLibrary.code}/circulation`}
          buttonText="Go to Circulation"
        />
      </div>

      {/* Library Information */}
      <Card>
        <CardHeader>
          <CardTitle>Library Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Library Details
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Code:</span>{" "}
                  {currentLibrary.code}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{currentLibrary.status}</span>
                </p>
                <p>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(currentLibrary.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Access</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  <span className="capitalize">{currentLibrary.user_role}</span>
                </p>
                <p>
                  <span className="font-medium">Staff Status:</span>{" "}
                  <span className="capitalize">
                    {currentLibrary.staff_status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading: boolean;
  subtitle?: string;
}

function StatsCard({
  title,
  value,
  icon,
  isLoading,
  subtitle,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}

function QuickActionCard({
  title,
  description,
  href,
  buttonText,
}: QuickActionCardProps) {
  return (
    <Card className="transition-colors hover:bg-gray-50">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <a
          href={href}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
        >
          {buttonText}
        </a>
      </CardContent>
    </Card>
  );
}
