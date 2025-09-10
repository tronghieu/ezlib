"use client";

import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  BookOpen,
  Edit,
  UserCheck,
  UserX,
  AlertCircle,
  ArrowLeft,
  Clock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useMemberProfile } from "@/lib/hooks/use-members";
import type { MemberWithCheckouts } from "@/types/members";

interface MemberProfileProps {
  memberId: string;
  libraryId: string;
  libraryCode: string;
  canManageMembers: boolean;
}

export function MemberProfile({ memberId, libraryId, libraryCode, canManageMembers }: MemberProfileProps) {
  const { data: member, isLoading, error } = useMemberProfile(libraryId, memberId);

  if (isLoading) {
    return <MemberProfileSkeleton />;
  }

  if (error || !member) {
    return <MemberNotFound libraryCode={libraryCode} />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${libraryCode}/dashboard`}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${libraryCode}/members`}>Members</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>
            {member.personal_info.first_name} {member.personal_info.last_name}
          </BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Member Info and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${libraryCode}/members`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Members
              </Link>
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                {member.personal_info.first_name} {member.personal_info.last_name}
              </h1>
              <MemberStatusBadge status={member.status} />
            </div>
            <p className="text-muted-foreground">
              Member ID: {member.member_id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canManageMembers && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/${libraryCode}/members/${member.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit Member
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Information Card */}
        <div className="lg:col-span-2 space-y-6">
          <PersonalInfoCard member={member} />
          <CurrentCheckoutsCard member={member} />
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <MembershipInfoCard member={member} />
          <BorrowingStatsCard member={member} />
        </div>
      </div>
    </div>
  );
}

// Personal Information Card Component
function PersonalInfoCard({ member }: { member: MemberWithCheckouts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            Email
          </div>
          <p className="font-medium">{member.personal_info.email}</p>
        </div>

        {member.personal_info.phone && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Phone
            </div>
            <p className="font-medium">{member.personal_info.phone}</p>
          </div>
        )}

        {member.personal_info.address && (
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Address
            </div>
            <div className="font-medium">
              {member.personal_info.address.street && (
                <div>{member.personal_info.address.street}</div>
              )}
              {(member.personal_info.address.city || member.personal_info.address.state) && (
                <div>
                  {member.personal_info.address.city}
                  {member.personal_info.address.city && member.personal_info.address.state && ", "}
                  {member.personal_info.address.state} {member.personal_info.address.postal_code}
                </div>
              )}
              {member.personal_info.address.country && (
                <div>{member.personal_info.address.country}</div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Member Since
          </div>
          <p className="font-medium">
            {format(new Date(member.created_at), "PPP")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Membership Information Card Component
function MembershipInfoCard({ member }: { member: MemberWithCheckouts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Membership Type</p>
          <Badge variant="secondary" className="capitalize">
            {member.membership_info.type}
          </Badge>
        </div>

        {member.membership_info.expiry_date && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Expires</p>
            <p className="font-medium">
              {format(new Date(member.membership_info.expiry_date), "PPP")}
            </p>
          </div>
        )}

        {member.membership_info.notes && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{member.membership_info.notes}</p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="text-sm">
            {format(new Date(member.updated_at), "PPP 'at' pp")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Borrowing Statistics Card Component
function BorrowingStatsCard({ member }: { member: MemberWithCheckouts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Borrowing Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              {member.borrowing_stats.current_loans}
            </p>
            <p className="text-xs text-muted-foreground">Current Loans</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {member.borrowing_stats.total_books_borrowed}
            </p>
            <p className="text-xs text-muted-foreground">Total Borrowed</p>
          </div>
        </div>

        {member.borrowing_stats.overdue_items > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {member.borrowing_stats.overdue_items} Overdue Item{member.borrowing_stats.overdue_items !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Current Checkouts Card Component
function CurrentCheckoutsCard({ 
  member 
}: { 
  member: MemberWithCheckouts;
}) {
  const hasCheckouts = member.current_checkouts && member.current_checkouts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Current Checkouts
          <Badge variant="outline" className="ml-auto">
            {member.borrowing_stats.current_loans}
          </Badge>
        </CardTitle>
        <CardDescription>
          Books currently checked out by this member
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasCheckouts ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No Current Checkouts</h3>
            <p className="text-sm text-muted-foreground">
              This member doesn&apos;t have any books checked out
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {member.current_checkouts?.map((checkout) => (
              <div
                key={checkout.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{checkout.book_title}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Checked out: {format(new Date(checkout.checkout_date), "PP")}
                    </div>
                    {checkout.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {format(new Date(checkout.due_date), "PP")}
                      </div>
                    )}
                  </div>
                </div>
                <Badge
                  variant={checkout.status === "overdue" ? "destructive" : "secondary"}
                  className="capitalize"
                >
                  {checkout.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Member Status Badge Component
function MemberStatusBadge({ status }: { status: string }) {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          variant: "default" as const,
          icon: UserCheck,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "inactive":
        return {
          variant: "secondary" as const,
          icon: UserX,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
      case "banned":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          className: "",
        };
      default:
        return {
          variant: "secondary" as const,
          icon: User,
          className: "",
        };
    }
  };

  const { variant, icon: Icon, className } = getStatusConfig();

  return (
    <Badge variant={variant} className={`capitalize ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

// Loading Skeleton Component
function MemberProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <span>/</span>
        <Skeleton className="h-4 w-16" />
        <span>/</span>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

// Member Not Found Component
function MemberNotFound({ libraryCode }: { libraryCode: string }) {
  return (
    <div className="text-center py-12">
      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Member Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The member you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href={`/${libraryCode}/members`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Link>
      </Button>
    </div>
  );
}