/**
 * E2E Tests for i18n Language Switching
 * Tests complete user journey for language switching functionality
 */

import { test, expect, type Page } from "@playwright/test";

// Test configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

// Test user credentials (use existing seeded user)
const TEST_USER = {
  email: "test.librarian@example.com",
};

// Helper to authenticate user via OTP
async function authenticateUser(page: Page, email: string) {
  // Navigate to login page
  await page.goto(`${BASE_URL}/auth/login`);

  // Enter email for OTP
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');

  // Wait for OTP sent confirmation
  await expect(page.getByText(/check your email|otp sent/i)).toBeVisible();

  // Open Mailpit in a new tab to get OTP
  const mailpitPage = await page.context().newPage();
  await mailpitPage.goto("http://localhost:54324");

  // Find the latest email
  await mailpitPage.waitForSelector(".message-list .message:first-child");
  await mailpitPage.click(".message-list .message:first-child");

  // Extract OTP from email content
  const emailContent = await mailpitPage.textContent(".message-content");
  const otpMatch = emailContent?.match(/\b(\d{6})\b/);
  const otp = otpMatch ? otpMatch[1] : null;

  expect(otp).toBeTruthy();

  // Close Mailpit tab
  await mailpitPage.close();

  // Return to login page and enter OTP
  await page.fill('input[name="otp"]', otp!);
  await page.click('button[type="submit"]');

  // Wait for successful authentication
  await expect(page).toHaveURL(/\/library-selection|\/[^/]+\/dashboard/);
}

test.describe("i18n Language Switching E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user before each test
    await authenticateUser(page, TEST_USER.email);

    // Navigate to a library dashboard (assuming test library exists)
    if (page.url().includes("/library-selection")) {
      // Click on the first available library
      await page.click(".library-card:first-child");
    }

    // Should now be on library dashboard
    await expect(page).toHaveURL(/\/[^/]+\/dashboard/);
  });

  test("should switch from English to Vietnamese and persist preference", async ({
    page,
  }) => {
    // Verify we start with English content
    await expect(page.getByText(/dashboard|library management/i)).toBeVisible();

    // Find the language switcher button
    const languageSwitcher = page
      .locator(
        '[data-testid="language-switcher"], button:has-text("English"), button:has(svg):has-text("English")'
      )
      .first();
    await expect(languageSwitcher).toBeVisible();

    // Click to open language dropdown
    await languageSwitcher.click();

    // Select Vietnamese option
    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await expect(vietnameseOption).toBeVisible();
    await vietnameseOption.click();

    // Wait for page to refresh and content to change to Vietnamese
    await page.waitForLoadState("networkidle");

    // Verify Vietnamese content appears
    // Note: This depends on actual Vietnamese translations being available
    await expect(
      page.locator('text="Bảng điều khiển", text="Quản lý thư viện"').first()
    ).toBeVisible({ timeout: 5000 });

    // Verify the language switcher now shows Vietnamese
    const updatedSwitcher = page
      .locator('button:has-text("Tiếng Việt")')
      .first();
    await expect(updatedSwitcher).toBeVisible();
  });

  test("should maintain language preference across page navigation", async ({
    page,
  }) => {
    // Switch to Vietnamese first
    const languageSwitcher = page.locator('button:has-text("English")').first();
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await vietnameseOption.click();

    await page.waitForLoadState("networkidle");

    // Navigate to a different page (e.g., settings if available)
    const navigationMenu = page
      .locator('nav, .sidebar, [role="navigation"]')
      .first();
    if (await navigationMenu.isVisible()) {
      // Try to find and click a navigation link
      const settingsLink = page
        .locator('text="Cài đặt", text="Settings", a:has-text("Settings")')
        .first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForLoadState("networkidle");
      }
    }

    // Verify Vietnamese language persists on the new page
    const persistedSwitcher = page
      .locator('button:has-text("Tiếng Việt")')
      .first();
    await expect(persistedSwitcher).toBeVisible();
  });

  test("should handle language switching errors gracefully", async ({
    page,
  }) => {
    // Mock API failure
    await page.route("/api/locale", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    // Attempt to switch language
    const languageSwitcher = page.locator('button:has-text("English")').first();
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await vietnameseOption.click();

    // Wait a moment for the failed request
    await page.waitForTimeout(2000);

    // Verify we remain in English (error should revert)
    const revertedSwitcher = page.locator('button:has-text("English")').first();
    await expect(revertedSwitcher).toBeVisible();

    // Verify English content is still displayed
    await expect(page.getByText(/dashboard|library management/i)).toBeVisible();
  });

  test("should show loading state during language switch", async ({ page }) => {
    // Slow down the API response to observe loading state
    await page.route("/api/locale", async (route) => {
      // Delay the response by 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.continue();
    });

    // Start language switch
    const languageSwitcher = page.locator('button:has-text("English")').first();
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await vietnameseOption.click();

    // Verify loading spinner appears
    const loadingSpinner = page.locator(
      '.animate-spin, [data-testid="loading-spinner"]'
    );
    await expect(loadingSpinner).toBeVisible({ timeout: 500 });

    // Verify button is disabled during loading
    await expect(languageSwitcher).toBeDisabled();

    // Wait for loading to complete
    await expect(loadingSpinner).not.toBeVisible({ timeout: 3000 });

    // Verify language switch completed
    const updatedSwitcher = page
      .locator('button:has-text("Tiếng Việt")')
      .first();
    await expect(updatedSwitcher).toBeVisible();
  });

  test("should work correctly on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify language switcher is still accessible on mobile
    const languageSwitcher = page.locator('button:has-text("English")').first();
    await expect(languageSwitcher).toBeVisible();

    // Perform language switch on mobile
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await expect(vietnameseOption).toBeVisible();
    await vietnameseOption.click();

    await page.waitForLoadState("networkidle");

    // Verify switch worked on mobile
    const updatedSwitcher = page
      .locator('button:has-text("Tiếng Việt")')
      .first();
    await expect(updatedSwitcher).toBeVisible();
  });

  test("should maintain language preference after browser refresh", async ({
    page,
  }) => {
    // Switch to Vietnamese
    const languageSwitcher = page.locator('button:has-text("English")').first();
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await vietnameseOption.click();

    await page.waitForLoadState("networkidle");

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify Vietnamese language persists after refresh
    const persistedSwitcher = page
      .locator('button:has-text("Tiếng Việt")')
      .first();
    await expect(persistedSwitcher).toBeVisible();

    // Verify Vietnamese content is displayed
    await expect(
      page.locator('text="Bảng điều khiển", text="Quản lý thư viện"').first()
    ).toBeVisible();
  });

  test("should switch back from Vietnamese to English", async ({ page }) => {
    // First switch to Vietnamese
    let languageSwitcher = page.locator('button:has-text("English")').first();
    await languageSwitcher.click();

    const vietnameseOption = page.locator('text="Tiếng Việt"').first();
    await vietnameseOption.click();

    await page.waitForLoadState("networkidle");

    // Now switch back to English
    languageSwitcher = page.locator('button:has-text("Tiếng Việt")').first();
    await languageSwitcher.click();

    const englishOption = page.locator('text="English"').first();
    await expect(englishOption).toBeVisible();
    await englishOption.click();

    await page.waitForLoadState("networkidle");

    // Verify we're back to English
    const finalSwitcher = page.locator('button:has-text("English")').first();
    await expect(finalSwitcher).toBeVisible();

    // Verify English content is displayed
    await expect(page.getByText(/dashboard|library management/i)).toBeVisible();
  });
});
