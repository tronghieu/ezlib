"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User, Calendar, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCirculationHistory } from "@/lib/hooks/use-circulation-history";

interface CirculationHistoryProps {
  bookCopyId: string;
  libraryId: string;
}

function getTransactionStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "active":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "overdue":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "returned":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function getTransactionTypeIcon(type: string): React.JSX.Element {
  switch (type) {
    case "borrow":
      return <User className="h-4 w-4" />;
    case "return":
      return <CheckCircle className="h-4 w-4" />;
    case "renew":
      return <Clock className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

export function CirculationHistory({
  bookCopyId,
  libraryId,
}: CirculationHistoryProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: history, isLoading, error } = useCirculationHistory(bookCopyId, libraryId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="space-y-1">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Failed to load circulation history.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No circulation history available.</p>
        <p className="text-sm text-muted-foreground mt-1">
          This book copy has never been borrowed.
        </p>
      </div>
    );
  }

  // Show first 3 transactions by default, rest in collapsible section
  const recentHistory = history.slice(0, 3);
  const olderHistory = history.slice(3);

  return (
    <div className="space-y-3">
      {/* Recent History (always visible) */}
      {recentHistory.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getTransactionTypeIcon(transaction.transaction_type)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">
                  {transaction.transaction_type}
                </span>
                <Badge className={getTransactionStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {transaction.library_member?.personal_info?.full_name || "Unknown Member"}
                {transaction.library_member?.member_id && (
                  <span className="ml-2 font-mono text-xs">
                    #{transaction.library_member.member_id}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-medium">
              {new Date(transaction.transaction_date).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {transaction.due_date && (
                <>
                  Due: {new Date(transaction.due_date).toLocaleDateString()}
                </>
              )}
              {transaction.return_date && (
                <>
                  Returned: {new Date(transaction.return_date).toLocaleDateString()}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Older History (collapsible) */}
      {olderHistory.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide {olderHistory.length} older transactions
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show {olderHistory.length} older transactions
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {olderHistory.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getTransactionTypeIcon(transaction.transaction_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {transaction.transaction_type}
                      </span>
                      <Badge className={getTransactionStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.library_member?.personal_info?.full_name || "Unknown Member"}
                      {transaction.library_member?.member_id && (
                        <span className="ml-2 font-mono text-xs">
                          #{transaction.library_member.member_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {transaction.due_date && (
                      <>
                        Due: {new Date(transaction.due_date).toLocaleDateString()}
                      </>
                    )}
                    {transaction.return_date && (
                      <>
                        Returned: {new Date(transaction.return_date).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Summary Stats */}
      <div className="pt-3 border-t">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Total Circulation Events:</span>
          <span className="font-medium">{history.length}</span>
        </div>
      </div>
    </div>
  );
}