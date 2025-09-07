import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookNotFound(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Book Copy Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The book copy you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="default" asChild>
              <Link href="../">
                <ChevronLeft className="h-4 w-4" />
                Back to Books
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}