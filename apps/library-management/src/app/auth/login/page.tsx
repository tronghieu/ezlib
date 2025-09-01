"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmailStep } from "@/components/auth/email-step";
import { OtpStep } from "@/components/auth/otp-step";

/**
 * Login page component implementing AC2: Login Interface Implementation
 * Provides passwordless email OTP authentication with professional UI
 */
function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams?.get("redirectTo") || "/";

  // Timeout management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const supabase = createClient();

  // Debug logging helper
  const logDebug = (message: string, data?: unknown) => {
    console.log(`[Auth Debug] ${message}`, data || "");
    setDebugInfo((prev) => `${prev}\n${new Date().toISOString()}: ${message}`);
  };

  const handleEmailSubmit = async (emailValue: string) => {
    setError("");
    setIsLoading(true);
    setEmail(emailValue);
    logDebug(`Starting email submission for: ${emailValue}`);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create abort controller for timeout handling
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Set timeout for email submission (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          abortController.abort();
          reject(
            new Error(
              "Email submission timed out. Please check your connection and try again."
            )
          );
        }, 30000);
      });

      logDebug("Attempting to send OTP via Supabase");

      // Send OTP code via email using Supabase Auth
      // Use shouldCreateUser: true - this works for both new and existing users
      const authPromise = supabase.auth.signInWithOtp({
        email: emailValue,
        options: {
          shouldCreateUser: true, // This works for both new and existing users
        },
      });

      // Race between auth request and timeout
      const { error: signInError } = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as { error?: { message: string; status?: number } };

      // Clear timeout if we got here
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (signInError) {
        logDebug("Email submission failed", {
          error: signInError.message,
          code: signInError.status,
        });

        if (signInError.message.includes("Email not confirmed")) {
          setError(
            "Please check your email and click the confirmation link to activate your account."
          );
        } else if (signInError.message.includes("Invalid email")) {
          setError("Please enter a valid email address.");
        } else if (
          signInError.message.includes("Unable to validate email address")
        ) {
          setError(
            "This email is not registered. Please create an account on ezlib.com first."
          );
        } else if (signInError.message.includes("rate limit")) {
          setError(
            "Too many requests. Please wait a few minutes before trying again."
          );
        } else {
          setError(`Authentication failed: ${signInError.message}`);
        }
        return;
      }

      // Success - show OTP input form
      logDebug("Email submission successful, OTP sent");
      setIsOtpSent(true);
    } catch (err: unknown) {
      logDebug("Email submission error", {
        error: err instanceof Error ? err.message : String(err),
      });

      if (err instanceof Error && err.name === "AbortError") {
        setError("Request was cancelled. Please try again.");
      } else if (err instanceof Error && err.message.includes("timed out")) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
      // Clean up abort controller
      abortControllerRef.current = null;
    }
  };

  const handleOtpSubmit = async (otpValue: string) => {
    setError("");
    setIsLoading(true);
    logDebug(
      `Starting OTP verification for: ${email} with code: ${otpValue.substring(0, 2)}***`
    );

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create abort controller for timeout handling
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      logDebug("Attempting OTP verification via Supabase");

      // Verify OTP code - use 'email' type for OTP codes from signInWithOtp
      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token: otpValue,
        type: "email", // Use 'email' type for OTP verification from signInWithOtp
      });

      // Set up timeout with proper signal handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          abortController.abort();
          reject(new Error("OTP_TIMEOUT"));
        }, 45000);
      });

      // Race between verification and timeout
      let result;
      try {
        result = await Promise.race([verifyPromise, timeoutPromise]);
      } catch (raceError) {
        // Clear timeout on any error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (raceError instanceof Error && raceError.message === "OTP_TIMEOUT") {
          setError("Verification timed out. Please check your connection and try again.");
          return;
        }
        
        // Re-throw other errors to be handled by outer catch
        throw raceError;
      }

      const { error: verifyError, data } = result;

      // Clear timeout if we got here
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (verifyError) {
        logDebug("OTP verification failed", {
          error: verifyError.message,
          code: verifyError.status,
          email: email,
        });

        if (verifyError.message.includes("Invalid token")) {
          setError(
            "Invalid verification code. Please check the code and try again."
          );
        } else if (
          verifyError.message.includes("expired") ||
          verifyError.message.includes("Token has expired")
        ) {
          setError("Verification code has expired. Please request a new code.");
        } else if (verifyError.message.includes("not found")) {
          setError("No pending verification found. Please request a new code.");
        } else if (verifyError.message.includes("rate limit")) {
          setError("Too many attempts. Please wait before trying again.");
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        return;
      }

      // Success - log and redirect
      logDebug("OTP verification successful", {
        userId: data?.user?.id || "unknown",
        email: data?.user?.email || email,
        session: data?.session ? "created" : "no session",
      });

      // Check if we actually have a session
      if (!data?.session) {
        logDebug("No session created after OTP verification");
        setError(
          "Authentication successful but session creation failed. Please try again."
        );
        return;
      }

      logDebug(`Redirecting to: ${redirectTo}`);

      // Add a small delay to ensure the auth state is properly set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use push instead of replace to allow back navigation
      router.push(redirectTo);
    } catch (err: unknown) {
      logDebug("OTP verification error", {
        error: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : "Unknown",
      });

      if (err instanceof Error && err.name === "AbortError") {
        setError("Verification was cancelled. Please try again.");
      } else if (err instanceof Error && err.message.includes("timed out")) {
        setError(err.message);
      } else if (
        err instanceof Error &&
        (err.message.includes("NetworkError") || err.message.includes("fetch"))
      ) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          "An unexpected error occurred during verification. Please try again."
        );
      }
      console.error("OTP verification error:", err);
    } finally {
      setIsLoading(false);
      // Clean up abort controller
      abortControllerRef.current = null;
    }
  };

  const handleBackToEmail = () => {
    // Clean up any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsOtpSent(false);
    setEmail("");
    setError("");
    setDebugInfo("");
    logDebug("Returning to email input step");
  };

  if (isOtpSent) {
    return (
      <OtpStep
        email={email}
        onOtpSubmit={handleOtpSubmit}
        onBackToEmail={handleBackToEmail}
        isLoading={isLoading}
        error={error}
        debugInfo={debugInfo}
        onDebugLog={logDebug}
      />
    );
  }

  return (
    <EmailStep
      onEmailSubmit={handleEmailSubmit}
      isLoading={isLoading}
      error={error}
      debugInfo={debugInfo}
    />
  );
}

// Loading fallback component
function LoginPageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}

// Main export wrapped with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
