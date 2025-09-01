import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Development-only API route for bypassing authentication
 * Creates a valid session for testing library context functionality
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use admin API to get user by email
    const { data: userResponse, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error finding users:", userError);
      return NextResponse.json(
        { error: "User lookup failed" },
        { status: 500 }
      );
    }

    const user = userResponse.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate an access token for this user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

    if (sessionError) {
      console.error("Error generating session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: sessionData.properties.action_link,
    });
  } catch (error) {
    console.error("Dev auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
