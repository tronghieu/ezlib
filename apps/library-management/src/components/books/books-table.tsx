"use client";

/**
 * Books Table Component
 * Ultra-simple data table with search, pagination, sorting and status indicators
 */

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useBooks, useBookSearch } from "@/lib/hooks/use-books";
import { cn } from "@/lib/utils";

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  isbn: string;
  status: "available" | "checked_out";
  availability: {
    status: string;
    count: number;
  };
}

interface BooksTableProps {
  className?: string;
}

type SortField = "title" | "author";
type SortOrder = "asc" | "desc";

export function BooksTable({ className }: BooksTableProps): React.JSX.Element {
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Data fetching
  const {
    books,
    isLoading,
    error,
    totalCount,
  } = useBooks({
    page: currentPage,
    pageSize,
    sortBy: sortField,
    sortOrder,
  });

  const { searchResults, isSearching } = useBookSearch({
    query: searchQuery,
    enabled: searchQuery.length > 0,
  });

  // Use search results if searching, otherwise use paginated books
  const displayBooks = searchQuery.length > 0 ? searchResults : books;
  const totalPages = Math.ceil((searchQuery.length > 0 ? searchResults.length : totalCount) / pageSize);

  // Pagination helpers
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Paginate search results client-side if needed
  const paginatedDisplayBooks = useMemo(() => {
    if (searchQuery.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      return displayBooks.slice(startIndex, startIndex + pageSize);
    }
    return displayBooks;
  }, [displayBooks, currentPage, pageSize, searchQuery]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load books</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || "An error occurred while fetching books"}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort("title")}
                >
                  <span className="mr-2">Title</span>
                  {renderSortIcon("title")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort("author")}
                >
                  <span className="mr-2">Author</span>
                  {renderSortIcon("author")}
                </Button>
              </TableHead>
              <TableHead>Publisher</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isSearching ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedDisplayBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchQuery.length > 0 ? (
                    <div>
                      <p className="text-muted-foreground">No books found for &quot;{searchQuery}&quot;</p>
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground">No books in inventory</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get started by adding your first book
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedDisplayBooks.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.publisher || "—"}</TableCell>
                  <TableCell>{book.publicationYear || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{book.isbn || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={book.status}
                      count={book.availability?.count}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to{" "}
            {Math.min(currentPage * pageSize, searchQuery.length > 0 ? searchResults.length : totalCount)}{" "}
            of {searchQuery.length > 0 ? searchResults.length : totalCount} books
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={!canGoPrevious}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={!canGoNext}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: "available" | "checked_out";
  count?: number;
}

function StatusBadge({ status, count }: StatusBadgeProps): React.JSX.Element {
  const isAvailable = status === "available";
  
  return (
    <Badge
      variant={isAvailable ? "default" : "destructive"}
      className={cn(
        isAvailable
          ? "bg-green-50 text-green-600 hover:bg-green-50"
          : "bg-red-50 text-red-600 hover:bg-red-50"
      )}
    >
      {isAvailable ? "Available" : "Checked Out"}
      {count !== undefined && count > 0 && ` (${count})`}
    </Badge>
  );
}