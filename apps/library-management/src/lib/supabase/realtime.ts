/**
 * Real-time subscription utilities for Supabase integration
 * Establishes foundation for Epic 2 real-time features
 * 
 * @implements Story 1.2 AC6: Real-time Subscription Foundation
 */

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Type-safe table names for subscriptions
type TableName = keyof Database["public"]["Tables"];

// Real-time event types
export interface RealtimeEvent<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  new?: T;
  old?: T;
  errors?: string[];
}

// Book inventory event type
export type BookInventoryEvent = RealtimeEvent<Database["public"]["Tables"]["book_editions"]["Row"]>;

// Connection status
export interface RealtimeConnectionStatus {
  connected: boolean;
  channel: string | null;
  subscribedAt: string | null;
  error?: string;
}

/**
 * Real-time subscription manager
 * Handles connection lifecycle and event processing
 */
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionCallbacks: Set<(status: RealtimeConnectionStatus) => void> = new Set();

  /**
   * Subscribe to table changes with type safety
   */
  async subscribeToTable<T extends TableName>(
    tableName: T,
    callback: (event: RealtimeEvent<Database["public"]["Tables"][T]["Row"]>) => void,
    options: {
      event?: "INSERT" | "UPDATE" | "DELETE" | "*";
      filter?: string;
      channelName?: string;
    } = {}
  ): Promise<RealtimeChannel> {
    const channelName = options.channelName || `${tableName}_changes`;
    const event = options.event || "*";

    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      await this.unsubscribe(channelName);
    }

    // Create new channel
    const supabase = createClient();
    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event,
          schema: "public",
          table: tableName,
          ...(options.filter && { filter: options.filter }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const realtimeEvent: RealtimeEvent<Database["public"]["Tables"][T]["Row"]> = {
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            schema: payload.schema,
            table: payload.table,
            new: payload.new,
            old: payload.old,
            errors: payload.errors,
          };

          callback(realtimeEvent);
        }
      )
      .subscribe((status) => {
        const connectionStatus: RealtimeConnectionStatus = {
          connected: status === "SUBSCRIBED",
          channel: channelName,
          subscribedAt: status === "SUBSCRIBED" ? new Date().toISOString() : null,
          ...(status === "CHANNEL_ERROR" && { error: "Subscription failed" }),
        };

        this.notifyConnectionCallbacks(connectionStatus);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to book edition changes
   * Specialized subscription for book inventory updates
   */
  async subscribeToBookEditions(
    callback: (event: BookInventoryEvent) => void,
    filter?: string
  ): Promise<RealtimeChannel> {
    return this.subscribeToTable(
      "book_editions",
      callback as (event: RealtimeEvent) => void,
      {
        channelName: "book_inventory_updates",
        filter,
      }
    );
  }

  /**
   * Subscribe to author changes
   * For author-related real-time updates
   */
  async subscribeToAuthors(
    callback: (event: RealtimeEvent<Database["public"]["Tables"]["authors"]["Row"]>) => void,
    filter?: string
  ): Promise<RealtimeChannel> {
    return this.subscribeToTable("authors", callback, {
      channelName: "author_updates",
      filter,
    });
  }

  /**
   * Subscribe to review changes
   * For real-time review notifications
   */
  async subscribeToReviews(
    callback: (event: RealtimeEvent<Database["public"]["Tables"]["reviews"]["Row"]>) => void,
    filter?: string
  ): Promise<RealtimeChannel> {
    return this.subscribeToTable("reviews", callback, {
      channelName: "review_updates", 
      filter,
    });
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      const supabase = createClient();
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);

      this.notifyConnectionCallbacks({
        connected: false,
        channel: channelName,
        subscribedAt: null,
      });
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const channelNames = Array.from(this.channels.keys());
    await Promise.all(channelNames.map((name) => this.unsubscribe(name)));
  }

  /**
   * Get connection status for all channels
   */
  getConnectionStatus(): Map<string, RealtimeConnectionStatus> {
    const statusMap = new Map<string, RealtimeConnectionStatus>();
    
    this.channels.forEach((channel, channelName) => {
      statusMap.set(channelName, {
        connected: channel.state === "joined",
        channel: channelName,
        subscribedAt: channel.state === "joined" ? new Date().toISOString() : null,
      });
    });

    return statusMap;
  }

  /**
   * Add connection status callback
   */
  onConnectionChange(callback: (status: RealtimeConnectionStatus) => void): () => void {
    this.connectionCallbacks.add(callback);
    
    // Return cleanup function
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Test real-time connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    try {
      const startTime = Date.now();
      
      // Create a test channel
      const supabase = createClient();
      const testChannel = supabase
        .channel("connection_test")
        .on("presence", { event: "sync" }, () => {
          // Test event handler
        })
        .subscribe();

      // Wait for subscription
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testChannel.on("postgres_changes" as any, { event: "*", schema: "public", table: "authors" } as any, () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      const latency = Date.now() - startTime;
      
      // Clean up test channel
      await supabase.removeChannel(testChannel);

      return { success: true, latency };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private notifyConnectionCallbacks(status: RealtimeConnectionStatus): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("Error in connection callback:", error);
      }
    });
  }
}

