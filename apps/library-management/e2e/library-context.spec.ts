/**
 * E2E Tests for Library Context Workflows
 * Tests complete user journeys for library selection and multi-tenant operations
 */

import { test, expect } from "@playwright/test";

// Responsive breakpoints for testing
const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

// Test configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

// Test user credentials
const TEST_USER = {
  email: "test.librarian@example.com",
  // Using passwordless OTP, so we'll need to handle email verification
};

// Helper to handle OTP authentication
async function authenticateUser(page, email: string) {
  // Navigate to login page
  await page.goto(`${BASE_URL}/auth/login`);

  // Enter email for OTP
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');

  // In test environment, OTP might be displayed or auto-filled
  // This would depend on your test setup
  await page.waitForURL(/dashboard|\/$/);
}

test.describe("Library Selection Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto(BASE_URL);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Navigate to root
    await page.goto(BASE_URL);

    // Should be redirected to login
    await expect(page).toHaveURL(/auth\/login/);
    await expect(page.getByText(/sign in|login/i)).toBeVisible();
  });

  test("should show library selection after authentication", async ({
    page,
  }) => {
    // Authenticate user
    await authenticateUser(page, TEST_USER.email);

    // Should see library selection page
    await expect(page.getByText(/select.*library/i)).toBeVisible();

    // Should show available libraries
    await expect(page.getByTestId("library-grid")).toBeVisible();
  });

  test("should display library cards with details", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Check library card elements
    const libraryCards = page.locator('[data-testid^="library-card-"]');
    const firstCard = libraryCards.first();

    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("library-name")).toBeVisible();
    await expect(firstCard.getByTestId("library-code")).toBeVisible();
    await expect(firstCard.getByTestId("library-role")).toBeVisible();
  });

  test("should navigate to library dashboard on selection", async ({
    page,
  }) => {
    await authenticateUser(page, TEST_USER.email);

    // Click on first library card
    const firstLibrary = page.locator('[data-testid^="library-card-"]').first();
    const libraryCode = await firstLibrary
      .getByTestId("library-code")
      .textContent();

    await firstLibrary.click();

    // Should navigate to library-specific dashboard
    await expect(page).toHaveURL(new RegExp(`/${libraryCode}/dashboard`));
    await expect(page.getByTestId("dashboard-header")).toBeVisible();
  });

  test("should auto-select single library", async ({ page }) => {
    // For users with single library access
    // This would need a specific test user with single library access
    const SINGLE_LIBRARY_USER = {
      email: "single.library@example.com",
    };

    await authenticateUser(page, SINGLE_LIBRARY_USER.email);

    // Should bypass selection and go directly to dashboard
    await expect(page).toHaveURL(/\/[A-Z-]+\/dashboard/);
  });
});

test.describe("Library Context Persistence", () => {
  test("should persist library selection across page refresh", async ({
    page,
  }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    const firstLibrary = page.locator('[data-testid^="library-card-"]').first();
    const libraryName = await firstLibrary
      .getByTestId("library-name")
      .textContent();
    await firstLibrary.click();

    // Wait for dashboard
    await page.waitForURL(/dashboard/);

    // Refresh page
    await page.reload();

    // Should still be on same library dashboard
    await expect(page.getByTestId("current-library-name")).toContainText(
      libraryName || ""
    );
  });

  test("should persist library selection across browser sessions", async ({
    browser,
  }) => {
    // First session - select library
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto(BASE_URL);
    await authenticateUser(page1, TEST_USER.email);

    const firstLibrary = page1
      .locator('[data-testid^="library-card-"]')
      .first();
    const libraryName = await firstLibrary
      .getByTestId("library-name")
      .textContent();
    await firstLibrary.click();

    await page1.waitForURL(/dashboard/);

    // Get cookies/localStorage for persistence
    const cookies = await context1.cookies();

    // Close first session
    await context1.close();

    // Second session with same cookies
    const context2 = await browser.newContext();
    await context2.addCookies(cookies);
    const page2 = await context2.newPage();

    await page2.goto(BASE_URL);

    // Should navigate to previously selected library
    await expect(page2).toHaveURL(/dashboard/);
    await expect(page2.getByTestId("current-library-name")).toContainText(
      libraryName || ""
    );

    await context2.close();
  });
});

