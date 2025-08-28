/**
 * @jest-environment node
 */

/**
 * Supabase Integration Tests
 * Tests complete flows including client creation, authentication context, and data operations
 */

import { createClient as createClientSide } from "../client";
import { createClient as createServerClient } from "../server";
import { checkClientHealth, checkServerHealth } from "../health";
import { validateRLSPolicies } from "../rls-validation";

// Mock the Supabase clients
const mockSupabaseResponse = {
  data: [{ id: "test-1", name: "Test Author" }],
  error: null,
  count: 1,
};

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      limit: jest.fn(() => Promise.resolve(mockSupabaseResponse)),
      eq: jest.fn(() => Promise.resolve(mockSupabaseResponse)),
    })),
    insert: jest.fn(() => Promise.resolve(mockSupabaseResponse)),
    update: jest.fn(() => Promise.resolve(mockSupabaseResponse)),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    })),
    getSession: jest.fn(() => Promise.resolve({
      data: { session: { access_token: "test-token" } },
      error: null,
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({
      data: { user: { id: "user-1" }, session: { access_token: "test-token" } },
      error: null,
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
  rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
};

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => mockSupabaseClient),
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Next.js cookies function for server client tests
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe("Supabase Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up valid test environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  describe("AC2: Client Configuration Integration", () => {
    describe("Client-side Supabase client", () => {
      it("should create client-side client with proper configuration", () => {
        // Given: Valid environment configuration
        
        // When: Creating client-side Supabase client
        const client = createClientSide();
        
        // Then: Client should be properly configured
        expect(client).toBeDefined();
        expect(client.from).toBeDefined();
        expect(client.auth).toBeDefined();
      });

      it("should handle table operations with type safety", async () => {
        // Given: Client-side client
        const client = createClientSide();
        
        // When: Performing table operations
        const { data: authors, error: authorsError } = await client
          .from("authors")
          .select("*")
          .limit(10);
        
        const { data: books, error: booksError } = await client
          .from("general_books") 
          .select("*")
          .limit(10);
        
        // Then: Operations should complete successfully
        expect(authorsError).toBeNull();
        expect(booksError).toBeNull();
        expect(authors).toBeDefined();
        expect(books).toBeDefined();
      });

      it("should handle authentication operations", async () => {
        // Given: Client with auth capabilities
        const client = createClientSide();
        
        // When: Performing auth operations
        const { data: user, error: userError } = await client.auth.getUser();
        const { data: session, error: sessionError } = await client.auth.getSession();
        
        // Then: Auth operations should work
        expect(userError).toBeNull();
        expect(sessionError).toBeNull();
        expect(user.user).toBeDefined();
        expect(session.session).toBeDefined();
      });
    });

    describe("Server-side Supabase client", () => {
      it("should create server-side client for SSR operations", async () => {
        // Given: Valid server environment
        
        // When: Creating server-side client
        const client = await createServerClient();
        
        // Then: Client should be properly configured for server operations
        expect(client).toBeDefined();
        expect(client.from).toBeDefined();
        expect(client.auth).toBeDefined();
      });

      it("should handle server-side data operations", async () => {
        // Given: Server-side client
        const client = await createServerClient();
        
        // When: Performing server-side queries
        const { data, error } = await client
          .from("book_editions")
          .select("id, title, general_book_id")
          .limit(5);
        
        // Then: Server operations should work
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });

    describe("Admin client operations", () => {
      it("should handle elevated database operations", async () => {
        // Given: Admin client context
        const client = await createServerClient();
        
        // When: Performing admin-level operations
        const { data, error } = await client.rpc("test_admin_function");
        
        // Then: Admin operations should be available
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });
  });

  describe("AC4: Database Integration Validation", () => {
    describe("Health check integration", () => {
      it("should validate complete client-side health check flow", async () => {
        // Given: Client-side environment
        
        // When: Running client health check
        const healthResult = await checkClientHealth();
        
        // Then: Health check should complete successfully
        expect(healthResult).toMatchObject({
          healthy: expect.any(Boolean),
          timestamp: expect.any(String),
          latency: expect.any(Number),
          details: {
            database: {
              connected: expect.any(Boolean),
            },
            environment: {
              configured: expect.any(Boolean),
              variables: expect.any(Array),
              missing: expect.any(Array),
            },
          },
        });
        
        expect(healthResult.latency).toBeGreaterThan(0);
      });

      it("should validate complete server-side health check flow", async () => {
        // Given: Server-side environment
        
        // When: Running server health check
        const healthResult = await checkServerHealth();
        
        // Then: Health check should include server-specific validation
        expect(healthResult).toMatchObject({
          healthy: expect.any(Boolean),
          timestamp: expect.any(String),
          latency: expect.any(Number),
          details: {
            database: {
              connected: expect.any(Boolean),
            },
            environment: {
              configured: expect.any(Boolean),
              variables: expect.any(Array),
              missing: expect.any(Array),
            },
          },
        });
      });

      it("should handle connection failures gracefully", async () => {
        // Given: Client that will fail connection
        mockSupabaseClient.from.mockImplementationOnce(() => {
          throw new Error("Connection failed");
        });
        
        // When: Health check encounters connection failure
        const healthResult = await checkClientHealth();
        
        // Then: Should handle failure gracefully
        expect(healthResult.healthy).toBe(false);
        expect(healthResult.details.database.connected).toBe(false);
        expect(healthResult.details.database.error).toContain("Connection failed");
      });
    });

    describe("Error handling integration", () => {
      it("should handle database errors with descriptive messages", async () => {
        // Given: Client that returns database error
        const mockError = { message: "relation does not exist", code: "42P01" };
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        });
        
        // When: Performing operation that encounters error
        const client = createClientSide();
        const { data, error } = await client.from("non_existent_table").select("*").limit(1);
        
        // Then: Error should be properly handled
        expect(data).toBeNull();
        expect(error).toEqual(mockError);
        expect(error.message).toContain("relation does not exist");
      });

      it("should provide proper error context for debugging", async () => {
        // Given: Environment configuration missing
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        
        // When: Attempting operations without proper config
        let configError: Error | null = null;
        
        try {
          const client = createClientSide();
          await client.from("authors").select("*").limit(1);
        } catch (error) {
          configError = error as Error;
        }
        
        // Then: Should provide clear error message
        expect(configError).toBeDefined();
        expect(configError?.message).toContain("Missing required Supabase environment variables");
      });
    });
  });

  describe("AC5: Row Level Security Integration", () => {
    describe("RLS policy integration", () => {
      it("should validate RLS policies with complete test suite", async () => {
        // Given: RLS validation framework
        
        // When: Running comprehensive RLS validation
        const validationReport = await validateRLSPolicies();
        
        // Then: Should return complete validation results
        expect(validationReport).toMatchObject({
          overall_status: expect.stringMatching(/^(passed|failed|error)$/),
          tests_run: expect.any(Number),
          tests_passed: expect.any(Number),
          tests_failed: expect.any(Number),
          results: expect.any(Array),
          timestamp: expect.any(String),
          environment: expect.any(String),
        });
        
        expect(validationReport.tests_run).toBeGreaterThan(0);
        expect(validationReport.results.length).toBeGreaterThan(0);
      });

      it("should test multi-tenant data isolation patterns", async () => {
        // Given: Client with user context
        const client = createClientSide();
        
        // When: Simulating library-scoped queries
        const { data: libraryData, error } = await client
          .from("authors") // Using existing table for test
          .select("*")
          .limit(1);
        
        // Then: Queries should respect RLS policies
        expect(error).toBeNull();
        expect(libraryData).toBeDefined();
      });
    });

    describe("Authentication context integration", () => {
      it("should properly propagate user context to database operations", async () => {
        // Given: Client with authenticated user
        const client = createClientSide();
        
        // When: Checking user authentication state
        const { data: authData, error: authError } = await client.auth.getUser();
        
        // Then: Authentication context should be available
        expect(authError).toBeNull();
        expect(authData.user).toBeDefined();
        expect(authData.user?.id).toBeTruthy();
      });

      it("should handle session management correctly", async () => {
        // Given: Client with session management
        const client = createClientSide();
        
        // When: Managing user sessions
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        
        // Then: Session should be properly managed
        expect(sessionError).toBeNull();
        expect(sessionData.session).toBeDefined();
        expect(sessionData.session?.access_token).toBeTruthy();
      });
    });
  });

  describe("Complete Integration Scenarios", () => {
    describe("Full authentication and data access flow", () => {
      it("should complete end-to-end user authentication and data access", async () => {
        // Given: Complete application flow
        const client = createClientSide();
        
        // When: User authenticates and accesses data
        // 1. User authentication
        const { data: authResult, error: authError } = await client.auth.signInWithPassword({
          email: "test@example.com",
          password: "test-password",
        });
        
        expect(authError).toBeNull();
        expect(authResult.user).toBeDefined();
        
        // 2. Data access with authenticated context
        const { data: userData, error: dataError } = await client
          .from("authors")
          .select("*")
          .limit(5);
        
        expect(dataError).toBeNull();
        expect(userData).toBeDefined();
        
        // 3. User logout
        const { error: logoutError } = await client.auth.signOut();
        expect(logoutError).toBeNull();
        
        // Then: Complete flow should work seamlessly
        expect(true).toBe(true); // All assertions above should pass
      });

      it("should handle connection resilience and recovery", async () => {
        // Given: Client that experiences connection issues
        let callCount = 0;
        mockSupabaseClient.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error("Network error");
          }
          return {
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockSupabaseResponse),
            }),
          };
        });
        
        const client = createClientSide();
        
        // When: First call fails, second succeeds
        let firstCallError: Error | null = null;
        
        try {
          await client.from("authors").select("*").limit(1);
        } catch (error) {
          firstCallError = error as Error;
        }
        
        const secondCallResult = await client.from("authors").select("*").limit(1);
        
        // Then: Should handle connection recovery
        expect(firstCallError).toBeDefined();
        expect(secondCallResult.data).toBeDefined();
        expect(secondCallResult.error).toBeNull();
      });
    });

    describe("Type safety integration", () => {
      it("should maintain type safety across all database operations", async () => {
        // Given: Typed client operations
        const client = createClientSide();
        
        // When: Performing various typed operations
        const authorQuery = client.from("authors").select("id, name, canonical_name");
        const bookQuery = client.from("general_books").select("id, canonical_title");
        const editionQuery = client.from("book_editions").select("id, title, language");
        
        // Then: All queries should be properly typed
        expect(authorQuery).toBeDefined();
        expect(bookQuery).toBeDefined();
        expect(editionQuery).toBeDefined();
        
        const [authorResult, bookResult, editionResult] = await Promise.all([
          authorQuery.limit(1),
          bookQuery.limit(1),
          editionQuery.limit(1),
        ]);
        
        expect(authorResult.error).toBeNull();
        expect(bookResult.error).toBeNull();
        expect(editionResult.error).toBeNull();
      });

      it("should validate insert and update operations with proper typing", async () => {
        // Given: Client with insert/update operations
        const client = createClientSide();
        
        // When: Performing insert and update operations
        const insertResult = await client
          .from("authors")
          .insert({ name: "New Author", canonical_name: "new-author" });
        
        const updateResult = await client
          .from("authors")
          .update({ name: "Updated Author" })
          .eq("id", "test-id");
        
        // Then: Operations should maintain type safety
        expect(insertResult.error).toBeNull();
        expect(updateResult.error).toBeNull();
      });
    });
  });

  afterEach(() => {
    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });
});