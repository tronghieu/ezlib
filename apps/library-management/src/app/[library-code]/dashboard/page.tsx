"use client";

/**
 * Library Dashboard Page
 * Main dashboard for library operations and statistics with enhanced layout
 */

import React from "react";
import { useLibraryContext } from "@/lib/contexts/library-context";
import {
  useLibraryStats,
  useLibraryTransactions,
} from "@/lib/hooks/use-library-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Book,
  Users,
  ArrowRightLeft,
  TrendingUp,
  Plus,
  UserPlus,
  Scan,
  Clock,
} from "lucide-react";
import type { Json } from "@/lib/types/database";

export default function LibraryDashboardPage(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const { stats, isLoading: statsLoading } = useLibraryStats();
  const { transactions, isLoading: transactionsLoading } =
    useLibraryTransactions();

  if (!currentLibrary) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No library selected</p>
      </div>
    );
  }

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your library operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Books"
          value={stats.totalBooks}
          icon={<Book className="h-4 w-4" />}
          isLoading={statsLoading}
          description="Books in inventory"
        />
        <StatsCard
          title="Active Members"
          value={stats.activeMembers}
          icon={<Users className="h-4 w-4" />}
          isLoading={statsLoading}
          description="Registered members"
        />
        <StatsCard
          title="Checked Out"
          value={stats.currentCheckouts}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          isLoading={statsLoading}
          description="Currently borrowed"
        />
        <StatsCard
          title="Library Score"
          value="95%"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={false}
          description="Performance rating"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                title="Add Book"
                icon={<Plus className="h-4 w-4" />}
                href={`/${currentLibrary.code}/books/add`}
                description="Add new book to inventory"
              />
              <QuickActionButton
                title="Register Member"
                icon={<UserPlus className="h-4 w-4" />}
                href={`/${currentLibrary.code}/members/add`}
                description="Register new library member"
              />
              <QuickActionButton
                title="Quick Checkout"
                icon={<Scan className="h-4 w-4" />}
                href={`/${currentLibrary.code}/circulation/checkout`}
                description="Process book checkout"
              />
              <QuickActionButton
                title="Return Books"
                icon={<ArrowRightLeft className="h-4 w-4" />}
                href={`/${currentLibrary.code}/circulation/checkin`}
                description="Process book returns"
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <RecentActivityItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">
                    Activity will appear here as operations are performed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading: boolean;
  description?: string;
}

function StatsCard({
  title,
  value,
  icon,
  isLoading,
  description,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickActionButton({
  title,
  description,
  href,
  icon,
}: QuickActionButtonProps) {
  return (
    <Button variant="ghost" className="w-full justify-start h-auto p-4" asChild>
      <a href={href}>
        <div className="flex items-start gap-3 text-left">
          <div className="mt-0.5 text-muted-foreground">{icon}</div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
      </a>
    </Button>
  );
}

interface RecentActivityItemProps {
  transaction: {
    id: string;
    transaction_type: string;
    created_at: string;
    book_copies?: {
      book_editions?: {
        title?: string;
      } | null;
    } | null;
    library_members?: {
      personal_info?: Json;
    } | null;
  };
}

function RecentActivityItem({ transaction }: RecentActivityItemProps) {
  const getTransactionDisplay = () => {
    const bookTitle =
      transaction.book_copies?.book_editions?.title || "Unknown Book";
    const memberInfo = transaction.library_members?.personal_info;

    // Safely extract member name from Json type
    let memberName = "Unknown Member";
    if (
      memberInfo &&
      typeof memberInfo === "object" &&
      !Array.isArray(memberInfo) &&
      memberInfo !== null
    ) {
      const info = memberInfo as { full_name?: string; first_name?: string };
      memberName = info.full_name || info.first_name || "Unknown Member";
    }

    const isCheckout = transaction.transaction_type === "checkout";

    return {
      action: isCheckout ? "checked out" : "returned",
      member: memberName,
      book: bookTitle,
      icon: isCheckout ? (
        <ArrowRightLeft className="h-4 w-4" />
      ) : (
        <Book className="h-4 w-4" />
      ),
      time: new Date(transaction.created_at).toLocaleDateString(),
    };
  };

  const display = getTransactionDisplay();

  return (
    <div className="flex items-start space-x-3">
      <div className="mt-1 text-muted-foreground">{display.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{display.member}</span> {display.action}{" "}
          <span className="font-medium">{display.book}</span>
        </p>
        <p className="text-xs text-muted-foreground">{display.time}</p>
      </div>
    </div>
  );
}
