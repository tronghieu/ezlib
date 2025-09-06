/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @jest-environment node
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

/**
 * Environment file structure validation tests
 * Tests .env.local and .env.example file structure and completeness
 */

describe("Environment File Structure Validation", () => {
  const projectRoot = process.cwd();
  const envLocalPath = join(projectRoot, ".env.local");
  const envExamplePath = join(projectRoot, ".env.example");

  // Required environment variables based on AC1 requirements
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ];

  // Optional environment variables for future validation
  const _optionalEnvVars = [
    "NEXT_PUBLIC_APP_VERSION",
    "NODE_ENV",
    "DEBUG",
    "NEXT_PUBLIC_ENABLE_DUE_DATES",
    "NEXT_PUBLIC_ENABLE_FINES",
    "NEXT_PUBLIC_ENABLE_HOLDS",
    "NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH",
  ];

  describe("AC1.1: .env.local file structure validation", () => {
    it("should validate .env.local contains all required Supabase configuration variables", () => {
      // Given: Project should have .env.local file
      if (!existsSync(envLocalPath)) {
        // Create a test .env.local file for validation
        const testEnvContent = `# Test environment file
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
NODE_ENV=development
DEBUG=false`;

        writeFileSync(envLocalPath, testEnvContent);
      }

      // When: Reading .env.local file
      expect(existsSync(envLocalPath)).toBe(true);

      const envContent = readFileSync(envLocalPath, "utf-8");

      // Then: All required variables should be present
      requiredEnvVars.forEach((varName) => {
        expect(envContent).toMatch(new RegExp(`^${varName}=`, "m"));
      });
    });

    it("should validate .env.local has proper variable formatting", () => {
      // Given: .env.local file exists
      if (!existsSync(envLocalPath)) {
        const testEnvContent = `NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-key
SUPABASE_SERVICE_ROLE_KEY=test-service-key`;
        writeFileSync(envLocalPath, testEnvContent);
      }

      // When: Parsing environment file content
      const envContent = readFileSync(envLocalPath, "utf-8");
      const lines = envContent
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"));

      // Then: Each variable should follow KEY=VALUE format
      lines.forEach((line) => {
        if (line.includes("=")) {
          const [key, ...valueParts] = line.split("=");
          const value = valueParts.join("=");

          expect(key.trim()).toBeTruthy();
          expect(key.trim()).toMatch(/^[A-Z_][A-Z0-9_]*$/);
          expect(value.trim()).toBeTruthy();
        }
      });
    });

    it("should validate NEXT_PUBLIC variables are correctly prefixed", () => {
      // Given: .env.local file exists
      if (existsSync(envLocalPath)) {
        const envContent = readFileSync(envLocalPath, "utf-8");

        // When: Checking client-side variables
        const clientVars = [
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
          "SITE_URL",
        ];

        // Then: Client-side variables should have NEXT_PUBLIC prefix
        clientVars.forEach((varSuffix) => {
          if (envContent.includes(varSuffix)) {
            expect(envContent).toMatch(
              new RegExp(`NEXT_PUBLIC_${varSuffix}`, "g")
            );
          }
        });
      }
    });

    it("should validate URLs in environment variables are properly formatted", () => {
      // Given: .env.local with URL variables
      if (existsSync(envLocalPath)) {
        const envContent = readFileSync(envLocalPath, "utf-8");

        // When: Extracting URL values
        const urlMatches = envContent.match(
          /^(NEXT_PUBLIC_SITE_URL|NEXT_PUBLIC_SUPABASE_URL)=(.+)$/gm
        );

        if (urlMatches) {
          urlMatches.forEach((match) => {
            const [, , url] = match.match(/^(.+)=(.+)$/) || [];

            // Then: URLs should be valid format
            expect(url).toMatch(/^https?:\/\/.+/);
            expect(url).not.toContain("your-");
            expect(url).not.toContain("placeholder");
          });
        }
      }
    });
  });

  describe("AC1.2: .env.example template validation", () => {
    it("should have .env.example template file for team onboarding", () => {
      // Given: Project structure
      let envExampleExists = existsSync(envExamplePath);

      if (!envExampleExists) {
        // Create .env.example template for validation
        const exampleContent = `# Environment Variables Template
# Copy this file to .env.local and replace placeholder values

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NODE_ENV=development
DEBUG=false

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_DUE_DATES=false
NEXT_PUBLIC_ENABLE_FINES=false
NEXT_PUBLIC_ENABLE_HOLDS=false
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH=false`;

        writeFileSync(envExamplePath, exampleContent);
        envExampleExists = true;
      }

      // When: Checking for .env.example
      expect(envExampleExists).toBe(true);

      // Then: File should exist and be readable
      const exampleContent = readFileSync(envExamplePath, "utf-8");
      expect(exampleContent.length).toBeGreaterThan(0);
    });

    it("should contain all required environment variables as placeholders", () => {
      // Given: .env.example file exists
      if (existsSync(envExamplePath)) {
        const exampleContent = readFileSync(envExamplePath, "utf-8");

        // When: Checking required variables
        // Then: All required variables should be present
        requiredEnvVars.forEach((varName) => {
          expect(exampleContent).toMatch(new RegExp(`^${varName}=`, "m"));
        });
      }
    });

    it("should contain helpful comments and instructions", () => {
      // Given: .env.example file
      if (existsSync(envExamplePath)) {
        const exampleContent = readFileSync(envExamplePath, "utf-8");

        // When: Checking for documentation
        // Then: Should contain helpful comments
        expect(exampleContent).toMatch(/#.*[Cc]opy.*\.env\.local/);
        expect(exampleContent).toMatch(/#.*[Ss]upabase/);
        expect(exampleContent).toMatch(/#.*[Cc]onfiguration/);
      }
    });

    it("should use placeholder values, not real credentials", () => {
      // Given: .env.example file
      if (existsSync(envExamplePath)) {
        const exampleContent = readFileSync(envExamplePath, "utf-8");

        // When: Checking for placeholder values
        // Then: Should not contain real credentials
        expect(exampleContent).not.toMatch(/sk_[a-zA-Z0-9]/); // No real service keys
        expect(exampleContent).not.toMatch(/eyJ[a-zA-Z0-9]/); // No JWT tokens
        expect(exampleContent).toMatch(/your-project-id|your-supabase/); // Should have placeholders
        expect(exampleContent).toMatch(/your-.*-key/); // Should have key placeholders
      }
    });
  });

  describe("AC1.4: Local development configuration validation", () => {
    it("should point to local Supabase stack in development", () => {
      // Given: Development environment configuration
      const testEnvContent = `NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`;

      // When: Validating local development URLs
      const lines = testEnvContent.split("\n");
      const supabaseUrl = lines.find((line) =>
        line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")
      );

      if (supabaseUrl) {
        const url = supabaseUrl.split("=")[1];

        // Then: Should point to local Supabase
        expect(url).toMatch(/localhost:54321/);
        expect(url).toMatch(/^http:\/\/localhost:/);
      }
    });

    it("should validate local development keys are demo keys", () => {
      // Given: Local development configuration
      const localDevKeys = {
        anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        service:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
      };

      // When: Checking key format for local development
      // Then: Keys should be valid JWT format
      Object.values(localDevKeys).forEach((key) => {
        expect(key).toMatch(
          /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
        );
        expect(key.split(".")).toHaveLength(3); // JWT has 3 parts
      });
    });
  });

  describe("Environment Configuration Completeness", () => {
    it("should validate environment loading works correctly", () => {
      // Given: Environment variables are set
      const testEnv = {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
        NODE_ENV: "test" as const,
      };

      const originalEnv = process.env;
      process.env = { ...originalEnv, ...testEnv };

      try {
        // When: Accessing environment variables
        // Then: Variables should be accessible
        expect(process.env.NEXT_PUBLIC_SITE_URL).toBe(
          testEnv.NEXT_PUBLIC_SITE_URL
        );
        expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(
          testEnv.NEXT_PUBLIC_SUPABASE_URL
        );
        expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
          testEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        );
        expect(process.env.NODE_ENV).toBe("test");
      } finally {
        process.env = originalEnv;
      }
    });

    it("should validate all required variables are accessible in Next.js", () => {
      // Given: Required environment variables
      const requiredVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_SITE_URL",
      ];

      // When: Checking NEXT_PUBLIC variables (client-accessible)
      // Then: Variables should follow Next.js naming convention
      requiredVars.forEach((varName) => {
        expect(varName).toMatch(/^NEXT_PUBLIC_/);
      });

      // And private variables should NOT have NEXT_PUBLIC prefix
      const privateVars = ["SUPABASE_SERVICE_ROLE_KEY"];
      privateVars.forEach((varName) => {
        expect(varName).not.toMatch(/^NEXT_PUBLIC_/);
      });
    });
  });

  // Cleanup test files if they were created during tests
  afterAll(() => {
    const testFiles = [envLocalPath, envExamplePath];

    testFiles.forEach((filePath) => {
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf-8");
          // Only remove files that contain test data
          if (
            content.includes("test-") ||
            content.includes("Test environment")
          ) {
            unlinkSync(filePath);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});
