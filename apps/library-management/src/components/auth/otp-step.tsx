"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, Shield } from "lucide-react";
import { z } from "zod";

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
});

interface OtpStepProps {
  email: string;
  onOtpSubmit: (otp: string) => Promise<void>;
  onBackToEmail: () => void;
  isLoading: boolean;
  error: string;
  debugInfo?: string;
  onDebugLog?: (message: string, data?: unknown) => void;
}

export function OtpStep({
  email,
  onOtpSubmit,
  onBackToEmail,
  isLoading,
  error,
  debugInfo = "",
  onDebugLog,
}: OtpStepProps) {
  const [otp, setOtp] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submissionStartTime, setSubmissionStartTime] = useState<number | null>(
    null
  );
  const [loadingMessage, setLoadingMessage] = useState("Verifying...");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleOtpSubmit = useCallback(
    async (otpValue?: string) => {
      // Prevent multiple submissions
      if (hasSubmitted || isLoading) {
        onDebugLog?.(
          `OTP component: Skipping submission - already in progress`
        );
        return;
      }

      const codeToVerify = otpValue || otp;
      setValidationError("");
      setSubmissionStartTime(Date.now());
      setLoadingMessage("Verifying...");
      setHasSubmitted(true);

      onDebugLog?.(
        `OTP component: Starting verification for code: ${codeToVerify.substring(0, 2)}***`
      );

      // Validate OTP format
      const validationResult = otpSchema.safeParse({ otp: codeToVerify });
      if (!validationResult.success) {
        onDebugLog?.(
          `OTP component: Validation failed - ${validationResult.error.issues[0].message}`
        );
        setValidationError(validationResult.error.issues[0].message);
        setSubmissionStartTime(null);
        setHasSubmitted(false);
        return;
      }

      try {
        await onOtpSubmit(codeToVerify);
      } catch (error) {
        onDebugLog?.(`OTP component: Submission error - ${error}`);
        setSubmissionStartTime(null);
        setHasSubmitted(false);
      }
    },
    [otp, onOtpSubmit, onDebugLog, hasSubmitted, isLoading]
  );

  // Reset submission flag when OTP changes or error occurs
  useEffect(() => {
    if (otp.length < 6) {
      setHasSubmitted(false);
    }
  }, [otp]);

  useEffect(() => {
    if (error) {
      setHasSubmitted(false);
      setSubmissionStartTime(null);
    }
  }, [error]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (
      otp.length === 6 &&
      !isLoading &&
      !validationError &&
      !error &&
      !hasSubmitted
    ) {
      onDebugLog?.(`OTP component: Auto-submitting code (length: 6)`);
      handleOtpSubmit(otp);
    }
  }, [
    otp,
    isLoading,
    validationError,
    error,
    hasSubmitted,
    handleOtpSubmit,
    onDebugLog,
  ]);

  // Update loading messages based on time elapsed
  useEffect(() => {
    if (!isLoading || !submissionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - submissionStartTime;

      if (elapsed > 30000) {
        // 30+ seconds
        setLoadingMessage(
          "This is taking longer than expected. Please wait..."
        );
      } else if (elapsed > 15000) {
        // 15+ seconds
        setLoadingMessage("Still verifying. Please be patient...");
      } else if (elapsed > 5000) {
        // 5+ seconds
        setLoadingMessage("Verifying your code...");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, submissionStartTime]);

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <div>
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit verification code we sent to your email
                address. The code will expire in 1 hour.
              </p>
            </div>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {otp.length === 6 && (
                <p className="text-sm text-muted-foreground text-center">
                  {isLoading
                    ? loadingMessage
                    : "Code entered, verifying automatically..."}
                </p>
              )}

              {isLoading && submissionStartTime && (
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>

            {displayError && (
              <Alert variant="destructive">
                <p>{displayError}</p>
              </Alert>
            )}

            <Button
              onClick={() => handleOtpSubmit()}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Code
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={onBackToEmail}
              className="w-full"
              disabled={isLoading}
            >
              Use Different Email
            </Button>
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
