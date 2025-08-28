/**
 * Real-time subscription tests
 * Tests subscription lifecycle, error handling, and memory management
 */

import {
  RealtimeManager,
  useBookInventoryUpdates,
  useAuthorUpdates,
} from "../realtime";

// Mock the Supabase client
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn().mockReturnThis(),
  removeAllChannels: jest.fn(),
};

const mockSupabase = {
  channel: jest.fn(() => mockChannel),
  removeAllChannels: jest.fn(),
};

jest.mock("../client", () => ({
  supabase: () => mockSupabase,
}));

describe("Real-time Subscription Tests", () => {
  let realtimeManager: RealtimeManager;

  beforeEach(() => {
    realtimeManager = new RealtimeManager();
    jest.clearAllMocks();
  });

  describe("RealtimeManager", () => {
    describe("Subscription Lifecycle", () => {
      it("should establish book edition subscriptions with proper callback", () => {
        // Given: A callback function for book edition updates
        const mockCallback = jest.fn();
        
        // When: Subscribing to book edition updates
        const result = realtimeManager.subscribeToBookEditions(mockCallback);
        
        // Then: Subscription is created with correct parameters
        expect(mockSupabase.channel).toHaveBeenCalledWith("book_inventory_updates");
        expect(mockChannel.on).toHaveBeenCalledWith(
          "postgres_changes",
          {
            event: "*",
            schema: "public", 
            table: "book_editions",
          },
          expect.any(Function)
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(result.subscribed).toBe(true);
      });

      it("should establish author subscriptions with proper callback", () => {
        // Given: A callback function for author updates
        const mockCallback = jest.fn();
        
        // When: Subscribing to author updates
        const result = realtimeManager.subscribeToAuthors(mockCallback);
        
        // Then: Subscription is created with correct parameters
        expect(mockSupabase.channel).toHaveBeenCalledWith("author_updates");
        expect(mockChannel.on).toHaveBeenCalledWith(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "authors",
          },
          expect.any(Function)
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(result.subscribed).toBe(true);
      });

      it("should properly cleanup subscriptions", () => {
        // Given: Active subscriptions
        const mockCallback = jest.fn();
        realtimeManager.subscribeToBookEditions(mockCallback);
        realtimeManager.subscribeToAuthors(mockCallback);
        
        // When: Unsubscribing from specific channel
        realtimeManager.unsubscribe("book_inventory_updates");
        
        // Then: Channel is properly unsubscribed
        expect(mockChannel.unsubscribe).toHaveBeenCalled();
      });

      it("should cleanup all subscriptions on disconnect", () => {
        // Given: Multiple active subscriptions
        const mockCallback = jest.fn();
        realtimeManager.subscribeToBookEditions(mockCallback);
        realtimeManager.subscribeToAuthors(mockCallback);
        
        // When: Disconnecting all subscriptions
        realtimeManager.disconnectAll();
        
        // Then: All channels are removed
        expect(mockSupabase.removeAllChannels).toHaveBeenCalled();
      });
    });

    describe("Connection Management", () => {
      it("should track connection status properly", () => {
        // Given: Fresh realtime manager
        expect(realtimeManager.isConnected()).toBe(false);
        
        // When: Establishing subscription
        const mockCallback = jest.fn();
        realtimeManager.subscribeToBookEditions(mockCallback);
        
        // Then: Connection status is updated
        expect(realtimeManager.isConnected()).toBe(true);
      });

      it("should handle multiple subscriptions to same channel", () => {
        // Given: Multiple callbacks for same channel
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        // When: Subscribing multiple times to same channel
        const result1 = realtimeManager.subscribeToBookEditions(callback1);
        const result2 = realtimeManager.subscribeToBookEditions(callback2);
        
        // Then: Only one subscription is created, second is skipped
        expect(result1.subscribed).toBe(true);
        expect(result2.subscribed).toBe(false);
        expect(result2.reason).toContain("already exists");
        expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
      });
    });

    describe("Error Handling", () => {
      it("should handle subscription errors gracefully", () => {
        // Given: Supabase client that throws error
        mockSupabase.channel.mockImplementationOnce(() => {
          throw new Error("Connection failed");
        });
        
        const mockCallback = jest.fn();
        
        // When: Attempting to subscribe
        const result = realtimeManager.subscribeToBookEditions(mockCallback);
        
        // Then: Error is handled gracefully
        expect(result.subscribed).toBe(false);
        expect(result.error).toContain("Connection failed");
      });

      it("should handle callback errors without breaking subscription", () => {
        // Given: Callback that throws error
        const errorCallback = jest.fn(() => {
          throw new Error("Callback error");
        });
        
        // When: Subscription receives data
        realtimeManager.subscribeToBookEditions(errorCallback);
        
        // Get the callback passed to the channel
        const channelCallback = mockChannel.on.mock.calls[0][2];
        
        // Then: Error in callback doesn't break subscription
        expect(() => {
          channelCallback({ eventType: "INSERT", new: { id: "test" } });
        }).not.toThrow();
        
        expect(errorCallback).toHaveBeenCalled();
      });
    });

    describe("Memory Management", () => {
      it("should prevent memory leaks by cleaning up properly", () => {
        // Given: Multiple subscriptions
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        realtimeManager.subscribeToBookEditions(callback1);
        realtimeManager.subscribeToAuthors(callback2);
        
        // When: Disconnecting all subscriptions
        realtimeManager.disconnectAll();
        
        // Then: All references are cleaned up
        expect(realtimeManager.isConnected()).toBe(false);
        expect(mockSupabase.removeAllChannels).toHaveBeenCalled();
      });

      it("should handle unsubscribe from non-existent channel", () => {
        // Given: No active subscriptions
        
        // When: Attempting to unsubscribe from non-existent channel
        const result = realtimeManager.unsubscribe("non-existent");
        
        // Then: No error is thrown, operation is ignored
        expect(result).toBe(false);
        expect(mockChannel.unsubscribe).not.toHaveBeenCalled();
      });
    });
  });

  describe("Hook Functions", () => {
    describe("useBookInventoryUpdates", () => {
      it("should return proper subscription interface", () => {
        // Given: Hook usage
        const mockCallback = jest.fn();
        
        // When: Using the hook
        const hookResult = useBookInventoryUpdates(mockCallback, true);
        
        // Then: Returns proper interface
        expect(hookResult).toMatchObject({
          subscribe: expect.any(Function),
          unsubscribe: expect.any(Function),
          isConnected: expect.any(Function),
        });
      });

      it("should handle enabled/disabled state", () => {
        // Given: Hook with disabled state
        const mockCallback = jest.fn();
        
        // When: Using hook with enabled=false (parameter is currently unused but tested for interface)
        const result = useBookInventoryUpdates(mockCallback, false);
        
        // Then: Still returns proper interface (future implementation will respect enabled flag)
        expect(result.subscribe).toBeDefined();
        expect(result.unsubscribe).toBeDefined();
        expect(result.isConnected).toBeDefined();
      });

      it("should provide working subscription methods", () => {
        // Given: Hook result
        const mockCallback = jest.fn();
        const hookResult = useBookInventoryUpdates(mockCallback);
        
        // When: Using subscription methods
        const subscribeResult = hookResult.subscribe();
        const isConnected = hookResult.isConnected();
        hookResult.unsubscribe();
        
        // Then: Methods work as expected
        expect(subscribeResult.subscribed).toBe(true);
        expect(typeof isConnected).toBe("boolean");
      });
    });

    describe("useAuthorUpdates", () => {
      it("should return proper subscription interface", () => {
        // Given: Hook usage
        const mockCallback = jest.fn();
        
        // When: Using the hook
        const hookResult = useAuthorUpdates(mockCallback, true);
        
        // Then: Returns proper interface
        expect(hookResult).toMatchObject({
          subscribe: expect.any(Function),
          unsubscribe: expect.any(Function),
          isConnected: expect.any(Function),
        });
      });

      it("should provide working subscription methods", () => {
        // Given: Hook result
        const mockCallback = jest.fn();
        const hookResult = useAuthorUpdates(mockCallback);
        
        // When: Using subscription methods  
        const subscribeResult = hookResult.subscribe();
        const isConnected = hookResult.isConnected();
        hookResult.unsubscribe();
        
        // Then: Methods work as expected
        expect(subscribeResult.subscribed).toBe(true);
        expect(typeof isConnected).toBe("boolean");
      });
    });
  });

  describe("Data Processing", () => {
    it("should process book inventory events correctly", () => {
      // Given: Subscription with callback
      const mockCallback = jest.fn();
      realtimeManager.subscribeToBookEditions(mockCallback);
      
      // Get the callback passed to the channel
      const channelCallback = mockChannel.on.mock.calls[0][2];
      
      // When: Receiving INSERT event
      const insertEvent = {
        eventType: "INSERT",
        schema: "public",
        table: "book_editions",
        new: { id: "book-1", title: "Test Book", general_book_id: "gen-1" },
        old: null,
      };
      
      channelCallback(insertEvent);
      
      // Then: Callback receives processed event
      expect(mockCallback).toHaveBeenCalledWith({
        type: "book_inventory_update",
        operation: "INSERT",
        bookEdition: insertEvent.new,
        timestamp: expect.any(String),
      });
    });

    it("should process book inventory UPDATE events correctly", () => {
      // Given: Subscription with callback
      const mockCallback = jest.fn();
      realtimeManager.subscribeToBookEditions(mockCallback);
      
      const channelCallback = mockChannel.on.mock.calls[0][2];
      
      // When: Receiving UPDATE event
      const updateEvent = {
        eventType: "UPDATE",
        schema: "public", 
        table: "book_editions",
        new: { id: "book-1", title: "Updated Book", general_book_id: "gen-1" },
        old: { id: "book-1", title: "Old Book", general_book_id: "gen-1" },
      };
      
      channelCallback(updateEvent);
      
      // Then: Callback receives processed event with both old and new data
      expect(mockCallback).toHaveBeenCalledWith({
        type: "book_inventory_update",
        operation: "UPDATE", 
        bookEdition: updateEvent.new,
        previousData: updateEvent.old,
        timestamp: expect.any(String),
      });
    });

    it("should process author events correctly", () => {
      // Given: Author subscription with callback
      const mockCallback = jest.fn();
      realtimeManager.subscribeToAuthors(mockCallback);
      
      const channelCallback = mockChannel.on.mock.calls[0][2];
      
      // When: Receiving author INSERT event
      const authorEvent = {
        eventType: "INSERT",
        schema: "public",
        table: "authors", 
        new: { id: "author-1", name: "Test Author", canonical_name: "test-author" },
        old: null,
      };
      
      channelCallback(authorEvent);
      
      // Then: Callback receives standard realtime event
      expect(mockCallback).toHaveBeenCalledWith(authorEvent);
    });
  });

  describe("Reconnection Logic", () => {
    it("should handle reconnection after connection loss", () => {
      // Given: Active subscription
      const mockCallback = jest.fn();
      realtimeManager.subscribeToBookEditions(mockCallback);
      
      // When: Connection is lost and re-established
      realtimeManager.disconnectAll();
      expect(realtimeManager.isConnected()).toBe(false);
      
      // Re-subscribe
      const reconnectResult = realtimeManager.subscribeToBookEditions(mockCallback);
      
      // Then: Reconnection succeeds
      expect(reconnectResult.subscribed).toBe(true);
      expect(realtimeManager.isConnected()).toBe(true);
    });
  });
});