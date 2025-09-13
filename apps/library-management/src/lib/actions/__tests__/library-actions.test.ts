/**
 * Unit tests for library-actions.ts
 * Testing server-side library action functions
 */

import { getUserLibraries, validateLibraryAccess, validateLibraryAccessByCode } from "../library-actions";
import { createClient } from "@/lib/supabase/server";

// Mock the Supabase server client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("library-actions", () => {
  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
  };
  let mockAuth: {
    getUser: jest.Mock;
  };
  let mockFrom: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock auth methods
    mockAuth = {
      getUser: jest.fn(),
    };

    // Setup mock from methods
    mockFrom = jest.fn();

    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: mockAuth,
      from: mockFrom,
    };

    // Make createClient return our mock
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe("getUserLibraries", () => {
    it("should return empty array when user is not authenticated", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserLibraries();

      expect(result).toEqual([]);
      expect(mockAuth.getUser).toHaveBeenCalledTimes(1);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should return empty array when auth error occurs", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Auth error"),
      });

      const result = await getUserLibraries();

      expect(result).toEqual([]);
      expect(mockAuth.getUser).toHaveBeenCalledTimes(1);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should fetch and transform user libraries successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockLibraryData = [
        {
          id: "staff-1",
          role: "admin",
          status: "active",
          libraries: {
            id: "lib-1",
            name: "Central Library",
            code: "CENTRAL",
            address: { street: "123 Main St" },
            contact_info: { email: "central@library.com" },
            settings: {},
            stats: {},
            status: "active",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        },
        {
          id: "staff-2",
          role: "librarian",
          status: "active",
          libraries: {
            id: "lib-2",
            name: "Branch Library",
            code: "BRANCH",
            address: { street: "456 Oak Ave" },
            contact_info: { email: "branch@library.com" },
            settings: {},
            stats: {},
            status: "active",
            created_at: "2024-01-02",
            updated_at: "2024-01-02",
          },
        },
      ];

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockLibraryData,
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getUserLibraries();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockLibraryData[0].libraries,
        user_role: "admin",
        staff_id: "staff-1",
        staff_status: "active",
      });
      expect(result[1]).toEqual({
        ...mockLibraryData[1].libraries,
        user_role: "librarian",
        staff_id: "staff-2",
        staff_status: "active",
      });

      expect(mockFrom).toHaveBeenCalledWith("library_staff");
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it("should filter out inactive libraries", async () => {
      const mockUser = { id: "user-123" };
      const mockLibraryData = [
        {
          id: "staff-1",
          role: "admin",
          status: "active",
          libraries: {
            id: "lib-1",
            name: "Active Library",
            code: "ACTIVE",
            status: "active",
            address: {},
            contact_info: {},
            settings: {},
            stats: {},
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        },
        {
          id: "staff-2",
          role: "librarian",
          status: "active",
          libraries: {
            id: "lib-2",
            name: "Inactive Library",
            code: "INACTIVE",
            status: "inactive",
            address: {},
            contact_info: {},
            settings: {},
            stats: {},
            created_at: "2024-01-02",
            updated_at: "2024-01-02",
          },
        },
        {
          id: "staff-3",
          role: "admin",
          status: "active",
          libraries: null,
        },
      ];

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockLibraryData,
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getUserLibraries();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Active Library");
    });

    it("should throw error when database query fails", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await expect(getUserLibraries()).rejects.toThrow("Failed to fetch libraries: Database error");
    });

    it("should return empty array when data is null", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getUserLibraries();

      expect(result).toEqual([]);
    });
  });

  describe("validateLibraryAccess", () => {
    it("should return hasAccess false when user is not authenticated", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await validateLibraryAccess("lib-123");

      expect(result).toEqual({
        hasAccess: false,
        error: "User not authenticated",
      });
      expect(mockAuth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should return hasAccess false when auth error occurs", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Auth failed"),
      });

      const result = await validateLibraryAccess("lib-123");

      expect(result).toEqual({
        hasAccess: false,
        error: "User not authenticated",
      });
    });

    it("should return hasAccess true with role and staffId when user has access", async () => {
      const mockUser = { id: "user-123" };
      const mockStaffData = {
        id: "staff-456",
        role: "admin",
        status: "active",
        libraries: {
          id: "lib-123",
          name: "Test Library",
          code: "TEST",
          address: {},
          contact_info: {},
          settings: {},
          stats: {},
          status: "active",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStaffData,
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await validateLibraryAccess("lib-123");

      expect(result).toEqual({
        hasAccess: true,
        role: "admin",
        staffId: "staff-456",
      });

      expect(mockFrom).toHaveBeenCalledWith("library_staff");
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQuery.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
    });

    it("should return hasAccess false when no staff record found", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("No rows found"),
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await validateLibraryAccess("lib-123");

      expect(result).toEqual({
        hasAccess: false,
        error: "No rows found",
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await validateLibraryAccess("lib-123");

      expect(result).toEqual({
        hasAccess: false,
        error: "Unexpected error",
      });
    });
  });

  describe("validateLibraryAccessByCode", () => {
    it("should return hasAccess false when user is not authenticated", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await validateLibraryAccessByCode("TESTLIB");

      expect(result).toEqual({
        hasAccess: false,
        error: "User not authenticated",
      });
    });

    it("should return hasAccess false when library not found", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Library not found"),
        }),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "libraries") {
          return mockLibraryQuery;
        }
        return null;
      });

      const result = await validateLibraryAccessByCode("NOTFOUND");

      expect(result).toEqual({
        hasAccess: false,
        error: "Library not found",
      });

      expect(mockFrom).toHaveBeenCalledWith("libraries");
      expect(mockLibraryQuery.eq).toHaveBeenCalledWith("code", "NOTFOUND");
      expect(mockLibraryQuery.eq).toHaveBeenCalledWith("status", "active");
    });

    it("should return hasAccess false when user has no staff access", async () => {
      const mockUser = { id: "user-123" };
      const mockLibrary = {
        id: "lib-123",
        name: "Test Library",
        code: "TESTLIB",
        address: {},
        contact_info: {},
        settings: {},
        stats: {},
        status: "active",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLibrary,
          error: null,
        }),
      };

      const mockStaffQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("No access"),
        }),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "libraries") {
          return mockLibraryQuery;
        }
        if (table === "library_staff") {
          return mockStaffQuery;
        }
        return null;
      });

      const result = await validateLibraryAccessByCode("TESTLIB");

      expect(result).toEqual({
        hasAccess: false,
        error: "No access",
      });

      expect(mockStaffQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockStaffQuery.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockStaffQuery.eq).toHaveBeenCalledWith("status", "active");
    });

    it("should return library with access info when user has valid access", async () => {
      const mockUser = { id: "user-123" };
      const mockLibrary = {
        id: "lib-123",
        name: "Test Library",
        code: "TESTLIB",
        address: { street: "123 Main St" },
        contact_info: { email: "test@library.com" },
        settings: { feature: true },
        stats: { books: 1000 },
        status: "active",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };
      const mockStaffData = {
        id: "staff-456",
        role: "librarian",
        status: "active",
      };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLibrary,
          error: null,
        }),
      };

      const mockStaffQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStaffData,
          error: null,
        }),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "libraries") {
          return mockLibraryQuery;
        }
        if (table === "library_staff") {
          return mockStaffQuery;
        }
        return null;
      });

      const result = await validateLibraryAccessByCode("TESTLIB");

      expect(result.hasAccess).toBe(true);
      expect(result.role).toBe("librarian");
      expect(result.staffId).toBe("staff-456");
      expect(result.library).toEqual({
        ...mockLibrary,
        user_role: "librarian",
        staff_id: "staff-456",
        staff_status: "active",
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const result = await validateLibraryAccessByCode("TESTLIB");

      expect(result).toEqual({
        hasAccess: false,
        error: "Unexpected database error",
      });
    });

    it("should handle non-Error exceptions", async () => {
      const mockUser = { id: "user-123" };
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation(() => {
        throw "String error";
      });

      const result = await validateLibraryAccessByCode("TESTLIB");

      expect(result).toEqual({
        hasAccess: false,
        error: "Access validation failed",
      });
    });
  });
});