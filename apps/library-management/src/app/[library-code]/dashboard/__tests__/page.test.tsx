/**
 * Library Dashboard Page Tests
 * Comprehensive tests for the main dashboard page component
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Import the actual modules for type reference
import LibraryDashboardPage from "../page";

// Mock the hooks - using require to avoid issues with module loading
const mockUseLibraryContext = jest.fn();
const mockUseLibraryStats = jest.fn();
const mockUseLibraryTransactions = jest.fn();

jest.mock("../../../../lib/contexts/library-context", () => ({
  useLibraryContext: mockUseLibraryContext,
}));

jest.mock("../../../../lib/hooks/use-library-data", () => ({
  useLibraryStats: mockUseLibraryStats,
  useLibraryTransactions: mockUseLibraryTransactions,
}));

// Type assertions for the mocked functions

const mockLibrary = {
  id: "library-1",
  code: "TEST-LIB",
  name: "Test Library",
  user_role: "librarian",
  staff_status: "active",
  status: "active",
  created_at: "2024-01-01T00:00:00.000Z",
};

const mockStats = {
  totalBooks: 150,
  activeMembers: 75,
  currentCheckouts: 25,
};

const mockTransactions = [
  {
    id: "trans-1",
    transaction_type: "checkout",
    created_at: "2024-01-15T10:00:00.000Z",
    book_copies: {
      book_editions: {
        title: "The Great Gatsby",
      },
    },
    library_members: {
      personal_info: {
        full_name: "John Doe",
      },
    },
  },
  {
    id: "trans-2",
    transaction_type: "return",
    created_at: "2024-01-15T09:00:00.000Z",
    book_copies: {
      book_editions: {
        title: "1984",
      },
    },
    library_members: {
      personal_info: {
        full_name: "Jane Smith",
      },
    },
  },
];

describe("LibraryDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when no library is selected", () => {
    it("should show no library selected message", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [],
        isLoading: false,
        error: null,
      });

      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      });

      mockUseLibraryTransactions.mockReturnValue({
        transactions: [],
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      expect(screen.getByText("No library selected")).toBeInTheDocument();
    });
  });

  describe("when library is selected", () => {
    beforeEach(() => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: mockLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [mockLibrary],
        isLoading: false,
        error: null,
      });

      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      });

      mockUseLibraryTransactions.mockReturnValue({
        transactions: mockTransactions,
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });
    });

    it("should render dashboard header", () => {
      render(<LibraryDashboardPage />);

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(
        screen.getByText("Here's an overview of your library operations")
      ).toBeInTheDocument();
    });

    it("should render statistics cards with correct values", async () => {
      render(<LibraryDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Total Books")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();

        expect(screen.getByText("Active Members")).toBeInTheDocument();
        expect(screen.getByText("75")).toBeInTheDocument();

        expect(screen.getByText("Checked Out")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();

        expect(screen.getByText("Library Score")).toBeInTheDocument();
        expect(screen.getByText("95%")).toBeInTheDocument();
      });
    });

    it("should render loading states for statistics", () => {
      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: true,
        error: null,
      });

      render(<LibraryDashboardPage />);

      // Check for loading skeleton elements
      const loadingElements = screen.getAllByTestId(/loading/i);
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it("should render quick action buttons", () => {
      render(<LibraryDashboardPage />);

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
      expect(screen.getByText("Return Books")).toBeInTheDocument();
    });

    it("should render quick action buttons with correct hrefs", () => {
      render(<LibraryDashboardPage />);

      const addBookLink = screen.getByRole("link", { name: /Add Book/i });
      expect(addBookLink).toHaveAttribute("href", "/TEST-LIB/inventory/add");

      const registerMemberLink = screen.getByRole("link", {
        name: /Register Member/i,
      });
      expect(registerMemberLink).toHaveAttribute(
        "href",
        "/TEST-LIB/members/add"
      );

      const quickCheckoutLink = screen.getByRole("link", {
        name: /Quick Checkout/i,
      });
      expect(quickCheckoutLink).toHaveAttribute(
        "href",
        "/TEST-LIB/circulation/checkout"
      );

      const returnBooksLink = screen.getByRole("link", {
        name: /Return Books/i,
      });
      expect(returnBooksLink).toHaveAttribute(
        "href",
        "/TEST-LIB/circulation/checkin"
      );
    });

    it("should render recent activity feed", () => {
      render(<LibraryDashboardPage />);

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("checked out")).toBeInTheDocument();
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("returned")).toBeInTheDocument();
      expect(screen.getByText("1984")).toBeInTheDocument();
    });

    it("should show loading state for recent activity", () => {
      mockUseLibraryTransactions.mockReturnValue({
        transactions: [],
        isLoading: true,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      // Should show loading skeleton for activity
      const activityLoadingElements = screen.getAllByTestId(/loading/i);
      expect(activityLoadingElements.length).toBeGreaterThan(0);
    });

    it("should show empty state when no recent activity", () => {
      mockUseLibraryTransactions.mockReturnValue({
        transactions: [],
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      expect(screen.getByText("No recent activity")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Activity will appear here as operations are performed"
        )
      ).toBeInTheDocument();
    });

    it("should limit recent activity to 5 items", () => {
      const manyTransactions = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `trans-${i}`,
          transaction_type: "checkout",
          created_at: `2024-01-${15 - i}T10:00:00.000Z`,
          book_copies: {
            book_editions: {
              title: `Book ${i}`,
            },
          },
          library_members: {
            personal_info: {
              full_name: `User ${i}`,
            },
          },
        }));

      mockUseLibraryTransactions.mockReturnValue({
        transactions: manyTransactions,
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      // Should only show first 5 transactions
      expect(screen.getByText("User 0")).toBeInTheDocument();
      expect(screen.getByText("User 4")).toBeInTheDocument();
      expect(screen.queryByText("User 5")).not.toBeInTheDocument();
    });

    it("should render view all activity button when there are transactions", () => {
      render(<LibraryDashboardPage />);

      expect(screen.getByText("View All Activity")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: mockLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [mockLibrary],
        isLoading: false,
        error: null,
      });

      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      });

      mockUseLibraryTransactions.mockReturnValue({
        transactions: mockTransactions,
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("Welcome back");
    });

    it("should have proper button labeling", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: mockLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [mockLibrary],
        isLoading: false,
        error: null,
      });

      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      });

      mockUseLibraryTransactions.mockReturnValue({
        transactions: mockTransactions,
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      const buttons = screen.getAllByRole("link");
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe("responsive design", () => {
    it("should render cards in grid layout", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: mockLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [mockLibrary],
        isLoading: false,
        error: null,
      });

      mockUseLibraryStats.mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      });

      mockUseLibraryTransactions.mockReturnValue({
        transactions: mockTransactions,
        isLoading: false,
        error: null,
        createTransaction: jest.fn(),
        isCreatingTransaction: false,
      });

      render(<LibraryDashboardPage />);

      // Test grid container classes are present
      const statsContainer = screen.getByText("Total Books").closest(".grid");
      expect(statsContainer).toHaveClass("grid");
    });
  });
});