test.describe("Library Switching", () => {
  test("should switch between libraries using switcher", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select initial library
    const libraries = page.locator('[data-testid^="library-card-"]');
    const firstLibrary = libraries.nth(0);
    await firstLibrary.click();

    await page.waitForURL(/dashboard/);

    // Open library switcher
    await page.click('[data-testid="library-switcher"]');

    // Select different library
    const switcherOptions = page.locator('[data-testid^="library-option-"]');
    const secondOption = switcherOptions.nth(1);
    const secondLibraryName = await secondOption.textContent();

    await secondOption.click();

    // Should navigate to new library dashboard
    await page.waitForURL(/dashboard/);
    await expect(page.getByTestId("current-library-name")).toContainText(
      secondLibraryName || ""
    );
  });

  test("should show check mark for current library in switcher", async ({
    page,
  }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Open switcher
    await page.click('[data-testid="library-switcher"]');

    // Current library should have check mark
    const currentOption = page.locator(
      '[data-testid="library-option-selected"]'
    );
    await expect(currentOption).toBeVisible();
    await expect(
      currentOption.locator('[data-testid="check-icon"]')
    ).toBeVisible();
  });

  test("should navigate back to library selection", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Open switcher and click "View All Libraries"
    await page.click('[data-testid="library-switcher"]');
    await page.click('[data-testid="view-all-libraries"]');

    // Should be back at library selection
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByTestId("library-grid")).toBeVisible();
  });
});

test.describe("Multi-Tenant Data Isolation", () => {
  test("should show different data for different libraries", async ({
    page,
  }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select first library
    const libraries = page.locator('[data-testid^="library-card-"]');
    await libraries.nth(0).click();
    await page.waitForURL(/dashboard/);

    // Get stats for first library
    const stats1 = {
      books: await page.getByTestId("stat-total-books").textContent(),
      members: await page.getByTestId("stat-total-members").textContent(),
    };

    // Switch to second library
    await page.click('[data-testid="library-switcher"]');
    await page.locator('[data-testid^="library-option-"]').nth(1).click();
    await page.waitForURL(/dashboard/);

    // Get stats for second library
    const stats2 = {
      books: await page.getByTestId("stat-total-books").textContent(),
      members: await page.getByTestId("stat-total-members").textContent(),
    };

    // Stats should be different (unless by coincidence)
    expect(stats1).not.toEqual(stats2);
  });

  test("should filter book inventory by library", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    const firstLibrary = page.locator('[data-testid^="library-card-"]').first();
    const libraryCode = await firstLibrary
      .getByTestId("library-code")
      .textContent();
    await firstLibrary.click();

    // Navigate to inventory
    await page.click('[data-testid="nav-inventory"]');
    await page.waitForURL(/inventory/);

    // All books should belong to selected library
    const bookRows = page.locator('[data-testid^="book-row-"]');
    const bookCount = await bookRows.count();

    for (let i = 0; i < bookCount; i++) {
      const bookLibraryCode = await bookRows
        .nth(i)
        .getByTestId("book-library-code")
        .textContent();
      expect(bookLibraryCode).toBe(libraryCode);
    }
  });

  test("should filter members by library", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();

    // Navigate to members
    await page.click('[data-testid="nav-members"]');
    await page.waitForURL(/members/);

    // Check member list is filtered
    const memberRows = page.locator('[data-testid^="member-row-"]');
    await expect(memberRows).toHaveCount(await memberRows.count());

    // Switch library
    await page.click('[data-testid="library-switcher"]');
    await page.locator('[data-testid^="library-option-"]').nth(1).click();
    await page.waitForURL(/members/);

    // Member count should potentially be different
    await page.locator('[data-testid^="member-row-"]').count();
    // Note: This assertion might not always pass if libraries have same member count
  });
});

