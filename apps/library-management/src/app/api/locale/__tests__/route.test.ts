/**
 * /api/locale API Route Tests
 * Tests for the language switching API endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { setUserLocale } from '@/i18n/locale';
import { validateLocale } from '@/lib/locale-cookie';

// Mock the locale utilities
jest.mock('@/i18n/locale', () => ({
  setUserLocale: jest.fn(),
}));

jest.mock('@/lib/locale-cookie', () => ({
  validateLocale: jest.fn(),
}));

// Mock console.error to avoid test output noise
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('/api/locale POST', () => {
  const mockSetUserLocale = setUserLocale as jest.MockedFunction<typeof setUserLocale>;
  const mockValidateLocale = validateLocale as jest.MockedFunction<typeof validateLocale>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Successful locale updates', () => {
    beforeEach(() => {
      mockValidateLocale.mockReturnValue(true);
      mockSetUserLocale.mockResolvedValue(undefined);
    });

    it('should update locale to English and return success', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 'en' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Locale updated successfully',
        locale: 'en',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('en');
      expect(mockSetUserLocale).toHaveBeenCalledWith('en');
    });

    it('should update locale to Vietnamese and return success', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 'vi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Locale updated successfully',
        locale: 'vi',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('vi');
      expect(mockSetUserLocale).toHaveBeenCalledWith('vi');
    });
  });

  describe('Invalid locale handling', () => {
    beforeEach(() => {
      mockSetUserLocale.mockResolvedValue(undefined);
    });

    it('should reject invalid locale and return 400', async () => {
      mockValidateLocale.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 'invalid-locale' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('invalid-locale');
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should reject missing locale and return 400', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should reject null locale and return 400', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: null }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should reject empty string locale and return 400', async () => {
      mockValidateLocale.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('');
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });
  });

  describe('Malformed request handling', () => {
    beforeEach(() => {
      mockValidateLocale.mockReturnValue(true);
      mockSetUserLocale.mockResolvedValue(undefined);
    });

    it('should handle invalid JSON and return 500', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to update locale',
      });
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to update locale:', expect.any(Error));
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should handle missing Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        body: JSON.stringify({ locale: 'en' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still work despite missing Content-Type
      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Locale updated successfully',
        locale: 'en',
      });
    });
  });

  describe('Server error handling', () => {
    beforeEach(() => {
      mockValidateLocale.mockReturnValue(true);
    });

    it('should handle setUserLocale failure and return 500', async () => {
      mockSetUserLocale.mockRejectedValue(new Error('Cookie setting failed'));

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 'en' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to update locale',
      });
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to update locale:', expect.any(Error));
      expect(mockSetUserLocale).toHaveBeenCalledWith('en');
    });
  });

  describe('Input validation edge cases', () => {
    beforeEach(() => {
      mockSetUserLocale.mockResolvedValue(undefined);
    });

    it('should handle locale with extra whitespace', async () => {
      mockValidateLocale.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: '  en  ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Locale updated successfully',
        locale: '  en  ',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('  en  ');
      expect(mockSetUserLocale).toHaveBeenCalledWith('  en  ');
    });

    it('should handle mixed case locale', async () => {
      mockValidateLocale.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 'EN' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith('EN');
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should handle numeric locale', async () => {
      mockValidateLocale.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid locale',
      });
      expect(mockValidateLocale).toHaveBeenCalledWith(123);
      expect(mockSetUserLocale).not.toHaveBeenCalled();
    });

    it('should handle additional request body parameters', async () => {
      mockValidateLocale.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3001/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          locale: 'vi',
          extraParam: 'should-be-ignored',
          userId: '123'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Locale updated successfully',
        locale: 'vi',
      });
      expect(mockSetUserLocale).toHaveBeenCalledWith('vi');
    });
  });
});