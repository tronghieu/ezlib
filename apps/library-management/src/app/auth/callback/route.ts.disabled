import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Authentication callback route implementing AC3: Authentication Callback Handling
 * Handles OTP token exchange and session establishment
 *
 * This route is called when users click the magic link in their email
 * It exchanges the OTP tokens for a valid session and redirects appropriately
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  try {
    if (!code) {
      console.error("Auth callback: No authorization code provided");
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_code", origin)
      );
    }

    // Create Supabase client with cookie handling for server-side
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Handle cases where cookies can't be set (e.g., in middleware)
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );

    // Exchange the authorization code for a session
    const { data: authData, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error("Auth callback error:", authError.message);

      // Handle specific error cases
      if (authError.message.includes("expired")) {
        return NextResponse.redirect(
          new URL("/auth/login?error=link_expired", origin)
        );
      }

      if (authError.message.includes("invalid")) {
        return NextResponse.redirect(
          new URL("/auth/login?error=invalid_link", origin)
        );
      }

      // Generic auth error
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=auth_failed&message=${encodeURIComponent(authError.message)}`,
          origin
        )
      );
    }

    if (!authData.user) {
      console.error(
        "Auth callback: No user data after successful token exchange"
      );
      return NextResponse.redirect(
        new URL("/auth/login?error=no_user_data", origin)
      );
    }

    // Note: Library staff validation will be implemented in Task 4 (Permission System)
    // For now, we'll allow any authenticated user to proceed
    // In production, this would check the library_staff table

    // TODO: Implement library staff access validation when database schema is updated
    // const { data: staffData, error: staffError } = await supabase
    //   .from("library_staff")
    //   .select("id, library_id, role, permissions")
    //   .eq("user_id", authData.user.id);

    // Success! User is authenticated
    console.log(`User ${authData.user.email} successfully authenticated`);

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectTo, origin));

    // Set additional security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);

    return NextResponse.redirect(
      new URL("/auth/login?error=unexpected_error", origin)
    );
  }
}

/**
 * Handle POST requests (not typically used for auth callbacks, but good to have)
 * This could be used for programmatic authentication in the future
 */
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed for auth callback" },
    { status: 405 }
  );
}
