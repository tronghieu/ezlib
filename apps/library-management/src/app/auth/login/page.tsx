"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, ExternalLink, Shield } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
});

/**
 * Login page component implementing AC2: Login Interface Implementation
 * Provides passwordless email OTP authentication with professional UI
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams?.get("redirectTo") || "/dashboard";

  const supabase = createClient();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate email format
      const validationResult = loginSchema.safeParse({ email });
      if (!validationResult.success) {
        setError(validationResult.error.issues[0].message);
        return;
      }

      // Send OTP code via email using Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users
        },
      });

      if (signInError) {
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
        } else {
          setError(`Authentication failed: ${signInError.message}`);
        }
        return;
      }

      // Success - show OTP input form
      setIsOtpSent(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp;
    setError("");
    setIsLoading(true);

    try {
      // Validate OTP format
      const validationResult = otpSchema.safeParse({ otp: codeToVerify });
      if (!validationResult.success) {
        setError(validationResult.error.issues[0].message);
        return;
      }

      // Verify OTP code
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeToVerify,
        type: "email",
      });

      if (verifyError) {
        if (verifyError.message.includes("Invalid token")) {
          setError(
            "Invalid verification code. Please check the code and try again."
          );
        } else if (verifyError.message.includes("expired")) {
          setError("Verification code has expired. Please request a new one.");
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        return;
      }

      // Success - redirect to intended destination
      router.replace(redirectTo);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && isOtpSent && !isLoading) {
      handleOtpSubmit(otp);
    }
  }, [otp, isOtpSent, isLoading]);

  if (isOtpSent) {
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
                      ? "Verifying..."
                      : "Code entered, verifying automatically..."}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <p>{error}</p>
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
                    Verifying...
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
                onClick={() => {
                  setIsOtpSent(false);
                  setEmail("");
                  setOtp("");
                  setError("");
                }}
                className="w-full"
              >
                Use Different Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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

            {error && (
              <Alert variant="destructive">
                <p>{error}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
