/**
 * @jest-environment node
 */
import { GET, HEAD } from "../route";

// Mock the health check functions
const mockHealthResult = {
  healthy: true,
  timestamp: "2024-01-01T00:00:00.000Z",
  latency: 150,
  version: "1.0.0",
  environment: "test",
  features: {
    dueDates: false,
    fines: false,
    holds: false,
    advancedSearch: false,
  },
  details: {
    database: {
      connected: true,
    },
    environment: {
      configured: true,
      variables: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      missing: [],
    },
  },
};

jest.mock("../../../../lib/supabase/health", () => ({
  checkComprehensiveHealth: jest.fn(() => Promise.resolve(mockHealthResult)),
}));

import { checkComprehensiveHealth } from "../../../../lib/supabase/health";
const mockCheckHealth = checkComprehensiveHealth as jest.MockedFunction<typeof checkComprehensiveHealth>;

describe("Health Check API Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default healthy state
    mockCheckHealth.mockResolvedValue(mockHealthResult);
  });

  describe("1.1-UNIT-015: Health check status determination", () => {
    it("should return healthy status when all environment variables are properly configured", async () => {
      // Given: Mock health check returns healthy status
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: true,
        version: "1.0.0",
        environment: "production",
      });

      // When: Health check endpoint is called
      const response = await GET();
      const data = await response.json();

      // Then: Returns healthy status with complete system information
      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe("1.0.0");
      expect(data.environment).toBe("production");
      expect(data.services).toBeDefined();
      expect(data.services.application.status).toBe("healthy");
      expect(data.services.environment.status).toBe("healthy");
      expect(data.services.database.status).toBe("healthy");
    });

    it("should return unhealthy status when environment is not configured", async () => {
      // Given: Mock health check returns unhealthy status
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: false,
        details: {
          database: {
            connected: false,
            error: "Connection failed"
          },
          environment: {
            configured: false,
            variables: [],
            missing: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
          },
        },
      });

      // When: Health check endpoint is called
      const response = await GET();
      const data = await response.json();

      // Then: Returns unhealthy status
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.services.environment.status).toBe("unhealthy");
      expect(data.services.database.status).toBe("unhealthy");
    });

    it("should handle database connection failures", async () => {
      // Given: Mock health check returns database connection failure
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: false,
        details: {
          database: {
            connected: false,
            error: "Database connection failed"
          },
          environment: {
            configured: true,
            variables: ["NEXT_PUBLIC_SUPABASE_URL"],
            missing: [],
          },
        },
      });

      // When: Health check endpoint is called
      const response = await GET();
      const data = await response.json();

      // Then: Returns unhealthy status with database error
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.services.database.status).toBe("unhealthy");
      expect(data.error_details?.database_error).toContain("Database connection failed");
    });
  });

  describe("1.1-UNIT-016: Health check handles missing environment variables gracefully", () => {
    it("should handle missing optional variables gracefully", async () => {
      // Given: Health check with some missing optional variables
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: true,
        version: "unknown", // Default when NEXT_PUBLIC_APP_VERSION is missing
      });

      // When: Health check runs with missing optional variables
      const response = await GET();
      const data = await response.json();

      // Then: Handles missing variables gracefully without errors
      expect(response.status).toBe(200);
      expect(data.version).toBe("unknown"); // Should use default version
      expect(data.services).toBeDefined();
      expect(data.services.application.status).toBe("healthy");
    });

    it("should return error information when required variables are missing", async () => {
      // Given: Health check with missing required variables
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: false,
        details: {
          database: {
            connected: false,
            error: "Missing required Supabase environment variables"
          },
          environment: {
            configured: false,
            variables: [],
            missing: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
          },
        },
      });

      // When: Health check runs with missing required variables
      const response = await GET();
      const data = await response.json();

      // Then: Returns 503 status with missing variable information
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.error_details?.missing_env_vars).toContain("NEXT_PUBLIC_SUPABASE_URL");
    });

    it("should handle environment validation errors gracefully", async () => {
      // Given: Mock health check throws an error
      mockCheckHealth.mockRejectedValue(new Error("Environment validation failed"));

      // When: Health check processes environment
      const response = await GET();
      const data = await response.json();

      // Then: Returns error status with fallback response
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.error).toContain("Environment validation failed");
    });
  });

  describe("1.1-UNIT-017: Health check response format validation", () => {
    it("should return properly formatted response with all required fields", async () => {
      // Given: Valid health check result
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        version: "2.0.0-test",
        environment: "test",
        features: {
          dueDates: true,
          fines: false,
          holds: true,
          advancedSearch: false,
        },
      });

      // When: Health check response is generated
      const response = await GET();
      const data = await response.json();

      // Then: Response includes valid timestamp and version information
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
      expect(data.version).toBe("2.0.0-test");

      // Validate complete response structure
      expect(data).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        latency_ms: expect.any(Number),
        services: {
          application: {
            status: "healthy",
            node_version: expect.any(String),
            next_version: "15.5.2",
            typescript_version: "5+",
          },
          environment: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            variables_configured: expect.any(Array),
            variables_missing: expect.any(Array),
            total_required: expect.any(Number),
          },
          database: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            connection_test: expect.stringMatching(/^(passed|failed)$/),
            supabase_integration: "active",
            type_generation: "complete",
          },
          features: {
            dueDates: expect.any(Boolean),
            fines: expect.any(Boolean),
            holds: expect.any(Boolean),
            advancedSearch: expect.any(Boolean),
          },
        },
      });
    });

    it("should generate valid ISO timestamp", async () => {
      // Given: Health check endpoint ready
      const now = new Date().toISOString();
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        timestamp: now,
      });

      // When: Health check generates timestamp
      const response = await GET();
      const data = await response.json();

      // Then: Timestamp is valid ISO format
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe("Invalid Date");
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });

    it("should include uptime information", async () => {
      // Given: Health check endpoint
      // When: Health check calculates uptime
      const response = await GET();
      const data = await response.json();

      // Then: Uptime is provided as a number (seconds)
      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe("number");
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("HTTP Methods Support", () => {
    it("should support GET requests", async () => {
      // Given: Valid health check result
      // When: GET request is made
      const response = await GET();

      // Then: Returns successful response with JSON body
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
      const data = await response.json();
      expect(data.status).toBeDefined();
    });

    it("should support HEAD requests", async () => {
      // Given: Valid health check result
      // When: HEAD request is made
      const response = await HEAD();

      // Then: Returns successful response with headers only
      expect(response.status).toBe(200);
      
      // HEAD should not have a body
      const text = await response.text();
      expect(text).toBe("");
      
      // Should have health status headers
      expect(response.headers.get("X-Health-Status")).toBe("healthy");
    });

    it("should return 503 for HEAD request when unhealthy", async () => {
      // Given: Health check returns unhealthy
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: false,
        details: {
          database: { connected: false },
          environment: { configured: false, variables: [], missing: ["NEXT_PUBLIC_SUPABASE_URL"] },
        },
      });

      // When: HEAD request is made
      const response = await HEAD();

      // Then: Returns 503 status
      expect(response.status).toBe(503);
      expect(response.headers.get("X-Health-Status")).toBe("unhealthy");

      // HEAD should not have a body
      const text = await response.text();
      expect(text).toBe("");
    });
  });

  describe("Status Code Conventions", () => {
    it("should return 200 for healthy status", async () => {
      // Given: Healthy health check result
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: true,
      });

      // When: Health check is called in healthy state
      const response = await GET();
      const data = await response.json();

      // Then: Returns 200 status code for healthy
      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
    });

    it("should return 503 for unhealthy status", async () => {
      // Given: Unhealthy health check result
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        healthy: false,
      });

      // When: Health check detects unhealthy state
      const response = await GET();
      const data = await response.json();

      // Then: Returns 503 status code for unhealthy
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
    });
  });

  describe("Feature Flags", () => {
    it("should correctly report feature flag status", async () => {
      // Given: Health check with feature flags
      mockCheckHealth.mockResolvedValue({
        ...mockHealthResult,
        features: {
          dueDates: true,
          fines: false,
          holds: true,
          advancedSearch: false,
        },
      });

      // When: Health check processes feature flags
      const response = await GET();
      const data = await response.json();

      // Then: Feature flags are correctly reported
      expect(data.services.features.dueDates).toBe(true);
      expect(data.services.features.fines).toBe(false);
      expect(data.services.features.holds).toBe(true);
      expect(data.services.features.advancedSearch).toBe(false);
    });
  });
});