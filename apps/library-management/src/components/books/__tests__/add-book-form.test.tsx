/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, type UseMutationResult } from '@tanstack/react-query';
import { AddBookForm } from '../add-book-form';
import { useLibraryContext } from '@/lib/contexts/library-context';
import { useAddBook } from '@/lib/hooks/use-add-book';
import type { BookCreationResult, BookCreationData } from '@/lib/validation/books';

// Mock the dependencies
jest.mock('@/lib/contexts/library-context');
jest.mock('@/lib/hooks/use-add-book');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseLibraryContext = useLibraryContext as jest.MockedFunction<typeof useLibraryContext>;
const mockUseAddBook = useAddBook as jest.MockedFunction<typeof useAddBook>;

describe('AddBookForm', () => {
  let queryClient: QueryClient;
  let mockAddBook: jest.Mock;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    mockAddBook = jest.fn();
    
    mockUseLibraryContext.mockReturnValue({
      currentLibrary: {
        id: 'test-library-id',
        code: 'TEST',
        name: 'Test Library',
        address: '123 Test St',
        contact_info: { email: 'test@library.com' },
        settings: {},
        stats: {},
        user_role: 'admin',
        staff_status: 'active',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_permissions: {},
        staff_id: 'test-staff-id',
      },
      availableLibraries: [],
      error: null,
      refreshLibraries: jest.fn(),
      switchLibrary: jest.fn(),
      selectLibrary: jest.fn(),
      clearLibrarySelection: jest.fn(),
      isLoading: false,
    });
    
    mockUseAddBook.mockReturnValue({
      mutate: mockAddBook,
      isPending: false,
      error: null,
      data: undefined,
      variables: undefined,
      isError: false,
      isIdle: true,
      isPaused: false,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      status: 'idle' as const,
      mutateAsync: jest.fn(),
      reset: jest.fn(),
      submittedAt: 0,
      context: undefined,
    } as UseMutationResult<BookCreationResult, Error, BookCreationData, unknown>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  // AC1, AC7: Form validation tests
  describe('Form Validation', () => {
    test('2.2-UNIT-001: should validate required title field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const submitButton = screen.getByRole('button', { name: /add book/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    test('2.2-UNIT-002: should validate required author field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const submitButton = screen.getByRole('button', { name: /add book/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Author is required')).toBeInTheDocument();
      });
    });

    test('2.2-UNIT-003: should validate title character limits', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(256); // Exceeds 255 character limit
      
      await user.type(titleInput, longTitle);
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(screen.getByText('Title must be less than 255 characters')).toBeInTheDocument();
      });
    });

    test('2.2-UNIT-004: should validate author character limits', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const authorInput = screen.getByLabelText(/author/i);
      const longAuthor = 'a'.repeat(256); // Exceeds 255 character limit
      
      await user.type(authorInput, longAuthor);
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(screen.getByText('Author name must be less than 255 characters')).toBeInTheDocument();
      });
    });

    test('2.2-UNIT-005: should validate publication year range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const titleInput = screen.getByLabelText(/title/i);
      const authorInput = screen.getByLabelText(/author/i);
      const yearInput = screen.getByLabelText(/publication year/i);
      
      // Fill required fields first
      await user.type(titleInput, 'Test Book');
      await user.type(authorInput, 'Test Author');
      
      // Test year too early
      await user.type(yearInput, '999');
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(screen.getByText('Year must be after 1000')).toBeInTheDocument();
      });

      // Clear and test future year
      await user.clear(yearInput);
      const futureYear = (new Date().getFullYear() + 1).toString();
      await user.type(yearInput, futureYear);
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(screen.getByText('Year cannot be in the future')).toBeInTheDocument();
      });
    });
  });

  // AC3: Manual entry validation
  describe('Manual Entry Validation', () => {
    test('2.2-UNIT-006: should accept form with only title and author', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const titleInput = screen.getByLabelText(/title/i);
      const authorInput = screen.getByLabelText(/author/i);
      
      await user.type(titleInput, 'Test Book');
      await user.type(authorInput, 'Test Author');
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(mockAddBook).toHaveBeenCalledWith({
          title: 'Test Book',
          author: 'Test Author',
          publisher: undefined,
          publication_year: undefined,
          isbn: undefined,
          library_id: 'test-library-id',
        });
      });
    });

    test('2.2-UNIT-007: should handle optional fields correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      await user.type(screen.getByLabelText(/title/i), 'Complete Book');
      await user.type(screen.getByLabelText(/author/i), 'Complete Author');
      await user.type(screen.getByLabelText(/publisher/i), 'Test Publisher');
      await user.type(screen.getByLabelText(/publication year/i), '2024');
      await user.type(screen.getByLabelText(/isbn/i), '9781234567890');
      
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(mockAddBook).toHaveBeenCalledWith({
          title: 'Complete Book',
          author: 'Complete Author',
          publisher: 'Test Publisher',
          publication_year: 2024,
          isbn: '9781234567890',
          library_id: 'test-library-id',
        });
      });
    });
  });

  // Loading states and error handling
  describe('Form States', () => {
    test('should show loading state when form is submitting', () => {
      mockUseAddBook.mockReturnValue({
        mutate: mockAddBook,
        isPending: true,
        error: null,
        data: undefined,
        variables: undefined,
        isError: false,
        isIdle: false,
          isPaused: false,
        isSuccess: false,
        failureCount: 0,
        failureReason: null,
        status: 'pending' as const,
        mutateAsync: jest.fn(),
        reset: jest.fn(),
        submittedAt: Date.now(),
        context: undefined,
      } as UseMutationResult<BookCreationResult, Error, BookCreationData, unknown>);

      renderWithProviders(<AddBookForm />);
      
      const submitButton = screen.getByRole('button', { name: /add book/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/add book/i)).toBeInTheDocument();
    });

    test('should display error when mutation fails', () => {
      const errorMessage = 'Failed to create book';
      mockUseAddBook.mockReturnValue({
        mutate: mockAddBook,
        isPending: false,
        error: new Error(errorMessage),
        data: undefined,
        variables: undefined,
        isError: true,
        isIdle: false,
          isPaused: false,
        isSuccess: false,
        failureCount: 1,
        failureReason: new Error(errorMessage),
        status: 'error' as const,
        mutateAsync: jest.fn(),
        reset: jest.fn(),
        submittedAt: Date.now(),
        context: undefined,
      } as UseMutationResult<BookCreationResult, Error, BookCreationData, unknown>);

      renderWithProviders(<AddBookForm />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('should reset form after submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AddBookForm />);

      const titleInput = screen.getByLabelText(/title/i);
      const authorInput = screen.getByLabelText(/author/i);
      
      await user.type(titleInput, 'Test Book');
      await user.type(authorInput, 'Test Author');
      
      // Form should reset immediately after clicking submit
      await user.click(screen.getByRole('button', { name: /add book/i }));

      await waitFor(() => {
        expect(mockAddBook).toHaveBeenCalled();
        expect(titleInput).toHaveValue('');
        expect(authorInput).toHaveValue('');
      });
    });
  });

  // Library context validation
  describe('Library Context Integration', () => {
    test('should handle missing library context', async () => {
      const user = userEvent.setup();
      
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
        availableLibraries: [],
          error: null,
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        isLoading: false,
      });

      renderWithProviders(<AddBookForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Book');
      await user.type(screen.getByLabelText(/author/i), 'Test Author');
      await user.click(screen.getByRole('button', { name: /add book/i }));

      // Should not call addBook when no library is selected
      expect(mockAddBook).not.toHaveBeenCalled();
    });
  });
});