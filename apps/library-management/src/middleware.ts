import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
// Temporarily disable intl middleware for debugging
// import createIntlMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale, localePrefix } from './i18n/config';

/**
 * Authentication middleware for protecting admin routes
 * Implements AC1: Authentication Middleware Implementation
 */
export async function middleware(request: NextRequest) {
  // TODO: Re-enable intl middleware once configuration issues are resolved
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/callback",
    "/auth/error",
    "/api/health",
    "/api/auth/callback",
    "/favicon.ico",
    "/_next/static",
    "/_next/image",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route);
  });

  // Allow public routes to proceed without authentication
  if (isPublicRoute) {
    return supabaseResponse;
  }

  try {
    // Get the current user - this also refreshes the session if needed
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle authentication errors
    if (error) {
      console.error("Middleware auth error:", error.message);
      // Clear potentially corrupted session
      const response = NextResponse.redirect(
        new URL("/auth/login", request.url)
      );
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }

    // If user is not authenticated, redirect to login with return URL
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);

      // Add return URL parameter for redirect after login
      if (pathname !== "/auth/login") {
        loginUrl.searchParams.set("redirectTo", pathname);
      }

      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - allow the request to proceed
    return supabaseResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    // On any unexpected error, redirect to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

/**
 * Configure which paths the middleware should run on
 * Protects all routes except explicitly public ones
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
