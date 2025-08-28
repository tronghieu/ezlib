import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

/**
 * Server-side Supabase client for API routes and server components
 * Handles authentication context properly for SSR
 * 
 * @description Creates a Supabase client for server-side operations with cookie-based auth
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

/**
 * Create server-side Supabase client with authentication context
 * Use this in Server Components and API routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client wrapper for elevated database operations
 * Uses service role key - ONLY use server-side!
 * 
 * @warning This bypasses RLS - use with extreme caution!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations"
    );
  }

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Type-safe table helpers for server-side operations
 */
export function createServerTables(client: Awaited<ReturnType<typeof createClient>>) {
  return {
    /**
     * Book management tables (current schema)
     */
    generalBooks: () => client.from("general_books"),
    bookEditions: () => client.from("book_editions"),
    bookContributors: () => client.from("book_contributors"),
    
    /**
     * Author and social tables
     */
    authors: () => client.from("authors"),
    authorFollows: () => client.from("author_follows"),
    socialFollows: () => client.from("social_follows"),
    
    /**
     * Review tables
     */
    reviews: () => client.from("reviews"),
  } as const;
}

/**
 * Server-side connection health check
 * @param client - Supabase client instance
 * @returns Promise resolving to connection status
 */
export async function checkServerConnection(
  client: Awaited<ReturnType<typeof createClient>>
): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { error } = await client.from("authors").select("count").limit(1);
    
    if (error) {
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Get authenticated user from server context
 * @param client - Supabase client instance
 * @returns User object or null
 */
export async function getServerUser(
  client: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error getting server user:", error);
    return null;
  }
}

/**
 * Require authenticated user in API routes or server components
 * Throws error if no user is authenticated
 */
export async function requireAuth(
  client: Awaited<ReturnType<typeof createClient>>
) {
  const user = await getServerUser(client);
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  return user;
}