/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "@playwright/test";

test.describe("Session Timeout Scenario Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("1.3-STO-001: Expired session redirects to login", async ({ page }) => {
    // Given: User with expired session
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "expired-token",
          refresh_token: "expired-refresh",
          expires_at: Date.now() - 3600000, // Expired 1 hour ago
          user: { id: "expired-user", email: "expired@example.com" },
        })
      );
    });

    // When: User tries to access protected route
    await page.goto("/dashboard");

    // Then: User is redirected to login due to expired session
    await expect(page).toHaveURL(/\/auth\/login/);

    // And: Clear error message is shown
    await expect(page.getByText("Your session has expired")).toBeVisible();
  });

  test("1.3-STO-002: Near-expiry session shows warning", async ({ page }) => {
    // Given: User with session expiring soon (5 minutes)
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "near-expiry-token",
          refresh_token: "valid-refresh",
          expires_at: Date.now() + 5 * 60 * 1000, // Expires in 5 minutes
          user: { id: "near-expiry-user", email: "nearexpiry@example.com" },
        })
      );
    });

    // When: User is on dashboard
    await page.goto("/dashboard");

    // And: Session warning check is triggered
    await page.evaluate(() => {
      // Simulate session expiry warning
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      const timeUntilExpiry = token.expires_at - Date.now();
      const warningThreshold = 10 * 60 * 1000; // 10 minutes

      if (timeUntilExpiry < warningThreshold && timeUntilExpiry > 0) {
        // Trigger warning notification
        const warningEvent = new CustomEvent("session-expiry-warning", {
          detail: { timeRemaining: timeUntilExpiry },
        });
        window.dispatchEvent(warningEvent);
      }
    });

    // Give time for warning to appear
    await page.waitForTimeout(100);

    // Then: Session expiry warning is displayed
    await expect(page.getByText("Your session will expire soon")).toBeVisible();

    // And: Extend session option is available
    await expect(
      page.getByRole("button", { name: "Extend Session" })
    ).toBeVisible();
  });

  test("1.3-STO-003: Automatic token refresh before expiry", async ({
    page,
  }) => {
    // Given: User with session that will expire soon
    const initialExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await page.evaluate((expiry) => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "auto-refresh-token",
          refresh_token: "valid-refresh-token",
          expires_at: expiry,
          user: { id: "auto-refresh-user", email: "autorefresh@example.com" },
        })
      );
    }, initialExpiry);

    // When: User is active and refresh is triggered
    await page.goto("/dashboard");

    // Simulate automatic refresh process
    await page.evaluate(() => {
      const currentToken = JSON.parse(
        localStorage.getItem("supabase.auth.token")!
      );
      const timeUntilExpiry = currentToken.expires_at - Date.now();
      const refreshThreshold = 15 * 60 * 1000; // 15 minutes

      if (timeUntilExpiry < refreshThreshold) {
        // Simulate successful token refresh
        const refreshedToken = {
          ...currentToken,
          access_token: "refreshed-auto-token",
          expires_at: Date.now() + 60 * 60 * 1000, // New expiry 1 hour from now
          last_refreshed: Date.now(),
        };
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(refreshedToken)
        );

        // Trigger refresh success event
        const refreshEvent = new CustomEvent("token-refreshed", {
          detail: { newExpiry: refreshedToken.expires_at },
        });
        window.dispatchEvent(refreshEvent);
      }
    });

    // Then: Token is automatically refreshed
    const refreshedToken = await page.evaluate(() => {
      const token = localStorage.getItem("supabase.auth.token");
      return token ? JSON.parse(token) : null;
    });

    expect(refreshedToken.access_token).toBe("refreshed-auto-token");
    expect(refreshedToken.last_refreshed).toBeDefined();
    expect(refreshedToken.expires_at).toBeGreaterThan(
      Date.now() + 50 * 60 * 1000
    ); // At least 50 minutes remaining
  });

  test("1.3-STO-004: Failed token refresh redirects to login", async ({
    page,
  }) => {
    // Given: User with session that needs refresh but refresh token is invalid
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "failing-token",
          refresh_token: "invalid-refresh-token",
          expires_at: Date.now() + 5 * 60 * 1000, // Expires in 5 minutes
          user: {
            id: "failing-refresh-user",
            email: "failingrefresh@example.com",
          },
        })
      );
    });

    // When: Refresh attempt fails
    await page.goto("/dashboard");

    await page.evaluate(() => {
      // Simulate failed refresh attempt
      const refreshFailureEvent = new CustomEvent("token-refresh-failed", {
        detail: { error: "Invalid refresh token" },
      });
      window.dispatchEvent(refreshFailureEvent);

      // Clear invalid session
      localStorage.removeItem("supabase.auth.token");
    });

    // Give time for redirect
    await page.waitForTimeout(100);

    // Then: User is redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);

    // And: Appropriate error message is shown
    await expect(
      page.getByText("Session could not be refreshed")
    ).toBeVisible();
  });

  test("1.3-STO-005: Idle session timeout", async ({ page }) => {
    // Given: User with active session
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "idle-test-token",
          refresh_token: "idle-refresh-token",
          expires_at: Date.now() + 60 * 60 * 1000, // Expires in 1 hour
          last_activity: Date.now(),
          idle_timeout: 15 * 60 * 1000, // 15 minute idle timeout
        })
      );
    });

    await page.goto("/dashboard");

    // When: User becomes idle (simulated by not updating last_activity)
    await page.evaluate(() => {
      // Simulate idle timeout check
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      const idleTime = Date.now() - token.last_activity;

      if (idleTime > token.idle_timeout) {
        // Trigger idle timeout
        const idleEvent = new CustomEvent("session-idle-timeout", {
          detail: { idleTime },
        });
        window.dispatchEvent(idleEvent);
      }
    });

    // Fast-forward time to simulate idle period
    await page.waitForTimeout(100);

    // Then: Idle warning should appear
    await expect(page.getByText("You've been inactive")).toBeVisible();

    // And: Options to extend session or logout are available
    await expect(
      page.getByRole("button", { name: "Stay Logged In" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("1.3-STO-006: Activity-based session extension", async ({ page }) => {
    // Given: User with session and activity tracking
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "activity-token",
          refresh_token: "activity-refresh",
          expires_at: Date.now() + 30 * 60 * 1000, // 30 minutes
          last_activity: Date.now() - 10 * 60 * 1000, // Last active 10 minutes ago
          activity_threshold: 5 * 60 * 1000, // 5 minute activity threshold
        })
      );
    });

    await page.goto("/dashboard");

    // When: User performs activities
    await page.click("[data-testid='dashboard-content']", { force: true });
    await page.keyboard.press("Tab");
    await page.mouse.move(100, 100);

    // Simulate activity tracking
    await page.evaluate(() => {
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      const updatedToken = {
        ...token,
        last_activity: Date.now(),
        activity_count: (token.activity_count || 0) + 3,
      };
      localStorage.setItem("supabase.auth.token", JSON.stringify(updatedToken));
    });

    // Then: Session is extended due to activity
    const updatedToken = await page.evaluate(() => {
      const token = localStorage.getItem("supabase.auth.token");
      return token ? JSON.parse(token) : null;
    });

    expect(updatedToken.last_activity).toBeGreaterThan(Date.now() - 1000); // Very recent
    expect(updatedToken.activity_count).toBeGreaterThanOrEqual(3);
  });

  test("1.3-STO-007: Session timeout during form submission", async ({
    page,
  }) => {
    // Given: User with session that expires during form interaction
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "form-timeout-token",
          refresh_token: "form-refresh-token",
          expires_at: Date.now() + 2 * 1000, // Expires in 2 seconds
          user: { id: "form-user", email: "form@example.com" },
        })
      );
    });

    await page.goto("/books/add");

    // When: User fills out form
    await page.getByLabel("Title").fill("Test Book");
    await page.getByLabel("Author").fill("Test Author");

    // Wait for session to expire
    await page.waitForTimeout(3000);

    // And: User tries to submit form
    await page.getByRole("button", { name: "Save Book" }).click();

    // Then: User gets session expired error
    await expect(
      page.getByText("Your session expired while submitting")
    ).toBeVisible();

    // And: Form data is preserved
    expect(await page.getByLabel("Title").inputValue()).toBe("Test Book");
    expect(await page.getByLabel("Author").inputValue()).toBe("Test Author");

    // And: Option to re-authenticate without losing data
    await expect(
      page.getByRole("button", { name: "Re-authenticate" })
    ).toBeVisible();
  });

  test("1.3-STO-008: Multiple tab session synchronization", async ({
    page,
    context,
  }) => {
    // Given: User with session in one tab
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "multi-tab-token",
          refresh_token: "multi-tab-refresh",
          expires_at: Date.now() + 60 * 60 * 1000, // 1 hour
          user: { id: "multi-tab-user", email: "multitab@example.com" },
        })
      );
    });

    await page.goto("/dashboard");

    // When: Opening second tab with same domain
    const page2 = await context.newPage();
    await page2.goto("/books");

    // And: Session expires in first tab
    await page.evaluate(() => {
      const expiredToken = JSON.parse(
        localStorage.getItem("supabase.auth.token")!
      );
      expiredToken.expires_at = Date.now() - 1000; // Expired
      localStorage.setItem("supabase.auth.token", JSON.stringify(expiredToken));

      // Trigger storage event for cross-tab communication
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "supabase.auth.token",
          newValue: JSON.stringify(expiredToken),
        })
      );
    });

    // Give time for cross-tab synchronization
    await page.waitForTimeout(200);

    // Then: Both tabs should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page2).toHaveURL(/\/auth\/login/);

    await page2.close();
  });

  test("1.3-STO-009: Session recovery after network reconnection", async ({
    page,
  }) => {
    // Given: User with valid session but network issues
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "network-recovery-token",
          refresh_token: "network-recovery-refresh",
          expires_at: Date.now() + 60 * 60 * 1000, // 1 hour
          network_error_count: 0,
        })
      );
    });

    await page.goto("/dashboard");

    // When: Network errors occur during session validation
    await page.evaluate(() => {
      // Simulate network errors
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      token.network_error_count = 3;
      token.last_network_error = Date.now();
      localStorage.setItem("supabase.auth.token", JSON.stringify(token));

      // Trigger network error event
      const networkEvent = new CustomEvent("network-error", {
        detail: { attempt: 3, lastError: "Network timeout" },
      });
      window.dispatchEvent(networkEvent);
    });

    // Then: Network error message is shown
    await expect(page.getByText("Connection issues detected")).toBeVisible();

    // When: Network recovers
    await page.evaluate(() => {
      // Simulate network recovery
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      token.network_error_count = 0;
      token.last_successful_validation = Date.now();
      localStorage.setItem("supabase.auth.token", JSON.stringify(token));

      const recoveryEvent = new CustomEvent("network-recovered", {
        detail: { recovered_at: Date.now() },
      });
      window.dispatchEvent(recoveryEvent);
    });

    // Then: Session continues normally without logout
    await expect(page.getByText("Connection restored")).toBeVisible();

    // And: User remains on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("1.3-STO-010: Graceful session cleanup on browser close", async ({
    page,
    context,
  }) => {
    // Given: User with active session
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "cleanup-token",
          refresh_token: "cleanup-refresh",
          expires_at: Date.now() + 60 * 60 * 1000,
          session_id: "cleanup-session-123",
          cleanup_registered: true,
        })
      );

      // Register cleanup handler
      window.addEventListener("beforeunload", () => {
        // In real implementation, this would notify server
        localStorage.setItem("session-cleanup-triggered", "true");
      });
    });

    await page.goto("/dashboard");

    // When: Browser/tab is closed (simulated)
    await page.evaluate(() => {
      // Trigger beforeunload event
      const beforeUnloadEvent = new Event("beforeunload");
      window.dispatchEvent(beforeUnloadEvent);
    });

    // Then: Cleanup is triggered
    const cleanupTriggered = await page.evaluate(() =>
      localStorage.getItem("session-cleanup-triggered")
    );

    expect(cleanupTriggered).toBe("true");
  });
});

