/**
 * @jest-environment node
 */
import {
  validateEnv,
  isFeatureEnabled,
  getEnvironment,
  isDevelopment,
  isProduction,
} from "../env-validation";

// Mock console methods to avoid noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  // Reset process.env for each test
  jest.resetModules();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe("Environment Validation", () => {
  describe("1.1-UNIT-012: validateEnv accepts valid environment configuration", () => {
    it("should accept valid environment variables", () => {
      // Given: Valid environment configuration
      const validEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
        NEXT_PUBLIC_APP_VERSION: "1.0.0",
        NODE_ENV: "test",
        DEBUG: "false",
      };

      // Mock process.env
      const originalEnv = process.env;
      process.env = { ...process.env, ...validEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called
        const result = validateEnv();

        // Then: Environment is accepted and parsed correctly
        expect(result).toBeDefined();
        expect(result.NEXT_PUBLIC_SITE_URL).toBe(validEnv.NEXT_PUBLIC_SITE_URL);
        expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe(
          validEnv.NEXT_PUBLIC_SUPABASE_URL
        );
        expect(result.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
          validEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        );
        expect(result.NEXT_PUBLIC_APP_VERSION).toBe(
          validEnv.NEXT_PUBLIC_APP_VERSION
        );
        expect(result.NODE_ENV).toBe("test");
        expect(result.DEBUG).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should apply default values for optional environment variables", () => {
      // Given: Minimal valid environment configuration
      const minimalEnv = {
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.com",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
      };

      const originalEnv = process.env;
      process.env = { ...minimalEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called
        const result = validateEnv();

        // Then: Default values are applied correctly
        expect(result.NEXT_PUBLIC_APP_VERSION).toBe("1.0.0"); // Default
        expect(result.NODE_ENV).toBe("development"); // Default
        expect(result.DEBUG).toBe(false); // Default transformation
        expect(result.NEXT_PUBLIC_ENABLE_DUE_DATES).toBe(false); // Default transformation
        expect(result.NEXT_PUBLIC_ENABLE_FINES).toBe(false); // Default transformation
        expect(result.NEXT_PUBLIC_ENABLE_HOLDS).toBe(false); // Default transformation
        expect(result.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH).toBe(false); // Default transformation
      } finally {
        process.env = originalEnv;
      }
    });

    it("should handle HTTPS URLs correctly", () => {
      // Given: Environment with HTTPS URLs
      const httpsEnv = {
        NEXT_PUBLIC_SITE_URL: "https://library.example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://abc123.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      };

      const originalEnv = process.env;
      process.env = { ...process.env, ...httpsEnv };

      try {
        // When: validateEnv is called
        const result = validateEnv();

        // Then: HTTPS URLs are accepted
        expect(result.NEXT_PUBLIC_SITE_URL).toBe(httpsEnv.NEXT_PUBLIC_SITE_URL);
        expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe(
          httpsEnv.NEXT_PUBLIC_SUPABASE_URL
        );
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe("1.1-UNIT-013: validateEnv rejects invalid input with appropriate errors", () => {
    it("should reject missing required variables with clear error messages", () => {
      // Given: Environment with missing required variables
      const originalEnv = process.env;
      process.env = {} as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with missing variables
        // Then: Should throw error with clear messages
        expect(() => validateEnv()).toThrow("Environment validation failed");
        expect(console.error).toHaveBeenCalledWith(
          "❌ Environment validation failed"
        );
        expect(console.error).toHaveBeenCalledWith(
          "Missing or invalid environment variables:"
        );
      } finally {
        process.env = originalEnv;
      }
    });

    it("should reject invalid URL format", () => {
      // Given: Environment with invalid URL
      const invalidEnv = {
        NEXT_PUBLIC_SITE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_URL: "also-not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
      };

      const originalEnv = process.env;
      process.env = { ...invalidEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with invalid URLs
        // Then: Should throw error
        expect(() => validateEnv()).toThrow("Environment validation failed");
      } finally {
        process.env = originalEnv;
      }
    });

    it("should reject empty required fields", () => {
      // Given: Environment with empty required fields
      const emptyEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", // Empty required field
      };

      const originalEnv = process.env;
      process.env = { ...emptyEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with empty required field
        // Then: Should throw error
        expect(() => validateEnv()).toThrow("Environment validation failed");
      } finally {
        process.env = originalEnv;
      }
    });

    it("should reject invalid NODE_ENV values", () => {
      // Given: Environment with invalid NODE_ENV
      const invalidNodeEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        NODE_ENV: "invalid-environment", // Invalid enum value
      };

      const originalEnv = process.env;
      process.env = { ...invalidNodeEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with invalid NODE_ENV
        // Then: Should throw error
        expect(() => validateEnv()).toThrow("Environment validation failed");
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe("1.1-UNIT-014: Feature flag transformation works correctly", () => {
    it('should transform string "true" to boolean true', () => {
      // Given: Feature flags set to string "true"
      const featureFlagsEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        NEXT_PUBLIC_ENABLE_DUE_DATES: "true",
        NEXT_PUBLIC_ENABLE_FINES: "true",
        NEXT_PUBLIC_ENABLE_HOLDS: "true",
        NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH: "true",
      };

      const originalEnv = process.env;
      process.env = { ...featureFlagsEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv processes feature flags
        const result = validateEnv();

        // Then: String values are correctly converted to boolean true
        expect(result.NEXT_PUBLIC_ENABLE_DUE_DATES).toBe(true);
        expect(result.NEXT_PUBLIC_ENABLE_FINES).toBe(true);
        expect(result.NEXT_PUBLIC_ENABLE_HOLDS).toBe(true);
        expect(result.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });

    it('should transform string "false" and other values to boolean false', () => {
      // Given: Feature flags set to various non-"true" values
      const featureFlagsEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        NEXT_PUBLIC_ENABLE_DUE_DATES: "false",
        NEXT_PUBLIC_ENABLE_FINES: "0",
        NEXT_PUBLIC_ENABLE_HOLDS: "no",
        NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH: "disabled",
      };

      const originalEnv = process.env;
      process.env = { ...featureFlagsEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv processes feature flags
        const result = validateEnv();

        // Then: Non-"true" values are converted to boolean false
        expect(result.NEXT_PUBLIC_ENABLE_DUE_DATES).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_FINES).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_HOLDS).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should apply default false when feature flags are not set", () => {
      // Given: Minimal environment without feature flags
      const minimalEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
      };

      const originalEnv = process.env;
      process.env = { ...minimalEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv processes environment without feature flags
        const result = validateEnv();

        // Then: Default false values are applied
        expect(result.NEXT_PUBLIC_ENABLE_DUE_DATES).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_FINES).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_HOLDS).toBe(false);
        expect(result.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe("Helper Functions", () => {
    beforeEach(() => {
      // Set up valid environment for helper function tests
      const validEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        NODE_ENV: "test",
      };
      process.env = { ...process.env, ...validEnv } as unknown as NodeJS.ProcessEnv;
    });

    it("should detect feature flags correctly with isFeatureEnabled", () => {
      const originalEnv = process.env;
      process.env = {
        ...process.env,
        NEXT_PUBLIC_ENABLE_DUE_DATES: "true",
        NEXT_PUBLIC_ENABLE_FINES: "false",
      };

      try {
        expect(isFeatureEnabled("NEXT_PUBLIC_ENABLE_DUE_DATES")).toBe(true);
        expect(isFeatureEnabled("NEXT_PUBLIC_ENABLE_FINES")).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should detect environment correctly", () => {
      const originalEnv = process.env;

      // Test development
      process.env = { ...process.env, NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv;
      expect(getEnvironment()).toBe("development");
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);

      // Test production
      process.env = { ...process.env, NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;
      expect(getEnvironment()).toBe("production");
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);

      process.env = originalEnv;
    });
  });

  describe("Debug Output", () => {
    it("should log configuration when DEBUG is enabled", () => {
      // Given: Environment with DEBUG enabled
      const debugEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        DEBUG: "true",
      };

      const originalEnv = process.env;
      process.env = { ...debugEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with DEBUG enabled
        validateEnv();

        // Then: Debug output is logged
        expect(console.log).toHaveBeenCalledWith(
          "✅ Environment validation successful"
        );
        expect(console.log).toHaveBeenCalledWith(
          "📋 Configuration:",
          expect.objectContaining({
            siteUrl: debugEnv.NEXT_PUBLIC_SITE_URL,
            environment: "development",
          })
        );
      } finally {
        process.env = originalEnv;
      }
    });

    it("should not log configuration when DEBUG is disabled", () => {
      // Given: Environment with DEBUG disabled
      const noDebugEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valid-key",
        DEBUG: "false",
      };

      const originalEnv = process.env;
      process.env = { ...noDebugEnv } as unknown as NodeJS.ProcessEnv;

      try {
        // When: validateEnv is called with DEBUG disabled
        validateEnv();

        // Then: Debug output is not logged
        expect(console.log).not.toHaveBeenCalledWith(
          "✅ Environment validation successful"
        );
      } finally {
        process.env = originalEnv;
      }
    });
  });
});
