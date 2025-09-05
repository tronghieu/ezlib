import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Supabase client configuration for client-side operations
 * Used in React components and client-side code
 *
 * @description Creates a Supabase client with TypeScript type safety
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

let _supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const supabase = () => {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error(
        "Missing required Supabase environment variables. Please check your .env.local file."
      );
    }

    _supabase = createBrowserClient<Database>(
      supabaseUrl,
      supabasePublishableKey
    );
  }
  return _supabase;
};

/**
 * Create browser client function for consistency with server utilities
 * @returns Supabase browser client instance
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

/**
 * Type-safe table helpers for common database operations
 * Only includes tables that exist in the current database schema
 */
export const tables = {
  /**
   * Book management tables (current schema)
   */
  generalBooks: () => supabase().from("general_books"),
  bookEditions: () => supabase().from("book_editions"),
  bookContributors: () => supabase().from("book_contributors"),

  /**
   * Author and social tables
   */
  authors: () => supabase().from("authors"),
  authorFollows: () => supabase().from("author_follows"),
  socialFollows: () => supabase().from("social_follows"),

  /**
   * Review tables
   */
  reviews: () => supabase().from("reviews"),
} as const;

/**
 * Connection health check function
 * @returns Promise resolving to true if connection is healthy
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase().from("authors").select("count").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get current user session
 * @returns Current user session or null
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase().auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  return session;
}

/**
 * Get current user
 * @returns Current user or null
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  return user;
}