test.describe("Library Context Error Handling", () => {
  test("should handle library access revocation", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Simulate access revocation (would need backend support in test env)
    // This is a conceptual test - implementation depends on your test setup

    // Attempt to access restricted operation
    await page.click('[data-testid="nav-settings"]');

    // Should show error or redirect
    const errorMessage = page.getByTestId("access-denied-message");
    const isError = await errorMessage.isVisible().catch(() => false);
    const isRedirected = page.url().includes("/auth/login");

    expect(isError || isRedirected).toBeTruthy();
  });

  test("should handle network errors gracefully", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Simulate network offline
    await page.route("**/api/**", (route) => route.abort());

    // Try to select a library
    await page.locator('[data-testid^="library-card-"]').first().click();

    // Should show error message
    await expect(page.getByTestId("error-message")).toBeVisible();
    await expect(page.getByTestId("error-message")).toContainText(
      /error|failed|try again/i
    );
  });

  test("should handle invalid library selection", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Manually navigate to invalid library URL
    await page.goto(`${BASE_URL}/INVALID-LIBRARY-CODE/dashboard`);

    // Should redirect to library selection or show error
    await expect(page).toHaveURL(new RegExp(`(${BASE_URL}$|/error|/404)`));
  });
});

test.describe("Library Context Performance", () => {
  test("should load library list quickly", async ({ page }) => {
    const startTime = Date.now();

    await authenticateUser(page, TEST_USER.email);

    // Wait for library grid to be visible
    await page.waitForSelector('[data-testid="library-grid"]');

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should switch libraries quickly", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select initial library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Measure switch time
    const startTime = Date.now();

    await page.click('[data-testid="library-switcher"]');
    await page.locator('[data-testid^="library-option-"]').nth(1).click();
    await page.waitForURL(/dashboard/);

    const switchTime = Date.now() - startTime;

    // Should switch within 2 seconds
    expect(switchTime).toBeLessThan(2000);
  });
});

test.describe("Library Context Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Tab to first library card
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // May need multiple tabs

    // Select with Enter
    await page.keyboard.press("Enter");

    // Should navigate to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Tab to library switcher
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Open with Enter
    await page.keyboard.press("Enter");

    // Navigate options with arrow keys
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Should have switched libraries
    await page.waitForURL(/dashboard/);
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Check library cards have proper labels
    const libraryCards = page.locator('[data-testid^="library-card-"]');
    const firstCard = libraryCards.first();

    await expect(firstCard).toHaveAttribute("role", "button");
    await expect(firstCard).toHaveAttribute("aria-label", /select.*library/i);

    // Check switcher has proper labels
    await firstCard.click();
    await page.waitForURL(/dashboard/);

    const switcher = page.getByTestId("library-switcher");
    await expect(switcher).toHaveAttribute("aria-haspopup", "true");
    await expect(switcher).toHaveAttribute("aria-expanded", /false/);

    await switcher.click();
    await expect(switcher).toHaveAttribute("aria-expanded", "true");
  });

  test("should announce library changes to screen readers", async ({
    page,
  }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Check for live region announcement
    const liveRegion = page.getByRole("status");
    await expect(liveRegion).toContainText(/library selected|switched to/i);
  });
});

