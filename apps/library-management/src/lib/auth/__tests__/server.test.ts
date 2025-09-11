/**
 * @jest-environment node
 */

import {
  getUserRoleForLibrary,
  canAccessLibrary,
  getUserLibraries,
} from "../server";

// Mock the Supabase server client properly
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  })),
};

// Mock the createClient function from our server module
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

describe("Server-side Authentication and Permission Utilities", () => {
  const testUserId = "test-user-123";
  const testLibraryId = "test-library-456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserRoleForLibrary", () => {
    it("should return null when no staff record found", async () => {
      // Mock database returning no data (PGRST116 error)
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
          })),
        })),
      }));

      const role = await getUserRoleForLibrary(testUserId, testLibraryId);

      expect(role).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("library_staff");
    });

    it("should return user role when staff record exists", async () => {
      // Mock database returning valid staff data
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: "manager", status: "active" },
        error: null,
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
          })),
        })),
      }));

      const role = await getUserRoleForLibrary(testUserId, testLibraryId);

      expect(role).toBe("manager");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("library_staff");
    });

    it("should return null when database error occurs", async () => {
      // Mock database returning error
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
          })),
        })),
      }));

      const role = await getUserRoleForLibrary(testUserId, testLibraryId);

      expect(role).toBeNull();
    });
  });

  describe("canAccessLibrary", () => {
    it("should return true when user has library access", async () => {
      // Mock successful role retrieval
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: "librarian", status: "active" },
        error: null,
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
          })),
        })),
      }));

      const canAccess = await canAccessLibrary(testUserId, testLibraryId);

      expect(canAccess).toBe(true);
    });

    it("should return false when user has no library access", async () => {
      // Mock no staff record found
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
          })),
        })),
      }));

      const canAccess = await canAccessLibrary(testUserId, testLibraryId);

      expect(canAccess).toBe(false);
    });
  });

  describe("getUserLibraries", () => {
    it("should return empty array when user has no library access", async () => {
      // Mock database returning no libraries
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "No rows found" },
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockEq,
          })),
        })),
      }));

      const libraries = await getUserLibraries(testUserId);

      expect(Array.isArray(libraries)).toBe(true);
      expect(libraries.length).toBe(0);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("library_staff");
    });

    it("should return user's accessible libraries when they exist", async () => {
      // Mock database returning libraries
      const mockLibraries = [
        {
          library_id: testLibraryId,
          role: "owner",
          status: "active",
          libraries: {
            id: testLibraryId,
            name: "Test Library",
            code: "TEST-LIB",
            settings: {},
          },
        },
      ];

      const mockEq = jest.fn().mockResolvedValue({
        data: mockLibraries,
        error: null,
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockEq,
          })),
        })),
      }));

      const libraries = await getUserLibraries(testUserId);

      expect(Array.isArray(libraries)).toBe(true);
      expect(libraries.length).toBe(1);
      expect(libraries[0]).toHaveProperty("library_id");
      expect(libraries[0]).toHaveProperty("role");
      expect(libraries[0]).toHaveProperty("libraries");
      expect(libraries[0].libraries.name).toBe("Test Library");
    });

    it("should return empty array on database error", async () => {
      // Mock database error
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockEq,
          })),
        })),
      }));

      const libraries = await getUserLibraries(testUserId);

      expect(Array.isArray(libraries)).toBe(true);
      expect(libraries.length).toBe(0);
    });
  });

  describe("Database query structure validation", () => {
    it("should use correct query structure for staff role lookup", async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { role: "owner", status: "active" },
                error: null,
              }),
            })),
          })),
        })),
      }));

      mockSupabaseClient.from = jest.fn(() => ({
        select: mockSelect,
      }));

      await getUserRoleForLibrary(testUserId, testLibraryId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("library_staff");
      expect(mockSelect).toHaveBeenCalledWith("role, status");
    });

    it("should use correct query structure for user libraries lookup", async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from = jest.fn(() => ({
        select: mockSelect,
      }));

      await getUserLibraries(testUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("library_staff");
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("libraries ("));
    });
  });
});