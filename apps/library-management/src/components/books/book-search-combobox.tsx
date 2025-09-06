"use client";

/**
 * Book Search Combobox Component
 * Real-time search with existing book selection or new edition trigger
 */

import React, { useState, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookPlus, Book, Calendar, Info } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useBookSearch } from "@/lib/hooks/use-book-search";
import type { BookEdition } from "@/lib/types/books";

interface BookSearchComboboxProps {
  onExistingBookSelected: (edition: BookEdition) => void;
  onCreateNewEdition: () => void;
}

export function BookSearchCombobox({
  onExistingBookSelected,
  onCreateNewEdition,
}: BookSearchComboboxProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: searchResults, isLoading } = useBookSearch(
    debouncedSearch,
    debouncedSearch.length > 2
  );



  const handleBookSelect = useCallback(
    (bookId: string) => {
      const selectedBook = searchResults?.find((book) => book.id === bookId);
      if (selectedBook) {
        // Convert search result to full BookEdition for consistency
        const edition: BookEdition = {
          id: selectedBook.id,
          general_book_id: "", // Will be populated by API
          title: selectedBook.title,
          language: "en", // Default, will be corrected by API
          isbn_13: selectedBook.isbn_13 || null,
          subtitle: null,
          country: null,
          edition_metadata: selectedBook.publication_year
            ? {
                publication_date: selectedBook.publication_year.toString(),
              }
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          authors: selectedBook.authors.map((name) => ({
            id: "", // Will be populated by API
            name,
            canonical_name: name.toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        };

        onExistingBookSelected(edition);
      }
      setIsOpen(false);
    },
    [searchResults, onExistingBookSelected]
  );

  const showResults = debouncedSearch.length > 2;
  const hasResults = searchResults && searchResults.length > 0;
  const showNoResults = showResults && !isLoading && !hasResults;


  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Start typing to search for existing books, or create a new book
          edition if not found.
        </p>
      </div>

      <div className="relative">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search by book title..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            onFocus={() => setIsOpen(true)}
          />

          {showResults && (
            <CommandList className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : hasResults ? (
                <div className="p-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Found Books</div>
                  {searchResults.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookSelect(book.id)}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
                    >
                      <Book className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-sm">{book.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>by {book.authors?.join(", ") || "Unknown Author"}</span>
                          {book.publication_year && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {book.publication_year}
                              </div>
                            </>
                          )}
                          {book.isbn_13 && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                ISBN: {book.isbn_13}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : showNoResults ? (
                <CommandEmpty className="py-6 text-center">
                  <div className="space-y-3">
                    <BookPlus className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No books found</p>
                      <p className="text-xs text-muted-foreground">
                        &quot;{debouncedSearch}&quot; doesn't match any
                        existing books
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              ) : null}
            </CommandList>
          )}
        </Command>
      </div>

      {/* Create New Edition Action */}
      {showNoResults && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Book not found?</p>
              <p className="text-xs text-muted-foreground">
                Add &quot;{debouncedSearch}&quot; as a new book edition
              </p>
            </div>
            <Button onClick={onCreateNewEdition} size="sm" className="shrink-0">
              <BookPlus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!showResults && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">How to search</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Type at least 3 characters to start searching</li>
                  <li>• Search by book title to find existing editions</li>
                  <li>• Select an existing book to skip to adding copies</li>
                  <li>
                    • Create a new book if your search doesn't find matches
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