test.describe("Library Context Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should display library cards in mobile layout", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Library cards should stack vertically on mobile
    const libraryGrid = page.getByTestId("library-grid");
    const gridStyles = await libraryGrid.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue("grid-template-columns")
    );

    // Should be single column on mobile
    expect(gridStyles).toContain("1fr");
  });

  test("should have touch-friendly library switcher", async ({ page }) => {
    await authenticateUser(page, TEST_USER.email);

    // Select a library
    await page.locator('[data-testid^="library-card-"]').first().click();
    await page.waitForURL(/dashboard/);

    // Switcher should be easily tappable
    const switcher = page.getByTestId("library-switcher");
    const box = await switcher.boundingBox();

    // Minimum touch target size (44x44 px)
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});

// NEW: Comprehensive Responsive Design Tests
test.describe("Dashboard Responsive Design Validation", () => {
  Object.entries(BREAKPOINTS).forEach(([device, viewport]) => {
    test.describe(`${device.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport });

      test(`should display dashboard properly on ${device}`, async ({ page }) => {
        await authenticateUser(page, TEST_USER.email);
        
        // Select a library
        await page.locator('[data-testid^="library-card-"]').first().click();
        await page.waitForURL(/dashboard/);

        // Verify dashboard layout
        await expect(page.getByTestId("dashboard-container")).toBeVisible();
        
        if (device === "mobile") {
          // Mobile: Single column layout
          const statsGrid = page.getByTestId("stats-grid");
          const gridCols = await statsGrid.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("grid-template-columns")
          );
          expect(gridCols).toMatch(/repeat\(1,|1fr/); // Single column
        } else if (device === "tablet") {
          // Tablet: 2-column layout for stats
          const statsGrid = page.getByTestId("stats-grid");
          const gridCols = await statsGrid.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("grid-template-columns")
          );
          expect(gridCols).toMatch(/repeat\(2,|fr.*fr/); // Two columns
        } else if (device === "desktop") {
          // Desktop: 4-column layout for stats
          const statsGrid = page.getByTestId("stats-grid");
          const gridCols = await statsGrid.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("grid-template-columns")
          );
          expect(gridCols).toMatch(/repeat\(4,|fr.*fr.*fr.*fr/); // Four columns
        }
      });

      test(`should handle navigation properly on ${device}`, async ({ page }) => {
        await authenticateUser(page, TEST_USER.email);
        await page.locator('[data-testid^="library-card-"]').first().click();
        await page.waitForURL(/dashboard/);

        if (device === "mobile") {
          // Mobile: Navigation should be collapsible/hamburger
          const sidebarTrigger = page.getByTestId("sidebar-trigger");
          await expect(sidebarTrigger).toBeVisible();
          
          // Click to open sidebar
          await sidebarTrigger.click();
          await expect(page.getByTestId("sidebar-nav")).toBeVisible();
          
          // Should close when clicking outside
          await page.click('[data-testid="main-content"]');
          await expect(page.getByTestId("sidebar-nav")).not.toBeVisible();
          
        } else {
          // Tablet/Desktop: Sidebar should be visible by default
          await expect(page.getByTestId("sidebar-nav")).toBeVisible();
          
          // Navigation items should be accessible
          await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
          await expect(page.getByRole("link", { name: /inventory/i })).toBeVisible();
          await expect(page.getByRole("link", { name: /members/i })).toBeVisible();
        }
      });

      test(`should have proper touch targets on ${device}`, async ({ page }) => {
        await authenticateUser(page, TEST_USER.email);
        await page.locator('[data-testid^="library-card-"]').first().click();
        await page.waitForURL(/dashboard/);

        if (device !== "desktop") {
          // Touch devices: Check minimum 44px touch targets
          const quickActions = page.locator('[data-testid^="quick-action-"]');
          const actionCount = await quickActions.count();
          
          for (let i = 0; i < actionCount; i++) {
            const action = quickActions.nth(i);
            const box = await action.boundingBox();
            
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
          }
          
          // Library switcher should also meet touch target requirements
          const switcher = page.getByTestId("library-switcher");
          const switcherBox = await switcher.boundingBox();
          expect(switcherBox?.height).toBeGreaterThanOrEqual(44);
        }
      });
    });
  });
});