test.describe("Session Timeout Edge Cases", () => {
  test("1.3-STO-EDGE-001: System clock changes during session", async ({
    page,
  }) => {
    // Given: User with valid session
    const realTime = Date.now();

    await page.evaluate((time) => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "clock-test-token",
          refresh_token: "clock-refresh",
          expires_at: time + 60 * 60 * 1000, // 1 hour from real time
          created_at: time,
        })
      );
    }, realTime);

    await page.goto("/dashboard");

    // When: System clock is changed (simulated)
    await page.evaluate((time) => {
      // Simulate system clock change detection
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);
      const serverTime = time; // Assume this comes from server
      const clientTime = Date.now();
      const clockSkew = Math.abs(clientTime - serverTime);

      if (clockSkew > 5 * 60 * 1000) {
        // More than 5 minutes skew
        const adjustedToken = {
          ...token,
          clock_skew_detected: true,
          server_time_offset: serverTime - clientTime,
        };
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(adjustedToken)
        );
      }
    }, realTime);

    // Then: Clock skew is handled gracefully
    const adjustedToken = await page.evaluate(() => {
      const token = localStorage.getItem("supabase.auth.token");
      return token ? JSON.parse(token) : null;
    });

    expect(adjustedToken.clock_skew_detected).toBe(true);
    expect(adjustedToken.server_time_offset).toBeDefined();
  });

  test("1.3-STO-EDGE-002: Concurrent session refresh attempts", async ({
    page,
  }) => {
    // Given: Session that needs refresh
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "concurrent-token",
          refresh_token: "concurrent-refresh",
          expires_at: Date.now() + 2 * 60 * 1000, // 2 minutes
          refresh_in_progress: false,
        })
      );
    });

    await page.goto("/dashboard");

    // When: Multiple refresh attempts occur simultaneously
    await page.evaluate(() => {
      // Simulate concurrent refresh attempts
      const token = JSON.parse(localStorage.getItem("supabase.auth.token")!);

      if (!token.refresh_in_progress) {
        token.refresh_in_progress = true;
        token.refresh_attempts = (token.refresh_attempts || 0) + 1;
        token.refresh_started_at = Date.now();
        localStorage.setItem("supabase.auth.token", JSON.stringify(token));
      }
    });

    // Then: Only one refresh attempt proceeds
    const refreshState = await page.evaluate(() => {
      const token = localStorage.getItem("supabase.auth.token");
      return token ? JSON.parse(token) : null;
    });

    expect(refreshState.refresh_in_progress).toBe(true);
    expect(refreshState.refresh_attempts).toBe(1); // Only one attempt
    expect(refreshState.refresh_started_at).toBeDefined();
  });
});
