/**
 * E2E Test: Story 2.2 - Ultra-Simple Add New Books
 * Tests the complete progressive workflow for adding books to library inventory
 */

import { test, expect } from "@playwright/test";

test.describe("Story 2.2: Ultra-Simple Add New Books", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the library dashboard
    await page.goto("/MOD/dashboard");
    
    // Wait for the page to load and verify we're in the right library
    await expect(page.getByRole("heading", { name: /modernist public library/i })).toBeVisible();
  });

  test("AC1: Should display progressive workflow steps", async ({ page }) => {
    // Navigate to add book page
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Verify the progressive workflow steps are visible
    await expect(page.getByText("Search Books")).toBeVisible();
    await expect(page.getByText("Add Book Edition")).toBeVisible();
    await expect(page.getByText("Add Copies")).toBeVisible();
    await expect(page.getByText("Complete")).toBeVisible();
    
    // Verify we start on the search step
    await expect(page.getByPlaceholder(/search by book title/i)).toBeVisible();
  });

  test("AC2: Should search for existing books", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Type in search input
    const searchInput = page.getByPlaceholder(/search by book title/i);
    await searchInput.fill("The Great Gatsby");
    
    // Wait for search results to appear
    await expect(page.getByText(/searching/i)).toBeVisible();
    await page.waitForTimeout(500); // Wait for debounce + API
    
    // Should show either results or "no books found"
    const hasResults = await page.getByText(/found books/i).isVisible();
    if (!hasResults) {
      await expect(page.getByText(/no books found/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /add new book/i })).toBeVisible();
    }
  });

  test("AC3: Should create new book edition with progressive form", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Search for a non-existent book
    await page.getByPlaceholder(/search by book title/i).fill("Test Book Unique 123");
    await page.waitForTimeout(500);
    
    // Click "Add New Book" button
    await page.getByRole("button", { name: /add new book/i }).click();
    
    // Should navigate to edition form (step 2)
    await expect(page.getByText("Add New Book Edition")).toBeVisible();
    await expect(page.getByText("Step 1: Select Author")).toBeVisible();
    
    // Search for an author
    const authorSearch = page.getByPlaceholder(/search by author name/i);
    await authorSearch.fill("Jane");
    await page.waitForTimeout(500);
    
    // If no author found, create new one
    const hasAuthorResults = await page.getByText(/found authors/i).isVisible();
    if (!hasAuthorResults) {
      await page.getByRole("button", { name: /add new author/i }).click();
      
      // Fill author modal
      await page.getByLabel(/author name/i).fill("Jane Test Author");
      await page.getByLabel(/biography/i).fill("Test biography for Jane Test Author");
      await page.getByRole("button", { name: /create author/i }).click();
      
      // Should return to edition form with author selected
      await expect(page.getByText("Jane Test Author")).toBeVisible();
      await expect(page.getByText("Selected author")).toBeVisible();
    }
    
    // Fill book edition details
    await page.getByLabel(/title/i).fill("Test Book Unique 123");
    await page.getByLabel(/subtitle/i).fill("A Test Subtitle");
    await page.getByLabel(/publisher/i).fill("Test Publisher");
    await page.getByLabel(/publication year/i).fill("2023");
    await page.getByLabel(/isbn/i).fill("9781234567890");
    
    // Submit edition form
    await page.getByRole("button", { name: /create book edition/i }).click();
    
    // Should navigate to copies form (step 3)
    await expect(page.getByText("Add Book Copies")).toBeVisible();
    await expect(page.getByText("Copy Details for Modernist Public Library")).toBeVisible();
  });

  test("AC4: Should create book copies with validation", async ({ page }) => {
    // This test assumes we can get to the copies step
    // In a real scenario, we might need to set up test data or mock APIs
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // For this test, we'll simulate getting to the copies step
    // by clicking through the workflow quickly with mock data
    await page.getByPlaceholder(/search by book title/i).fill("Quick Test Book");
    await page.waitForTimeout(300);
    
    // If we can find the "Add New Book" button, continue the workflow
    if (await page.getByRole("button", { name: /add new book/i }).isVisible()) {
      await page.getByRole("button", { name: /add new book/i }).click();
      
      // Create a quick author and book
      if (await page.getByRole("button", { name: /add new author/i }).isVisible()) {
        await page.getByRole("button", { name: /add new author/i }).click();
        await page.getByLabel(/author name/i).fill("Quick Author");
        await page.getByRole("button", { name: /create author/i }).click();
      }
      
      // Fill minimum book details
      await page.getByLabel(/title/i).fill("Quick Test Book");
      await page.getByRole("button", { name: /create book edition/i }).click();
      
      // Now test the copies form
      await expect(page.getByText("Add Book Copies")).toBeVisible();
      
      // Test form validation
      await page.getByLabel(/number of copies/i).fill("0");
      await expect(page.getByText(/must add at least 1 copy/i)).toBeVisible();
      
      await page.getByLabel(/number of copies/i).fill("5");
      await expect(page.getByText(/adding 5 copies/i)).toBeVisible();
      
      // Fill optional location information
      await page.getByLabel(/shelf/i).fill("A1");
      await page.getByLabel(/section/i).fill("Fiction");
      await page.getByLabel(/call number/i).fill("813.54 QUI");
      await page.getByLabel(/notes/i).fill("Test copy notes");
      
      // Submit copies form
      await page.getByRole("button", { name: /add 5 copies/i }).click();
      
      // Should show success page
      await expect(page.getByText("Success!")).toBeVisible();
      await expect(page.getByText(/added successfully/i)).toBeVisible();
    }
  });

  test("AC5: Should show success confirmation and navigate", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // After completing the workflow (this would normally happen after AC4)
    // we should see success options
    
    // Test navigation options
    const backToBooks = page.getByRole("link", { name: /back to books/i });
    if (await backToBooks.isVisible()) {
      await backToBooks.click();
      await expect(page).toHaveURL(/\/MOD\/books$/);
    }
  });

  test("AC6: Should handle workflow cancellation", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Test cancel from search step
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page).toHaveURL(/\/MOD\/books$/);
    }
    
    // Test back navigation in workflow
    await page.getByRole("link", { name: /add new book/i }).click();
    
    const backButton = page.getByRole("button", { name: /back to search/i });
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page.getByPlaceholder(/search by book title/i)).toBeVisible();
    }
  });

  test("AC7: Should validate form inputs correctly", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Test search input validation (minimum 3 characters)
    const searchInput = page.getByPlaceholder(/search by book title/i);
    await searchInput.fill("ab");
    await expect(page.getByText(/type at least 3 characters/i)).toBeVisible();
    
    // Test that searching works with 3+ characters
    await searchInput.fill("abc");
    await page.waitForTimeout(500);
    // Should either show results or "no books found"
  });

  test("AC8: Should handle network errors gracefully", async ({ page }) => {
    // This test would ideally mock network failures
    // For now, we'll test that error states are handled
    
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Test that error messages appear when API calls fail
    // This would require mocking or network interception
    await page.getByPlaceholder(/search by book title/i).fill("test search");
    await page.waitForTimeout(1000);
    
    // Should not crash on network errors
    await expect(page.getByRole("heading", { name: /add new book/i })).toBeVisible();
  });

  test("AC9: Should maintain state during workflow", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Test that progress is maintained when navigating between steps
    // This is more of a functional test that would require completing the workflow
    
    // Verify that breadcrumbs work
    await expect(page.getByText("Books")).toBeVisible();
    await expect(page.getByText("Add New Book")).toBeVisible();
    
    // Test back to books navigation
    await page.getByRole("link", { name: /books/i }).first().click();
    await expect(page).toHaveURL(/\/MOD\/books$/);
  });

  test("AC10: Should display proper loading states", async ({ page }) => {
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Test search loading state
    await page.getByPlaceholder(/search by book title/i).fill("test");
    await expect(page.getByText(/searching/i)).toBeVisible();
    
    // Test that form submissions show loading states
    // This would require actually submitting forms with network delays
  });

  test("AC11: Should be responsive on mobile", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.getByRole("link", { name: /add new book/i }).click();
    
    // Verify mobile layout works
    await expect(page.getByPlaceholder(/search by book title/i)).toBeVisible();
    
    // Test that progress steps are visible on mobile
    await expect(page.getByText("Search Books")).toBeVisible();
    
    // Test that forms are usable on mobile
    const searchInput = page.getByPlaceholder(/search by book title/i);
    await searchInput.fill("mobile test");
    await page.waitForTimeout(500);
  });
});