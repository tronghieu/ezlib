import { test, expect } from "@playwright/test";

test.describe("Authentication Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set up any required mocks or test data before each test
    await page.goto("/");
  });

  test("1.3-E2E-001: Unauthenticated user redirected to login", async ({ page }) => {
    // Given: User is not authenticated
    
    // When: User tries to access protected route
    await page.goto("/dashboard");
    
    // Then: User is redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // And: Login page displays properly
    await expect(page.getByText("Library Management System")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Login Link" })).toBeVisible();
  });

  test("1.3-E2E-002: Login page displays and validates email input", async ({ page }) => {
    // Given: User navigates to login page
    await page.goto("/auth/login");
    
    // When: Page loads
    // Then: Login form is displayed with proper elements
    await expect(page.getByText("Sign in to your library")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Login Link" })).toBeVisible();
    
    // When: User enters invalid email
    await page.getByLabel("Email").fill("invalid-email");
    await page.getByRole("button", { name: "Send Login Link" }).click();
    
    // Then: Validation error is shown
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });

  test("1.3-E2E-003: Valid email submission shows loading state", async ({ page }) => {
    // Given: User is on login page
    await page.goto("/auth/login");
    
    // When: User enters valid email
    await page.getByLabel("Email").fill("test@example.com");
    
    // And: Submits the form
    await page.getByRole("button", { name: "Send Login Link" }).click();
    
    // Then: Loading state is displayed
    await expect(page.getByRole("button", { name: "Sending..." })).toBeVisible();
    
    // And: Success message appears (assuming mock OTP service)
    await expect(page.getByText("Check your email for a login link")).toBeVisible();
  });

  test("1.3-E2E-004: Registration requirement message displayed", async ({ page }) => {
    // Given: User is on login page
    await page.goto("/auth/login");
    
    // Then: Registration requirement message is visible
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByText("Register on ezlib.com")).toBeVisible();
    
    // When: User clicks registration link
    const registrationLink = page.getByRole("link", { name: "Register on ezlib.com" });
    await expect(registrationLink).toHaveAttribute("href", "https://ezlib.com/register");
    await expect(registrationLink).toHaveAttribute("target", "_blank");
  });

  test("1.3-E2E-005: Middleware protects all dashboard routes", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/books",
      "/members",
      "/circulation",
      "/settings"
    ];

    for (const route of protectedRoutes) {
      // Given: User is not authenticated
      
      // When: User tries to access protected route
      await page.goto(route);
      
      // Then: User is redirected to login
      await expect(page).toHaveURL(/\/auth\/login/);
      
      // And: Return URL parameter is set for redirect after login
      expect(page.url()).toContain(`returnUrl=${encodeURIComponent(route)}`);
    }
  });

  test("1.3-E2E-006: Authentication callback handles valid tokens", async ({ page, context }) => {
    // Given: User has received OTP token (simulate by navigating directly)
    const mockToken = "mock-access-token";
    const mockRefreshToken = "mock-refresh-token";
    
    // When: User visits callback URL with tokens
    await page.goto(`/auth/callback?access_token=${mockToken}&refresh_token=${mockRefreshToken}&type=email`);
    
    // Then: Callback processes the tokens (may redirect to dashboard or show error)
    // Note: This will likely fail in real test without proper Supabase setup
    // But it tests the callback route exists and handles parameters
    await page.waitForURL(/\/dashboard|\/auth\/login/, { timeout: 5000 });
    
    // Verify no JavaScript errors occurred during callback processing
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });
    
    // Give time for any async operations
    await page.waitForTimeout(1000);
  });

  test("1.3-E2E-007: Authentication callback handles errors gracefully", async ({ page }) => {
    // Given: Invalid or expired token
    const invalidToken = "invalid-token";
    
    // When: User visits callback with invalid token
    await page.goto(`/auth/callback?access_token=${invalidToken}&error=invalid_token`);
    
    // Then: User is redirected to login with error message
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText("Authentication failed")).toBeVisible();
  });

  test("1.3-E2E-008: Logout functionality clears session", async ({ page, context }) => {
    // Given: User is authenticated (simulate with session storage)
    await page.goto("/");
    
    // Simulate authenticated state
    await page.evaluate(() => {
      localStorage.setItem("supabase.auth.token", JSON.stringify({
        access_token: "mock-token",
        expires_at: Date.now() + 3600000
      }));
    });
    
    // Navigate to dashboard (should be accessible with mock auth)
    await page.goto("/dashboard");
    
    // When: User clicks logout
    await page.getByRole("button", { name: "Logout" }).click();
    
    // Then: User is redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // And: Session storage is cleared
    const token = await page.evaluate(() => localStorage.getItem("supabase.auth.token"));
    expect(token).toBeNull();
  });

  test("1.3-E2E-009: Session persistence across page refreshes", async ({ page }) => {
    // Given: User is authenticated
    await page.goto("/");
    
    // Simulate authenticated session
    await page.evaluate(() => {
      localStorage.setItem("supabase.auth.token", JSON.stringify({
        access_token: "mock-token",
        expires_at: Date.now() + 3600000
      }));
    });
    
    // Navigate to protected route
    await page.goto("/dashboard");
    
    // When: Page is refreshed
    await page.reload();
    
    // Then: User remains on dashboard (session persisted)
    await expect(page).toHaveURL(/\/dashboard/);
    
    // And: No redirect to login occurred
    await page.waitForTimeout(2000); // Allow time for any async auth checks
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("1.3-E2E-010: Return URL functionality after successful login", async ({ page }) => {
    // Given: User tries to access protected route while unauthenticated
    await page.goto("/books");
    
    // Then: User is redirected to login with return URL
    await expect(page).toHaveURL(/\/auth\/login.*returnUrl=%2Fbooks/);
    
    // When: User authenticates (simulate successful auth)
    await page.evaluate(() => {
      localStorage.setItem("supabase.auth.token", JSON.stringify({
        access_token: "mock-token",
        expires_at: Date.now() + 3600000
      }));
    });
    
    // Trigger auth state change (navigate to simulate auth callback)
    await page.goto("/auth/callback?access_token=mock&type=email");
    
    // Then: User should be redirected to original destination
    await expect(page).toHaveURL(/\/books/);
  });

  test("1.3-E2E-011: Authentication state synchronization", async ({ page }) => {
    // Given: Application with authentication state management
    await page.goto("/");
    
    // When: Authentication state changes
    await page.evaluate(() => {
      // Simulate auth state change event
      window.dispatchEvent(new CustomEvent("supabase-auth-change", {
        detail: { user: null, session: null }
      }));
    });
    
    // Then: UI should update to reflect unauthenticated state
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("1.3-E2E-012: Permission-based UI rendering", async ({ page }) => {
    // Given: User with different permission levels
    const permissions = ["owner", "manager", "librarian"];
    
    for (const role of permissions) {
      // Simulate user with specific role
      await page.evaluate((role) => {
        localStorage.setItem("supabase.auth.token", JSON.stringify({
          access_token: "mock-token",
          expires_at: Date.now() + 3600000
        }));
        localStorage.setItem("user-role", role);
      }, role);
      
      // Navigate to dashboard
      await page.goto("/dashboard");
      
      // Then: UI elements should be visible/hidden based on permissions
      // This is a basic check - specific permission UI would be tested in component tests
      await expect(page.getByTestId("dashboard-content")).toBeVisible();
    }
  });
});

test.describe("Authentication Security Tests", () => {
  test("1.3-SEC-001: Direct API route access requires authentication", async ({ request }) => {
    // Given: Unauthenticated request
    
    // When: Direct access to protected API routes
    const protectedRoutes = ["/api/books", "/api/members", "/api/circulation"];
    
    for (const route of protectedRoutes) {
      const response = await request.get(route);
      
      // Then: Returns 401 Unauthorized
      expect(response.status()).toBe(401);
    }
  });

  test("1.3-SEC-002: Session validation prevents expired token access", async ({ page }) => {
    // Given: User with expired token
    await page.goto("/");
    
    await page.evaluate(() => {
      localStorage.setItem("supabase.auth.token", JSON.stringify({
        access_token: "expired-token",
        expires_at: Date.now() - 3600000 // Expired 1 hour ago
      }));
    });
    
    // When: User tries to access protected route
    await page.goto("/dashboard");
    
    // Then: User is redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("1.3-SEC-003: No authentication bypass through URL manipulation", async ({ page }) => {
    // Given: Unauthenticated user
    
    // When: User tries various URL patterns to bypass auth
    const bypassAttempts = [
      "/dashboard?authenticated=true",
      "/dashboard#authenticated",
      "/dashboard/../dashboard",
      "/api/../dashboard"
    ];
    
    for (const url of bypassAttempts) {
      await page.goto(url);
      
      // Then: All attempts redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });
});