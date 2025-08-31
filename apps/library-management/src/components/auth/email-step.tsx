"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

interface EmailStepProps {
  onEmailSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string;
  debugInfo?: string;
}

export function EmailStep({
  onEmailSubmit,
  isLoading,
  error,
  debugInfo = "",
}: EmailStepProps) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError("");

    // Validate email format
    const validationResult = loginSchema.safeParse({ email });
    if (!validationResult.success) {
      setValidationError(validationResult.error.issues[0].message);
      return;
    }

    await onEmailSubmit(email);
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Library Management
          </CardTitle>
          <CardDescription>
            Sign in with your existing EzLib account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yourlibrary.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                autoComplete="email"
                autoFocus
              />
            </div>

            {displayError && (
              <Alert variant="destructive">
                <p>{displayError}</p>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <div>
                <p className="font-medium">New to EzLib?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need to register on the main platform first.{" "}
                  <a
                    href="https://ezlib.com/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Create your account on ezlib.com
                  </a>
                </p>
              </div>
            </Alert>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>

          {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Debug Information (Development Mode)
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {debugInfo}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
