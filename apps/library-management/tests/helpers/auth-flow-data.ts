/**
 * Auth Flow Test Data Helper
 * Independent seed data specifically for authentication E2E tests
 * Implements Test-Specific Seed Data pattern from CLAUDE.md
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Use environment variables for security
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthTestUser {
  id: string;
  email: string;
}

export interface AuthTestLibrary {
  id: string;
  name: string;
  code: string;
}

export interface AuthTestScenario {
  user: AuthTestUser;
  library: AuthTestLibrary;
  cleanup: () => Promise<void>;
}

/**
 * Creates a library owner for authentication testing
 */
export async function createAuthTestUser(
  testName: string
): Promise<AuthTestUser> {
  const timestamp = Date.now();
  const email = `auth-test-${testName}-${timestamp}@example.com`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      test_user: true,
      test_suite: "auth-flow",
      test_name: testName,
    },
  });

  if (error)
    throw new Error(`Failed to create auth test user: ${error.message}`);

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

/**
 * Creates a library for authentication testing
 */
export async function createAuthTestLibrary(
  testName: string
): Promise<AuthTestLibrary> {
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(2, 8); // Random 6-char string
  const code = `AUTH-${uniqueId.toUpperCase()}`; // Ensure uniqueness across parallel tests
  const name = `Auth Test Library ${testName} ${uniqueId}`;

  const { data, error } = await supabaseAdmin
    .from("libraries")
    .insert({
      name,
      code,
      address: {
        street: "123 Auth Test St",
        city: "Test City",
        state: "TC",
        postal_code: "00000",
        country: "Test",
      },
      contact_info: {
        phone: "+1555000000",
        email: `${code.toLowerCase()}@authtest.com`,
        website: `https://${code.toLowerCase()}.authtest.com`,
        hours: {
          monday: "9:00 AM - 5:00 PM",
          tuesday: "9:00 AM - 5:00 PM",
          wednesday: "9:00 AM - 5:00 PM",
          thursday: "9:00 AM - 5:00 PM",
          friday: "9:00 AM - 5:00 PM",
          saturday: "Closed",
          sunday: "Closed",
        },
      },
      settings: {
        loan_period_days: 14,
        max_renewals: 2,
        max_books_per_member: 5,
        late_fee_per_day: 0.25,
        membership_fee: 0,
        allow_holds: true,
        allow_digital: false,
      },
      stats: {
        total_books: 0,
        total_members: 0,
        active_loans: 0,
        books_loaned_this_month: 0,
      },
      status: "active",
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create auth test library: ${error.message}`);

  return {
    id: data.id,
    name: data.name,
    code: data.code,
  };
}

/**
 * Sets up complete auth test scenario
 */
export async function setupAuthTestScenario(
  testName: string
): Promise<AuthTestScenario> {
  const user = await createAuthTestUser(testName);
  const library = await createAuthTestLibrary(testName);

  // Assign user as owner (using correct schema)
  const { error } = await supabaseAdmin.from("library_staff").insert({
    user_id: user.id,
    library_id: library.id,
    role: "owner",
    status: "active",
    is_deleted: false, // Required field
    employment_info: {
      employee_id: `TEST-${Date.now()}`,
      department: "Administration",
      hire_date: new Date().toISOString(),
      work_schedule: "Full-time",
    },
  });

  if (error)
    throw new Error(`Failed to assign user to library: ${error.message}`);

  return {
    user,
    library,
    cleanup: async () => {
      await cleanupAuthTestData(user.id, library.id);
    },
  };
}

/**
 * Clean up auth test data
 */
export async function cleanupAuthTestData(
  userId: string,
  libraryId: string
): Promise<void> {
  try {
    // Clean up library staff first
    await supabaseAdmin
      .from("library_staff")
      .delete()
      .eq("user_id", userId)
      .eq("library_id", libraryId);

    // Clean up library
    await supabaseAdmin.from("libraries").delete().eq("id", libraryId);

    // Clean up user
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Auth test cleanup error: ${error}`);
  }
}

/**
 * Get OTP from Mailpit for auth testing
 * Try both common Mailpit ports (8025 and 54324)
 */
export async function getAuthTestOTP(
  email: string,
  maxWaitMs = 10000
): Promise<string | null> {
  const startTime = Date.now();
  const mailpitPorts = [8025, 54324]; // Try both common ports

  while (Date.now() - startTime < maxWaitMs) {
    for (const port of mailpitPorts) {
      try {
        const response = await fetch(
          `http://localhost:${port}/api/v1/messages`
        );
        if (!response.ok) continue; // Try next port

        const messages = await response.json();

        const latestMessage = messages.messages
          ?.filter(
            (msg: any) =>
              msg.To?.some((to: any) => to.Address === email) &&
              new Date(msg.Created).getTime() > startTime - 10000 // Allow 10 seconds for email delivery
          )
          ?.sort(
            (a: any, b: any) =>
              new Date(b.Created).getTime() - new Date(a.Created).getTime()
          )?.[0];

        if (latestMessage) {
          const messageResponse = await fetch(
            `http://localhost:${port}/api/v1/message/${latestMessage.ID}`
          );
          const fullMessage = await messageResponse.json();

          // Extract 6-digit OTP from Supabase email
          const otpMatch = fullMessage.Text?.match(/(\d{6})/);
          if (otpMatch) {
            console.log(
              `OTP found via Mailpit on port ${port}: ${otpMatch[1]}`
            );
            return otpMatch[1];
          }
        }
      } catch (error) {
        // Silently continue to next port
        continue;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn(`OTP not found in Mailpit after ${maxWaitMs}ms for ${email}`);
  return null;
}
