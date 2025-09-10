"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembers } from "@/lib/hooks/use-members";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { MemberStatus, MembershipType } from "@/types/members";

interface MembersTableProps {
  libraryId: string;
  libraryCode: string;
  canManageMembers: boolean;
}

export function MembersTable({
  libraryId,
  libraryCode,
  canManageMembers,
}: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<MembershipType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const searchParams = {
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    membership_type: membershipTypeFilter !== "all" ? membershipTypeFilter : undefined,
    page: currentPage,
    limit: 20,
  };

  const { data: membersData, isLoading, error } = useMembers(libraryId, searchParams);

  const getStatusBadge = (status: MemberStatus) => {
    const variants = {
      active: "default" as const,
      inactive: "secondary" as const,
      banned: "destructive" as const,
    };
    
    const labels = {
      active: "Active",
      inactive: "Inactive", 
      banned: "Banned",
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getMembershipTypeBadge = (type: MembershipType) => {
    const variants = {
      regular: "outline" as const,
      student: "secondary" as const,
      senior: "secondary" as const,
    };

    return (
      <Badge variant={variants[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatMemberName = (personalInfo: { first_name: string; last_name: string }) => {
    return `${personalInfo.first_name} ${personalInfo.last_name}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setMembershipTypeFilter("all");
    setCurrentPage(1);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading members: {error.message}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage library members and their information
          </p>
        </div>
        {canManageMembers && (
          <Button asChild>
            <Link href={`/${libraryCode}/members/add`}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Member
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by member ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as MemberStatus | "all")}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={membershipTypeFilter}
                onValueChange={(value) => setMembershipTypeFilter(value as MembershipType | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : !membersData?.members.length ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || membershipTypeFilter !== "all"
                  ? "No members match your search criteria."
                  : "Get started by adding your first member."}
              </p>
              {canManageMembers && (
                <Button asChild>
                  <Link href={`/${libraryCode}/members/add`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Member
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Loans</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersData.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono">
                        {member.member_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatMemberName(member.personal_info)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.personal_info.email}
                      </TableCell>
                      <TableCell>
                        {getMembershipTypeBadge(member.membership_info.type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(member.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {member.borrowing_stats.current_loans}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${libraryCode}/members/${member.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            {canManageMembers && (
                              <DropdownMenuItem asChild>
                                <Link href={`/${libraryCode}/members/${member.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Member
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {membersData && membersData.members.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 20) + 1} to{" "}
                {Math.min(currentPage * 20, membersData.total)} of{" "}
                {membersData.total} members
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {Math.ceil(membersData.total / 20)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!membersData.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}