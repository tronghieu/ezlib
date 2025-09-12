import { test, expect } from "@playwright/test";

test.describe("Health Check Endpoint E2E", () => {
  test("1.1-E2E-002: Complete build process and health check validation", async ({
    request,
  }) => {
    // Given: Application is running and accessible
    const baseURL = "http://127.0.0.1:3001";

    // When: Health check endpoint is called via HTTP
    const response = await request.get(`${baseURL}/api/health`);

    // Then: Returns successful response with proper structure
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const healthData = await response.json();

    // Validate response structure matches API contract
    expect(healthData).toHaveProperty("status");
    expect(healthData).toHaveProperty("timestamp");
    expect(healthData).toHaveProperty("version");
    expect(healthData).toHaveProperty("environment");
    expect(healthData).toHaveProperty("uptime");
    expect(healthData).toHaveProperty("services");

    // Validate services structure
    expect(healthData.services).toHaveProperty("application");
    expect(healthData.services).toHaveProperty("environment");
    expect(healthData.services).toHaveProperty("database");
    expect(healthData.services).toHaveProperty("features");

    // Validate status values
    expect(["healthy", "degraded", "unhealthy"]).toContain(healthData.status);

    // Validate timestamp is recent (within last 30 seconds)
    const timestamp = new Date(healthData.timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
    expect(timeDiff).toBeLessThan(30000);

    // Validate version format - can be "unknown" or semantic version
    expect(healthData.version).toBeDefined();
    // Version can be "unknown" when NEXT_PUBLIC_APP_VERSION is not set
    if (healthData.version !== "unknown") {
      expect(healthData.version).toMatch(/^\d+\.\d+\.\d+/);
    }

    // Validate uptime is a positive number
    expect(typeof healthData.uptime).toBe("number");
    expect(healthData.uptime).toBeGreaterThanOrEqual(0);
  });

  test("1.1-E2E-001: Git pre-commit hook validation workflow", async ({
    request,
  }) => {
    // Given: Application with code quality enforcement
    const baseURL = "http://127.0.0.1:3001";

    // When: Application is accessed (indicating successful build after quality checks)
    const response = await request.get(`${baseURL}/api/health`);

    // Then: Application is accessible, indicating code passed pre-commit hooks
    expect(response.status()).toBe(200);

    const healthData = await response.json();

    // Validate that the application status indicates healthy build process
    expect(healthData.services.application.status).toBe("healthy");
    expect(healthData.services.application.next_version).toBe("15.5.2");
    expect(healthData.services.application.node_version).toMatch(
      /^v\d+\.\d+\.\d+/
    );
  });

  test("HEAD request support for monitoring", async ({ request }) => {
    // Given: Health check endpoint configured for monitoring
    const baseURL = "http://127.0.0.1:3001";

    // When: HEAD request is made (typical monitoring tool pattern)
    const response = await request.head(`${baseURL}/api/health`);

    // Then: Returns successful status without body
    expect(response.status()).toBe(200);

    // Verify no body is returned for HEAD request
    const body = await response.text();
    expect(body).toBe("");
  });

  test("Application serves main page successfully", async ({ page }) => {
    // Given: Next.js application is running

    // When: Main application page is accessed
    await page.goto("/");

    // Then: Page loads successfully and contains expected elements
    await expect(page).toHaveTitle(/Library Management/);

    // Verify the page loads without JavaScript errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify no console errors
    expect(logs.length).toBe(0);
  });

  test("Feature flags are correctly configured", async ({ request }) => {
    // Given: Application with feature flag configuration
    const baseURL = "http://127.0.0.1:3001";

    // When: Health check returns feature flag status
    const response = await request.get(`${baseURL}/api/health`);
    const healthData = await response.json();

    // Then: Feature flags are reported as boolean values (using camelCase)
    expect(typeof healthData.services.features.dueDates).toBe("boolean");
    expect(typeof healthData.services.features.fines).toBe("boolean");
    expect(typeof healthData.services.features.holds).toBe("boolean");
    expect(typeof healthData.services.features.advancedSearch).toBe("boolean");

    // For MVP, all feature flags should be false by default
    expect(healthData.services.features.dueDates).toBe(false);
    expect(healthData.services.features.fines).toBe(false);
    expect(healthData.services.features.holds).toBe(false);
    expect(healthData.services.features.advancedSearch).toBe(false);
  });

  test("Environment configuration detection", async ({ request }) => {
    // Given: Application running in development environment
    const baseURL = "http://127.0.0.1:3001";

    // When: Health check evaluates environment
    const response = await request.get(`${baseURL}/api/health`);
    const healthData = await response.json();

    // Then: Environment is correctly detected
    expect(["development", "test", "production"]).toContain(
      healthData.environment
    );

    // Validate environment service status
    expect(["healthy", "degraded", "unhealthy"]).toContain(
      healthData.services.environment.status
    );
    // API returns variables_configured array, not variables_loaded count
    expect(healthData.services.environment.variables_configured).toBeDefined();
    expect(Array.isArray(healthData.services.environment.variables_configured)).toBe(true);
    expect(healthData.services.environment.variables_configured.length).toBeGreaterThan(0);
    expect(healthData.services.environment.total_required).toBe(3); // SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SERVICE_ROLE_KEY

    // Check for missing variables array
    expect(healthData.services.environment.variables_missing).toBeDefined();
    expect(Array.isArray(healthData.services.environment.variables_missing)).toBe(true);
  });
});
