/**
 * Logout API Route
 * Handles server-side session cleanup and logout
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout - Handle user logout
 */
export async function POST() {
  try {
    const cookieStore = cookies();

    // Create Supabase client for logout
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
              console.error("Error setting cookies during logout:", error);
            }
          },
        },
      }
    );

    // Get current user before logout for logging
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Perform logout
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Server logout error:", error.message);
      return NextResponse.json(
        { error: "Logout failed", details: error.message },
        { status: 500 }
      );
    }

    // Log successful logout
    if (user) {
      console.log(`User ${user.email} logged out successfully`);
    }

    // Create response with success message
    const response = NextResponse.json(
      {
        message: "Logged out successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    // Set security headers
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Unexpected logout error:", error);

    return NextResponse.json(
      { error: "Unexpected error during logout" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout - Not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for logout." },
    { status: 405 }
  );
}