// Global instance for application use
export const realtimeManager = new RealtimeManager();

/**
 * React hook for real-time subscriptions
 * Provides lifecycle management and cleanup
 */
export function useRealtimeSubscription<T extends TableName>(
  tableName: T,
  callback: (event: RealtimeEvent<Database["public"]["Tables"][T]["Row"]>) => void,
  options?: {
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    filter?: string;
    enabled?: boolean;
  }
) {
  // Note: enabled parameter will be used when this hook is properly implemented in React components

  // This will be properly implemented when used in React components
  // For now, provide the subscription interface
  return {
    subscribe: () => realtimeManager.subscribeToTable(tableName, callback, options),
    unsubscribe: () => realtimeManager.unsubscribe(`${tableName}_changes`),
    isConnected: () => {
      const status = realtimeManager.getConnectionStatus();
      return status.get(`${tableName}_changes`)?.connected || false;
    },
  };
}

/**
 * Specialized hooks for common use cases
 */

/**
 * Hook for book inventory real-time updates
 * Will be used in Epic 2 for live inventory management
 */
export function useBookInventoryUpdates(
  callback: (event: BookInventoryEvent) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _enabled: boolean = true
) {
  return {
    subscribe: () => realtimeManager.subscribeToBookEditions(callback),
    unsubscribe: () => realtimeManager.unsubscribe("book_inventory_updates"),
    isConnected: () => {
      const status = realtimeManager.getConnectionStatus();
      return status.get("book_inventory_updates")?.connected || false;
    },
  };
}

/**
 * Hook for author updates
 */
export function useAuthorUpdates(
  callback: (event: RealtimeEvent<Database["public"]["Tables"]["authors"]["Row"]>) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _enabled: boolean = true
) {
  return {
    subscribe: () => realtimeManager.subscribeToAuthors(callback),
    unsubscribe: () => realtimeManager.unsubscribe("author_updates"),
    isConnected: () => {
      const status = realtimeManager.getConnectionStatus();
      return status.get("author_updates")?.connected || false;
    },
  };
}

/**
 * Connection management utilities
 */
export const RealtimeUtils = {
  /**
   * Initialize real-time for the application
   */
  async initialize(): Promise<void> {
    // Any global real-time initialization can go here
    console.log("Real-time foundation initialized");
  },

  /**
   * Cleanup all real-time connections
   */
  async cleanup(): Promise<void> {
    await realtimeManager.unsubscribeAll();
    console.log("Real-time connections cleaned up");
  },

  /**
   * Get comprehensive connection status
   */
  getStatus() {
    return {
      channels: realtimeManager.getConnectionStatus(),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Test real-time connectivity
   */
  async test() {
    return realtimeManager.testConnection();
  },
} as const;