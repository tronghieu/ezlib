/**
 * Row Level Security (RLS) validation tests
 * Tests RLS policies and data isolation
 */

import { validateRLSPolicies, checkRLSHealth, generateRLSIntegrationGuide } from "../rls-validation";

// Mock the server clients for testing
jest.mock("../server", () => ({
  createServerClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe("RLS Validation", () => {
  describe("validateRLSPolicies", () => {
    it("should return a complete validation report structure", async () => {
      // When: Running RLS validation
      const report = await validateRLSPolicies();
      
      // Then: Report should have proper structure
      expect(report).toMatchObject({
        overall_status: expect.stringMatching(/^(passed|failed|error)$/),
        tests_run: expect.any(Number),
        tests_passed: expect.any(Number),
        tests_failed: expect.any(Number),
        results: expect.any(Array),
        timestamp: expect.any(String),
        environment: expect.any(String),
      });
      
      expect(report.tests_run).toBeGreaterThan(0);
      expect(report.tests_passed + report.tests_failed).toBeLessThanOrEqual(report.tests_run);
    });

    it("should test basic connectivity", async () => {
      // When: Running validation
      const report = await validateRLSPolicies();
      
      // Then: Should include connectivity test
      const connectivityTest = report.results.find(r => r.test_name === "basic_connectivity");
      expect(connectivityTest).toBeDefined();
      expect(connectivityTest?.table_name).toBe("general_books");
      // Handle both success and failure cases
      expect(connectivityTest?.description).toMatch(/database connectivity|Connection test failed/);
    });

    it("should test anonymous access", async () => {
      // When: Running validation
      const report = await validateRLSPolicies();
      
      // Then: Should include anonymous access test
      const anonTest = report.results.find(r => r.test_name === "anonymous_read_access");
      expect(anonTest).toBeDefined();
      expect(anonTest?.table_name).toBe("authors");
      // Handle both success and failure cases
      expect(anonTest?.description).toMatch(/Anonymous users|Test failed due to exception/);
    });

    it("should handle admin client testing", async () => {
      // When: Running validation
      const report = await validateRLSPolicies();
      
      // Then: Should include admin client test
      const adminTest = report.results.find(r => r.test_name === "admin_client_bypass");
      expect(adminTest).toBeDefined();
      // Handle both success and failure cases
      expect(adminTest?.description).toMatch(/Service role|Admin client test failed|no service role key/);
    });
  });

  describe("checkRLSHealth", () => {
    it("should return health status", async () => {
      // When: Checking RLS health
      const health = await checkRLSHealth();
      
      // Then: Should return health object
      expect(health).toMatchObject({
        healthy: expect.any(Boolean),
        message: expect.any(String),
      });
      
      expect(health.message).toContain("RLS Tests:");
    });
  });

  describe("generateRLSIntegrationGuide", () => {
    it("should generate comprehensive integration documentation", () => {
      // When: Generating RLS guide
      const guide = generateRLSIntegrationGuide();
      
      // Then: Should contain key sections
      expect(guide).toContain("Row Level Security (RLS) Integration Guide");
      expect(guide).toContain("Public Tables");
      expect(guide).toContain("Library-Scoped Data Isolation"); 
      expect(guide).toContain("Role-Based Access Control");
      expect(guide).toContain("Security Best Practices");
      expect(guide).toContain("Future Implementation Roadmap");
      
      // Should contain SQL examples
      expect(guide).toContain("ALTER TABLE");
      expect(guide).toContain("CREATE POLICY");
      expect(guide).toContain("auth.uid()");
      
      // Should contain TypeScript examples
      expect(guide).toContain("validateRLSPolicies");
    });

    it("should document current and future table structures", () => {
      // When: Generating guide
      const guide = generateRLSIntegrationGuide();
      
      // Then: Should mention current tables
      expect(guide).toContain("authors");
      expect(guide).toContain("general_books");
      expect(guide).toContain("book_editions");
      
      // And future tables
      expect(guide).toContain("libraries");
      expect(guide).toContain("library_staff");
      expect(guide).toContain("library_members");
      expect(guide).toContain("book_copies");
      expect(guide).toContain("borrowing_transactions");
    });
  });
});