"use client";

/**
 * Add Book Workflow Component
 * Progressive workflow: Search → Edition → Author → Copies
 */

import React from "react";
import { useState } from "react";
import { BookSearchCombobox } from "./book-search-combobox";
import { AddEditionForm } from "./add-edition-form";
import { AddCopiesForm } from "./add-copies-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookPlus, Package, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { toast } from "sonner";
import type { BookEdition } from "@/lib/types/books";

interface AddBookWorkflowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type WorkflowStep = "search" | "edition" | "copies" | "complete";

export function AddBookWorkflow({
  onComplete,
  onCancel,
}: AddBookWorkflowProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("search");
  const [selectedEdition, setSelectedEdition] = useState<BookEdition | null>(null);
  const [createdEdition, setCreatedEdition] = useState<BookEdition | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>("");
  const queryClient = useQueryClient();
  const { currentLibrary } = useLibraryContext();

  // Get the edition to use for copies (either selected existing or newly created)
  const editionForCopies = selectedEdition || createdEdition;

  const handleExistingBookSelected = (edition: BookEdition): void => {
    setSelectedEdition(edition);
    setCurrentStep("copies");
  };

  const handleCreateNewEdition = (suggestedTitle?: string): void => {
    setSuggestedTitle(suggestedTitle || "");
    setCurrentStep("edition");
  };

  const handleEditionCreated = (edition: BookEdition): void => {
    setCreatedEdition(edition);
    setCurrentStep("copies");
  };

  const handleCopiesCreated = (): void => {
    setCurrentStep("complete");
    
    // Invalidate relevant queries to refresh data
    if (currentLibrary) {
      // Invalidate library book listings
      queryClient.invalidateQueries({
        queryKey: ["library-books", currentLibrary.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["books", currentLibrary.id],
      });
      
      // Invalidate book search results
      queryClient.invalidateQueries({
        queryKey: ["book-search"],
      });
      
      // Invalidate library statistics
      queryClient.invalidateQueries({
        queryKey: ["library-stats", currentLibrary.id],
      });
      
      // Invalidate edition counts for performance queries
      queryClient.invalidateQueries({
        queryKey: ["library-edition-counts", currentLibrary.id],
      });
    }
    
    // Show success toast
    const editionTitle = editionForCopies?.title || "Book";
    toast.success(`${editionTitle} added successfully!`, {
      description: "The book has been added to your library inventory.",
      duration: 5000,
    });

    // Show success screen for a moment, then complete
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleStartOver = (): void => {
    setCurrentStep("search");
    setSelectedEdition(null);
    setCreatedEdition(null);
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step) {
      case "search":
        return <Search className="h-4 w-4" />;
      case "edition":
        return <BookPlus className="h-4 w-4" />;
      case "copies":
        return <Package className="h-4 w-4" />;
      case "complete":
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStepTitle = (step: WorkflowStep) => {
    switch (step) {
      case "search":
        return "Search Books";
      case "edition":
        return "Add Book Edition";
      case "copies":
        return "Add Copies";
      case "complete":
        return "Complete";
    }
  };

  const isStepActive = (step: WorkflowStep) => step === currentStep;
  const isStepCompleted = (step: WorkflowStep) => {
    const stepOrder = ["search", "edition", "copies", "complete"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    return stepIndex < currentIndex || (step === "search" && (selectedEdition || createdEdition));
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 px-4">
          {(["search", "edition", "copies", "complete"] as const).map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <div
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isStepCompleted(step)
                      ? "bg-primary border-primary text-primary-foreground"
                      : isStepActive(step)
                      ? "border-primary text-primary bg-background"
                      : "border-muted-foreground/25 text-muted-foreground bg-background"
                  }`}
                >
                  <div className="h-3 w-3 sm:h-4 sm:w-4">
                    {getStepIcon(step)}
                  </div>
                </div>
                <Badge
                  variant={isStepActive(step) ? "default" : "outline"}
                  className="text-xs whitespace-nowrap"
                >
                  {getStepTitle(step)}
                </Badge>
              </div>
              {index < 3 && (
                <div
                  className={`h-0.5 w-4 sm:w-6 transition-colors flex-shrink-0 ${
                    isStepCompleted(step) ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStepIcon(currentStep)}
            {currentStep === "search" && "Search for Books"}
            {currentStep === "edition" && "Add New Book Edition"}
            {currentStep === "copies" && "Add Book Copies"}
            {currentStep === "complete" && "Success!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === "search" && (
            <BookSearchCombobox
              onExistingBookSelected={handleExistingBookSelected}
              onCreateNewEdition={handleCreateNewEdition}
            />
          )}

          {currentStep === "edition" && (
            <AddEditionForm
              suggestedTitle={suggestedTitle}
              onEditionCreated={handleEditionCreated}
              onCancel={() => setCurrentStep("search")}
            />
          )}

          {currentStep === "copies" && editionForCopies && (
            <AddCopiesForm
              edition={editionForCopies}
              onCopiesCreated={handleCopiesCreated}
              onCancel={() => setCurrentStep("search")}
            />
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Book Added Successfully!</h3>
                <p className="text-muted-foreground">
                  &quot;{editionForCopies?.title}&quot; has been added to {currentLibrary?.name}&apos;s inventory and is now available for borrowing.
                </p>
                {editionForCopies?.authors?.[0] && (
                  <p className="text-sm text-muted-foreground">
                    by {editionForCopies.authors[0].name}
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={handleStartOver} variant="outline">
                  Add Another Book
                </Button>
                <Button onClick={onComplete}>
                  View Books
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Action (only show on search step) */}
          {currentStep === "search" && (
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}