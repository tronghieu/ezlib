/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock Supabase SSR
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

describe("Auth Callback Route", () => {
  let mockExchangeCodeForSession: jest.Mock;
  let mockCreateServerClient: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExchangeCodeForSession = jest.fn();
    mockCreateServerClient = jest.requireMock("@supabase/ssr").createServerClient;

    mockCreateServerClient.mockReturnValue({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    });

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  const createRequest = (searchParams: Record<string, string>) => {
    const url = new URL("https://manage.ezlib.com/auth/callback");
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  describe("GET /auth/callback", () => {
    test("handles successful token exchange", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "admin@library.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const request = createRequest({ code: "auth-code-123" });
      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/dashboard");
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("auth-code-123");
    });

    test("handles missing authorization code", async () => {
      const request = createRequest({});
      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/auth/login?error=missing_code");
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    test("handles token exchange errors", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: "Invalid authorization code" },
      });

      const request = createRequest({ code: "invalid-code" });
      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/auth/login?error=auth_failed");
    });

    test("handles expired token errors", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: "Code expired" },
      });

      const request = createRequest({ code: "expired-code" });
      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/auth/login?error=link_expired");
    });

    test("respects redirect parameter", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "admin@library.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const request = createRequest({ 
        code: "auth-code-123",
        redirectTo: "/books"
      });
      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/books");
    });

    test("sets security headers", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "admin@library.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const request = createRequest({ code: "auth-code-123" });
      const response = await GET(request);

      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });
  });

  describe("POST /auth/callback", () => {
    test("returns method not allowed", async () => {
      const request = new NextRequest("https://manage.ezlib.com/auth/callback", {
        method: "POST",
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(405);
      const body = await response.json();
      expect(body.error).toBe("Method not allowed for auth callback");
    });
  });
});