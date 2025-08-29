/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";

// Mock Supabase SSR
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("Authentication Middleware", () => {
  let mockGetUser: jest.Mock;
  let mockCreateServerClient: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetUser = jest.fn();
    mockCreateServerClient = jest.requireMock("@supabase/ssr").createServerClient;

    mockCreateServerClient.mockImplementation((url: string, key: string, options: unknown) => {
      // Simulate the cookies behavior
      if (options && typeof options === "object" && "cookies" in options) {
        const cookieOptions = options as { cookies: { setAll: (cookies: unknown[]) => void } };
        cookieOptions.cookies.setAll([]);
      }
      return {
        auth: {
          getUser: mockGetUser,
        },
      };
    });

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  const createRequest = (pathname: string) => {
    return new NextRequest(new URL(pathname, "https://manage.ezlib.com"));
  };

  describe("Public Routes", () => {
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/callback",
      "/auth/error",
      "/api/health",
      "/api/auth/callback",
      "/favicon.ico",
    ];

    test.each(publicRoutes)("allows access to public route: %s", async (route) => {
      const request = createRequest(route);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  describe("Protected Routes", () => {
    test("middleware function exists and can be called", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "admin@library.com" } },
        error: null,
      });

      const request = createRequest("/dashboard");
      const response = await middleware(request);

      // Basic test - ensure middleware returns a response
      expect(response).toBeDefined();
      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  describe("Session Refresh", () => {
    test("processes session refresh correctly", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "admin@library.com" } },
        error: null,
      });

      const request = createRequest("/dashboard");
      
      // Mock cookies to simulate session refresh
      request.cookies.set("sb-access-token", "old-token");
      
      const response = await middleware(request);

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
      
      expect(response.status).toBe(200);
    });
  });
});