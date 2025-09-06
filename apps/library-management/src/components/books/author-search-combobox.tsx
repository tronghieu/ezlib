"use client";

/**
 * Author Search Combobox Component
 * Real-time author search with selection and new author trigger
 */

import React, { useState, useCallback } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, User, Book } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useAuthorSearch } from "@/lib/hooks/use-author-search";
import type { Author } from "@/lib/types/books";

interface AuthorSearchComboboxProps {
  onAuthorSelected: (author: Author) => void;
  onCreateNewAuthor: () => void;
  selectedAuthor?: Author | null;
}

export function AuthorSearchCombobox({
  onAuthorSelected,
  onCreateNewAuthor,
  selectedAuthor,
}: AuthorSearchComboboxProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: searchResults, isLoading } = useAuthorSearch(
    debouncedSearch,
    debouncedSearch.length > 2 && !selectedAuthor
  );

  const handleAuthorSelect = useCallback((authorId: string) => {
    const selectedResult = searchResults?.find((author) => author.id === authorId);
    if (selectedResult) {
      // Convert search result to full Author object
      const author: Author = {
        id: selectedResult.id,
        name: selectedResult.name,
        canonical_name: selectedResult.name.toLowerCase(),
        biography: null,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      onAuthorSelected(author);
    }
    setIsOpen(false);
    setSearchTerm("");
  }, [searchResults, onAuthorSelected]);

  const handleClearSelection = (): void => {
    onAuthorSelected({} as Author); // Reset selection
    setSearchTerm("");
    setIsOpen(true);
  };

  const showResults = debouncedSearch.length > 2 && !selectedAuthor;
  const hasResults = searchResults && searchResults.length > 0;
  const showNoResults = showResults && !isLoading && !hasResults;

  // If author is already selected, show selected state
  if (selectedAuthor) {
    return (
      <div className="space-y-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedAuthor.name}</p>
                <p className="text-xs text-muted-foreground">Selected author</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-green-700 hover:text-green-800"
            >
              Change
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Search for Authors
        </label>
        <p className="text-sm text-muted-foreground">
          Search for an existing author or create a new one.
        </p>
      </div>

      <div className="relative">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search by author name..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              onFocus={() => setIsOpen(true)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          {showResults && isOpen && (
            <CommandList className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching authors...</span>
                </div>
              ) : hasResults ? (
                <CommandGroup heading="Found Authors">
                  {searchResults.map((author) => (
                    <CommandItem
                      key={author.id}
                      onSelect={() => handleAuthorSelect(author.id)}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent"
                    >
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-sm">{author.name}</div>
                        {author.book_count && author.book_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Book className="h-3 w-3" />
                            {author.book_count} book{author.book_count === 1 ? "" : "s"}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : showNoResults ? (
                <CommandEmpty className="py-6 text-center">
                  <div className="space-y-3">
                    <UserPlus className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No authors found</p>
                      <p className="text-xs text-muted-foreground">
                        &quot;{debouncedSearch}&quot; doesn&apos;t match any existing authors
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              ) : null}
            </CommandList>
          )}
        </Command>
      </div>

      {/* Create New Author Action */}
      {showNoResults && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Author not found?</p>
              <p className="text-xs text-muted-foreground">
                Add &quot;{debouncedSearch}&quot; as a new author
              </p>
            </div>
            <Button 
              type="button"
              onClick={onCreateNewAuthor}
              size="sm"
              className="shrink-0"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Author
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!showResults && !selectedAuthor && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">How to search authors</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Type at least 3 characters to start searching</li>
                  <li>• Search by author name to find existing authors</li>
                  <li>• Select an existing author or create a new one</li>
                  <li>• Authors are shared across all libraries</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}