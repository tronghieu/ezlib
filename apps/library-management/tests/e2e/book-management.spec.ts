/**
 * Book Management E2E Tests
 * End-to-end tests for complete book list workflow
 */

import { test, expect } from "@playwright/test";

test.describe("Book Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto("/auth/login");

    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user-id", email: "test@library.com" },
        })
      );
    });

    // Navigate to a test library
    await page.goto("/CCL-MAIN/books");

    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Books List Page", () => {
    test("should display books page with correct layout", async ({ page }) => {
      // Check page title and header
      await expect(page.locator("h1")).toContainText("Books");
      await expect(page.locator("p")).toContainText(
        "Manage your library's book inventory and availability"
      );

      // Check Add New Book button is prominent
      await expect(page.locator('text="Add New Book"')).toBeVisible();

      // Check table structure
      await expect(page.locator("table")).toBeVisible();
      await expect(page.locator("th")).toContainText([
        "Title",
        "Author",
        "Publisher",
        "Year",
        "ISBN",
        "Status",
      ]);
    });

    test("should be mobile responsive", async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still be functional
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('text="Add New Book"')).toBeVisible();
      await expect(page.locator("table")).toBeVisible();

      // Search input should be responsive
      const searchInput = page.locator('input[placeholder*="Search books"]');
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should search books by title", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search books"]');

      // Type in search query
      await searchInput.fill("javascript");

      // Wait for debounced search
      await page.waitForTimeout(400);

      // Should show search results (at least 1 result)
      const searchResults = page.locator("table tbody tr");
      await expect(searchResults).toHaveCount(1);

      // Search results should contain the query
      const bookTitles = page.locator("table tbody td:first-child");
      await expect(bookTitles.first()).toContainText(/javascript/i);
    });

    test("should search books by author", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search books"]');

      // Search for an author
      await searchInput.fill("Doe");
      await page.waitForTimeout(400);

      // Should find books by that author
      const authorCells = page.locator("table tbody td:nth-child(2)");
      await expect(authorCells.first()).toContainText(/Doe/i);
    });

    test("should show no results message for invalid search", async ({
      page,
    }) => {
      const searchInput = page.locator('input[placeholder*="Search books"]');

      await searchInput.fill("xyznonexistentbook123");
      await page.waitForTimeout(400);

      // Should show no results message
      await expect(page.locator('text="No books found"')).toBeVisible();
      await expect(page.locator('text="Clear search"')).toBeVisible();
    });

    test("should clear search results", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search books"]');

      // Perform search
      await searchInput.fill("test");
      await page.waitForTimeout(400);

      // Click clear search
      await page.locator('text="Clear search"').click();

      // Search input should be empty and show all books
      await expect(searchInput).toHaveValue("");
    });
  });

  test.describe("Status Display", () => {
    test("should display book status with correct colors", async ({ page }) => {
      // Look for available books (green)
      const availableBadges = page.locator('text="Available"');
      if ((await availableBadges.count()) > 0) {
        await expect(availableBadges.first()).toHaveClass(/text-green-600/);
      }

      // Look for checked out books (red)
      const checkedOutBadges = page.locator('text="Checked Out"');
      if ((await checkedOutBadges.count()) > 0) {
        await expect(checkedOutBadges.first()).toHaveClass(/text-red-600/);
      }
    });
  });

  test.describe("Sorting", () => {
    test("should sort by title", async ({ page }) => {
      // Click on title header to sort
      await page.locator('button:has-text("Title")').click();

      // Wait for sort to complete
      await page.waitForTimeout(500);

      // Get first few book titles
      const titles = await page
        .locator("table tbody td:first-child")
        .allTextContents();

      // Should be sorted alphabetically
      for (let i = 1; i < titles.length && i < 3; i++) {
        expect(titles[i - 1].localeCompare(titles[i])).toBeLessThanOrEqual(0);
      }
    });

    test("should sort by author", async ({ page }) => {
      // Click on author header to sort
      await page.locator('button:has-text("Author")').click();

      await page.waitForTimeout(500);

      // Get first few authors
      const authors = await page
        .locator("table tbody td:nth-child(2)")
        .allTextContents();

      // Should be sorted alphabetically
      for (let i = 1; i < authors.length && i < 3; i++) {
        expect(authors[i - 1].localeCompare(authors[i])).toBeLessThanOrEqual(0);
      }
    });

    test("should toggle sort direction", async ({ page }) => {
      const titleButton = page.locator('button:has-text("Title")');

      // First click - ascending
      await titleButton.click();
      await page.waitForTimeout(300);

      const firstTitleAsc = await page
        .locator("table tbody td:first-child")
        .first()
        .textContent();

      // Second click - descending
      await titleButton.click();
      await page.waitForTimeout(300);

      const firstTitleDesc = await page
        .locator("table tbody td:first-child")
        .first()
        .textContent();

      // Should be different (reverse order)
      expect(firstTitleAsc).not.toBe(firstTitleDesc);
    });
  });

  test.describe("Pagination", () => {
    test("should show pagination when needed", async ({ page }) => {
      // If there are enough books, pagination should be visible
      const bookRows = page.locator("table tbody tr");
      const rowCount = await bookRows.count();

      if (rowCount >= 50) {
        await expect(page.locator('text="Showing"')).toBeVisible();
        await expect(page.locator('button:has-text("Next")')).toBeVisible();
      }
    });

    test("should change page size", async ({ page }) => {
      // Change page size to 25
      await page.locator("select").selectOption("25");
      await page.waitForTimeout(500);

      // Should show maximum 25 rows
      const bookRows = page.locator("table tbody tr");
      const rowCount = await bookRows.count();
      expect(rowCount).toBeLessThanOrEqual(25);
    });

    test("should navigate between pages", async ({ page }) => {
      // Only test if pagination exists
      const nextButton = page.locator('button:has-text("Next")');

      if (await nextButton.isEnabled()) {
        // Get first book on page 1
        const firstBookPage1 = await page
          .locator("table tbody td:first-child")
          .first()
          .textContent();

        // Go to next page
        await nextButton.click();
        await page.waitForTimeout(500);

        // Get first book on page 2
        const firstBookPage2 = await page
          .locator("table tbody td:first-child")
          .first()
          .textContent();

        // Should be different books
        expect(firstBookPage1).not.toBe(firstBookPage2);
      }
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state during data fetch", async ({ page }) => {
      // Navigate to books page
      await page.goto("/CCL-MAIN/books");

      // Should briefly show loading skeleton
      await expect(page.locator(".animate-pulse").first()).toBeVisible();

      // Then show actual data
      await page.waitForLoadState("networkidle");
      await expect(page.locator("table tbody tr").first()).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Simulate network failure
      await page.route("**/rest/v1/book_copies**", (route) => {
        route.abort("failed");
      });

      await page.goto("/CCL-MAIN/books");

      // Should show error message
      await expect(page.locator('text="Failed to load books"')).toBeVisible();
      await expect(page.locator('text="Try Again"')).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test("should navigate to add book page", async ({ page }) => {
      // Click Add New Book button
      await page.locator('text="Add New Book"').click();

      // Should navigate to add book page
      await expect(page.url()).toContain("/books/add");
    });

    test("should maintain library context in URLs", async ({ page }) => {
      // URL should include library code
      expect(page.url()).toContain("/CCL-MAIN/books");

      // Navigation should preserve library context
      await page.locator('text="Add New Book"').click();
      expect(page.url()).toContain("/CCL-MAIN/books/add");
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      // Search input should be focusable
      await page.keyboard.press("Tab");
      await expect(
        page.locator('input[placeholder*="Search books"]')
      ).toBeFocused();

      // Should be able to tab through interactive elements
      await page.keyboard.press("Tab");
      await expect(page.locator("select")).toBeFocused();

      // Sort buttons should be focusable
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.locator('button:has-text("Title")')).toBeFocused();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Table should have proper structure
      await expect(page.locator("table")).toHaveAttribute("role", "table");

      // Search input should have proper labels
      const searchInput = page.locator('input[placeholder*="Search books"]');
      await expect(searchInput).toHaveAttribute("type", "text");
    });

    test("should work with screen readers", async ({ page }) => {
      // Headings should be properly structured
      await expect(page.locator("h1")).toBeVisible();

      // Status badges should have text content
      const badges = page.locator('[class*="bg-green"], [class*="bg-red"]');
      if ((await badges.count()) > 0) {
        await expect(badges.first()).not.toBeEmpty();
      }
    });
  });

  test.describe("Performance", () => {
    test("should load within acceptable time", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/CCL-MAIN/books");
      await page.waitForLoadState("networkidle");

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test("should handle large datasets efficiently", async ({ page }) => {
      // Test with page size of 100
      await page.locator("select").selectOption("100");
      await page.waitForTimeout(1000);

      // Should still be responsive
      const searchInput = page.locator('input[placeholder*="Search books"]');
      await searchInput.fill("test");

      // Search should respond within reasonable time
      await page.waitForTimeout(500);
      await expect(page.locator("table tbody")).toBeVisible();
    });
  });
});
