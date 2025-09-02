/**
 * LanguageSwitcher Component Integration Tests
 * Tests the language switching functionality and UI interactions
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../language-switcher';
import { setClientLocale } from '@/lib/locale-cookie';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-intl hooks
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
  useTranslations: jest.fn(),
}));

// Mock locale cookie utility
jest.mock('@/lib/locale-cookie', () => ({
  setClientLocale: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('LanguageSwitcher', () => {
  const mockRouterRefresh = jest.fn();
  const mockTranslations = jest.fn();
  const mockSetClientLocale = setClientLocale as jest.MockedFunction<typeof setClientLocale>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRouterRefresh,
    });

    // Setup translation mock
    mockTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        english: 'English',
        vietnamese: 'Tiếng Việt',
      };
      return translations[key] || key;
    });
    (useTranslations as jest.Mock).mockReturnValue(mockTranslations);

    // Setup successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with English locale by default', () => {
      (useLocale as jest.Mock).mockReturnValue('en');

      render(<LanguageSwitcher />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should render with Vietnamese locale when set', () => {
      (useLocale as jest.Mock).mockReturnValue('vi');

      render(<LanguageSwitcher />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    });

    it('should display language icon when not loading', () => {
      (useLocale as jest.Mock).mockReturnValue('en');

      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Check for Languages icon (lucide-react)
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      (useLocale as jest.Mock).mockReturnValue('en');

      render(<LanguageSwitcher className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Dropdown Functionality', () => {
    beforeEach(() => {
      (useLocale as jest.Mock).mockReturnValue('en');
    });

    it('should show dropdown menu when clicked', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    });

    it('should highlight current locale in dropdown', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const englishItem = screen.getByRole('menuitem', { name: 'English' });
      expect(englishItem).toHaveClass('bg-accent');
    });

    it('should not highlight non-current locale', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      expect(vietnameseItem).not.toHaveClass('bg-accent');
    });
  });

  describe('Language Switching', () => {
    beforeEach(() => {
      (useLocale as jest.Mock).mockReturnValue('en');
    });

    it('should switch language and persist preference when different locale selected', async () => {
      render(<LanguageSwitcher />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Click Vietnamese option
      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      fireEvent.click(vietnameseItem);

      await waitFor(() => {
        expect(mockSetClientLocale).toHaveBeenCalledWith('vi');
        expect(mockFetch).toHaveBeenCalledWith('/api/locale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locale: 'vi' }),
        });
        expect(mockRouterRefresh).toHaveBeenCalled();
      });
    });

    it('should not trigger API call when same locale is selected', async () => {
      render(<LanguageSwitcher />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Click English option (current locale)
      const englishItem = screen.getByRole('menuitem', { name: 'English' });
      fireEvent.click(englishItem);

      // Wait a bit to ensure no API call is made
      await waitFor(() => {
        expect(mockSetClientLocale).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockRouterRefresh).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during language change', async () => {
      render(<LanguageSwitcher />);

      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true })
          } as Response), 100)
        )
      );

      // Open dropdown and select Vietnamese
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      fireEvent.click(vietnameseItem);

      // Check for loading spinner
      await waitFor(() => {
        expect(button.querySelector('.animate-spin')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(button.querySelector('.animate-spin')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should disable button and menu items during loading', async () => {
      render(<LanguageSwitcher />);

      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true })
          } as Response), 50)
        )
      );

      // Open dropdown and select Vietnamese
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      fireEvent.click(vietnameseItem);

      // Check that button is disabled during loading
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (useLocale as jest.Mock).mockReturnValue('en');
      // Mock console.error to avoid test output noise
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should handle API errors gracefully and revert locale', async () => {
      // Mock failed API response
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<LanguageSwitcher />);

      // Open dropdown and select Vietnamese
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      fireEvent.click(vietnameseItem);

      await waitFor(() => {
        // Should still call setClientLocale initially
        expect(mockSetClientLocale).toHaveBeenCalledWith('vi');
        // Should revert locale on error
        expect(mockSetClientLocale).toHaveBeenCalledWith('en');
        // Should log error
        expect(console.error).toHaveBeenCalledWith('Failed to change language:', expect.any(Error));
        // Should not refresh router on error
        expect(mockRouterRefresh).not.toHaveBeenCalled();
      });
    });

    it('should handle non-ok API responses', async () => {
      // Mock failed API response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      render(<LanguageSwitcher />);

      // Open dropdown and select Vietnamese
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const vietnameseItem = screen.getByRole('menuitem', { name: 'Tiếng Việt' });
      fireEvent.click(vietnameseItem);

      await waitFor(() => {
        // Should revert locale on error
        expect(mockSetClientLocale).toHaveBeenCalledWith('en');
        // Should log error
        expect(console.error).toHaveBeenCalledWith('Failed to change language:', expect.any(Error));
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useLocale as jest.Mock).mockReturnValue('en');
    });

    it('should have proper ARIA roles for dropdown menu', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    });

    it('should be keyboard accessible', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();

      // Should open dropdown on Enter
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });
});