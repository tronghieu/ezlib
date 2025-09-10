/**
 * Member Management E2E Tests
 * End-to-end tests for complete member workflows: add → view → edit → manage
 */

import { test, expect } from "@playwright/test";

test.describe("Member Management", () => {
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
    await page.goto("/CCL-MAIN/members");

    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Members List Page", () => {
    test("should display members page with correct layout", async ({ page }) => {
      // Check page title and header
      await expect(page.locator("h1")).toContainText("Members");
      await expect(page.locator("p")).toContainText(
        "Manage library member registrations and account status"
      );

      // Check Add New Member button is prominent
      await expect(page.locator('text="Add New Member"')).toBeVisible();

      // Check table structure
      await expect(page.locator("table")).toBeVisible();
      await expect(page.locator("th")).toContainText([
        "Member ID",
        "Name",
        "Email", 
        "Status",
        "Member Since",
        "Current Checkouts",
      ]);
    });

    test("should be mobile responsive", async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still be functional
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('text="Add New Member"')).toBeVisible();
      await expect(page.locator("table")).toBeVisible();

      // Search input should be responsive
      const searchInput = page.locator('input[placeholder*="Search members"]');
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe("Add New Member Workflow", () => {
    test("should complete full member registration workflow", async ({ page }) => {
      // Step 1: Navigate to add member page
      await page.locator('text="Add New Member"').click();
      await expect(page.url()).toContain("/members/add");
      await expect(page.locator("h1")).toContainText("Add New Member");

      // Step 2: Fill in member registration form
      await page.locator('input[name="first_name"]').fill("Jane");
      await page.locator('input[name="last_name"]').fill("Doe");
      await page.locator('input[name="email"]').fill("jane.doe@example.com");
      await page.locator('input[name="phone"]').fill("(555) 123-4567");

      // Fill address information
      await page.locator('input[name="street"]').fill("123 Main Street");
      await page.locator('input[name="city"]').fill("Anytown");
      await page.locator('input[name="state"]').fill("CA");
      await page.locator('input[name="postal_code"]').fill("90210");

      // Select membership type
      await page.locator('select[name="membership_type"]').selectOption("regular");

      // Add membership notes
      await page.locator('textarea[name="membership_notes"]').fill("New member registration via E2E test");

      // Step 3: Test member ID options
      // First test automatic generation
      const autoIdRadio = page.locator('input[value="auto"]');
      await autoIdRadio.check();
      await expect(page.locator('text="Will be automatically generated"')).toBeVisible();

      // Then test manual entry
      const manualIdRadio = page.locator('input[value="manual"]');
      await manualIdRadio.check();
      await page.locator('input[name="member_id"]').fill("TEST001");

      // Step 4: Submit the form
      await page.locator('button[type="submit"]').click();

      // Step 5: Verify success and navigation to member profile
      await page.waitForURL(/\/members\/[^\/]+$/);
      await expect(page.locator('text="Member registered successfully"')).toBeVisible();
      
      // Should be on member profile page
      await expect(page.locator("h1")).toContainText("Jane Doe");
      await expect(page.locator('text="TEST001"')).toBeVisible();
      await expect(page.locator('text="jane.doe@example.com"')).toBeVisible();
    });

    test("should show validation errors for incomplete form", async ({ page }) => {
      await page.locator('text="Add New Member"').click();

      // Try to submit empty form
      await page.locator('button[type="submit"]').click();

      // Should show validation errors
      await expect(page.locator('text="First name is required"')).toBeVisible();
      await expect(page.locator('text="Last name is required"')).toBeVisible();  
      await expect(page.locator('text="Please enter a valid email address"')).toBeVisible();

      // Form should not submit
      expect(page.url()).toContain("/members/add");
    });

    test("should detect duplicate email addresses", async ({ page }) => {
      await page.locator('text="Add New Member"').click();

      // Fill form with existing email
      await page.locator('input[name="first_name"]').fill("John");
      await page.locator('input[name="last_name"]').fill("Smith");
      await page.locator('input[name="email"]').fill("existing.member@example.com");

      await page.locator('button[type="submit"]').click();

      // Should show duplicate email error
      await expect(page.locator('text="A member with this email address already exists"')).toBeVisible();
      expect(page.url()).toContain("/members/add");
    });

    test("should validate phone number format", async ({ page }) => {
      await page.locator('text="Add New Member"').click();

      // Fill required fields
      await page.locator('input[name="first_name"]').fill("Test");
      await page.locator('input[name="last_name"]').fill("User");  
      await page.locator('input[name="email"]').fill("test.user@example.com");

      // Test invalid phone number
      await page.locator('input[name="phone"]').fill("invalid-phone");
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text="Please enter a valid phone number"')).toBeVisible();
    });
  });

  test.describe("Member Search Functionality", () => {
    test("should search members by name", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      // Search by first name
      await searchInput.fill("Jane");
      await page.waitForTimeout(400); // Wait for debounce

      // Should show matching results
      const memberRows = page.locator("table tbody tr");
      await expect(memberRows.first()).toBeVisible();
      await expect(page.locator("table tbody td")).toContainText(/Jane/i);
    });

    test("should search members by member ID", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      // Search by member ID
      await searchInput.fill("M001");
      await page.waitForTimeout(400);

      // Should find member by ID
      await expect(page.locator('text="M001"')).toBeVisible();
    });

    test("should search members by email", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      // Search by email
      await searchInput.fill("@example.com");
      await page.waitForTimeout(400);

      // Should show members with matching email domain
      const emailCells = page.locator("table tbody td:nth-child(3)"); // Email column
      await expect(emailCells.first()).toContainText(/@example\.com/i);
    });

    test("should show no results message for invalid search", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      await searchInput.fill("nonexistentmember12345");
      await page.waitForTimeout(400);

      // Should show no results message
      await expect(page.locator('text="No members found"')).toBeVisible();
      await expect(page.locator('text="Clear search"')).toBeVisible();
    });

    test("should clear search results", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      // Perform search
      await searchInput.fill("test");
      await page.waitForTimeout(400);

      // Click clear search
      await page.locator('text="Clear search"').click();

      // Search input should be empty and show all members
      await expect(searchInput).toHaveValue("");
    });
  });

  test.describe("Member Profile Display", () => {
    test("should display complete member profile", async ({ page }) => {
      // Click on first member in the list
      await page.locator("table tbody tr").first().click();

      // Should navigate to member profile
      await page.waitForURL(/\/members\/[^\/]+$/);

      // Should display personal information
      await expect(page.locator("h1")).toContainText(/\w+\s+\w+/); // Full name
      await expect(page.locator('text="Member ID"')).toBeVisible();
      await expect(page.locator('text="Email"')).toBeVisible();
      await expect(page.locator('text="Phone"')).toBeVisible();

      // Should display membership information
      await expect(page.locator('text="Membership Type"')).toBeVisible();
      await expect(page.locator('text="Member Since"')).toBeVisible();
      await expect(page.locator('text="Status"')).toBeVisible();

      // Should display current checkouts section
      await expect(page.locator('text="Current Checkouts"')).toBeVisible();
    });

    test("should show edit button for authorized users", async ({ page }) => {
      await page.locator("table tbody tr").first().click();
      await page.waitForURL(/\/members\/[^\/]+$/);

      // Edit button should be visible for librarian+ roles
      await expect(page.locator('text="Edit Member"')).toBeVisible();
    });

    test("should display active checkouts with book details", async ({ page }) => {
      // Find a member with active checkouts
      const membersWithCheckouts = page.locator('td:has-text("1")').locator('..'); // Row with checkout count > 0
      
      if (await membersWithCheckouts.count() > 0) {
        await membersWithCheckouts.first().click();
        await page.waitForURL(/\/members\/[^\/]+$/);

        // Should show checkout details
        const checkoutSection = page.locator('text="Current Checkouts"').locator('..');
        await expect(checkoutSection.locator('text="Book Title"')).toBeVisible();
        await expect(checkoutSection.locator('text="Checkout Date"')).toBeVisible();
      }
    });
  });

  test.describe("Edit Member Workflow", () => {
    test("should complete member edit workflow", async ({ page }) => {
      // Step 1: Navigate to member profile
      await page.locator("table tbody tr").first().click();
      await page.waitForURL(/\/members\/[^\/]+$/);

      // Step 2: Click edit button
      await page.locator('text="Edit Member"').click();
      await expect(page.url()).toContain("/edit");

      // Step 3: Update member information
      await page.locator('input[name="first_name"]').fill("Jane Updated");
      await page.locator('input[name="phone"]').fill("(555) 987-6543");
      await page.locator('textarea[name="membership_notes"]').fill("Updated via E2E test");

      // Step 4: Submit changes
      await page.locator('button[type="submit"]').click();

      // Step 5: Verify success
      await expect(page.locator('text="Member updated successfully"')).toBeVisible();
      await expect(page.locator("h1")).toContainText("Jane Updated");
    });

    test("should validate email format during edit", async ({ page }) => {
      await page.locator("table tbody tr").first().click();
      await page.waitForURL(/\/members\/[^\/]+$/);
      await page.locator('text="Edit Member"').click();

      // Enter invalid email
      await page.locator('input[name="email"]').fill("invalid-email");
      await page.locator('button[type="submit"]').click();

      // Should show validation error
      await expect(page.locator('text="Please enter a valid email address"')).toBeVisible();
    });

    test("should update member status", async ({ page }) => {
      await page.locator("table tbody tr").first().click();
      await page.waitForURL(/\/members\/[^\/]+$/);
      await page.locator('text="Edit Member"').click();

      // Change status to inactive
      await page.locator('select[name="status"]').selectOption("inactive");
      await page.locator('button[type="submit"]').click();

      // Should show updated status
      await expect(page.locator('text="Inactive"')).toBeVisible();
    });
  });

  test.describe("Member Status Management", () => {
    test("should display member status with correct colors", async ({ page }) => {
      // Look for active members (green)
      const activeBadges = page.locator('text="Active"');
      if (await activeBadges.count() > 0) {
        await expect(activeBadges.first()).toHaveClass(/text-green-600/);
      }

      // Look for inactive members (yellow)
      const inactiveBadges = page.locator('text="Inactive"');
      if (await inactiveBadges.count() > 0) {
        await expect(inactiveBadges.first()).toHaveClass(/text-yellow-600/);
      }

      // Look for banned members (red)
      const bannedBadges = page.locator('text="Banned"');
      if (await bannedBadges.count() > 0) {
        await expect(bannedBadges.first()).toHaveClass(/text-red-600/);
      }
    });
  });

  test.describe("Pagination and Filtering", () => {
    test("should paginate member lists", async ({ page }) => {
      // Check if pagination is present
      const paginationInfo = page.locator('text*="Showing"');
      if (await paginationInfo.isVisible()) {
        // Should show page information
        await expect(paginationInfo).toContainText(/Showing \d+ to \d+ of \d+/);

        // Next button should be visible if there are more pages
        const nextButton = page.locator('button:has-text("Next")');
        if (await nextButton.isEnabled()) {
          // Test navigation
          await nextButton.click();
          await page.waitForTimeout(500);
          await expect(page.locator("table tbody tr")).toHaveCount(1);
        }
      }
    });

    test("should change page size", async ({ page }) => {
      // Change page size to 25
      const pageSizeSelect = page.locator('select[aria-label="Page size"]');
      if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.selectOption("25");
        await page.waitForTimeout(500);

        // Should show maximum 25 rows
        const memberRows = page.locator("table tbody tr");
        const rowCount = await memberRows.count();
        expect(rowCount).toBeLessThanOrEqual(25);
      }
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("should restrict member management to librarian+ roles", async ({ page }) => {
      // Verify Add New Member button is visible (librarian+ permission)
      await expect(page.locator('text="Add New Member"')).toBeVisible();

      // Go to member profile and verify edit access
      await page.locator("table tbody tr").first().click();
      await page.waitForURL(/\/members\/[^\/]+$/);
      await expect(page.locator('text="Edit Member"')).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Simulate network failure for member API
      await page.route("**/rest/v1/library_members**", (route) => {
        route.abort("failed");
      });

      await page.goto("/CCL-MAIN/members");

      // Should show error message
      await expect(page.locator('text="Failed to load members"')).toBeVisible();
      await expect(page.locator('text="Try Again"')).toBeVisible();
    });

    test("should handle member not found", async ({ page }) => {
      // Navigate to non-existent member
      await page.goto("/CCL-MAIN/members/nonexistent-id");

      // Should show 404 message
      await expect(page.locator('text="Member not found"')).toBeVisible();
      await expect(page.locator('text="Back to Members"')).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state during member data fetch", async ({ page }) => {
      // Navigate to members page
      await page.goto("/CCL-MAIN/members");

      // Should briefly show loading skeleton
      await expect(page.locator(".animate-pulse").first()).toBeVisible();

      // Then show actual data
      await page.waitForLoadState("networkidle");
      await expect(page.locator("table tbody tr").first()).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      // Search input should be focusable
      await page.keyboard.press("Tab");
      await expect(page.locator('input[placeholder*="Search members"]')).toBeFocused();

      // Should be able to tab through interactive elements
      await page.keyboard.press("Tab");
      await expect(page.locator('text="Add New Member"')).toBeFocused();

      // Table rows should be focusable
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.locator("table tbody tr").first()).toBeFocused();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Table should have proper structure
      await expect(page.locator("table")).toHaveAttribute("role", "table");

      // Search input should have proper labels
      const searchInput = page.locator('input[placeholder*="Search members"]');
      await expect(searchInput).toHaveAttribute("type", "text");

      // Status badges should have proper ARIA labels
      const statusBadges = page.locator('[class*="bg-green"], [class*="bg-yellow"], [class*="bg-red"]');
      if (await statusBadges.count() > 0) {
        await expect(statusBadges.first()).not.toBeEmpty();
      }
    });
  });

  test.describe("Performance", () => {
    test("should load within acceptable time", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/CCL-MAIN/members");
      await page.waitForLoadState("networkidle");

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test("should handle member search efficiently", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search members"]');

      // Search should be responsive
      await searchInput.fill("test");
      
      // Results should appear quickly
      await page.waitForTimeout(500);
      await expect(page.locator("table tbody")).toBeVisible();
    });
  });
});