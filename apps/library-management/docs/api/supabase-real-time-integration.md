# Supabase Real-Time Integration

## Subscription Architecture

The Library Management App uses Supabase's real-time capabilities for instant cross-app synchronization.

**Channel Subscription Pattern:**

```typescript
// lib/services/realtime-service.ts
export class RealtimeService {
  private supabase = createClient();

  subscribeToInventoryChanges(
    libraryId: string,
    onUpdate: InventoryUpdateCallback
  ) {
    const channel = this.supabase
      .channel(`library-${libraryId}-inventory`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "book_copies",
          filter: `library_id=eq.${libraryId}`, // Automatic tenant filtering
        },
        (payload) => {
          // Transform database event to application event
          const event: InventoryUpdateEvent = {
            type: "availability_changed",
            book_id: payload.new.book_edition_id,
            library_id: payload.new.library_id,
            status: payload.new.availability.status,
            borrower_id: payload.new.availability.current_borrower_id,
            timestamp: new Date().toISOString(),
          };
          onUpdate(event);
        }
      )
      .subscribe();

    return () => this.supabase.removeChannel(channel);
  }
}
```

## Cross-App Data Flow

**Library Management → Reader App:**

1. Library staff processes book checkout in admin interface
2. `book_copies.availability` updated in shared database
3. PostgreSQL trigger fires real-time event
4. Reader App receives inventory update via WebSocket
5. Book availability instantly updates on public interface (ezlib.com)

**Event Filtering & Security:**

- All real-time events filtered by `library_id` for tenant isolation
- Row Level Security policies apply to real-time subscriptions
- WebSocket authentication uses same Supabase JWT tokens
- Rate limiting prevents subscription abuse

**Error Handling:**

```typescript
// Real-time connection management with reconnection logic
export function useRealtimeConnection(libraryId: string) {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");

  useEffect(() => {
    const realtimeService = new RealtimeService();
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const subscribe = () => {
      const unsubscribe = realtimeService.subscribeToInventoryChanges(
        libraryId,
        (event) => {
          setConnectionStatus("connected");
          reconnectAttempts = 0;
          handleInventoryUpdate(event);
        }
      );

      return unsubscribe;
    };

    let unsubscribe = subscribe();

    // Reconnection logic for network issues
    const handleReconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        setConnectionStatus("connecting");
        reconnectAttempts++;
        setTimeout(() => {
          unsubscribe = subscribe();
        }, 1000 * reconnectAttempts); // Exponential backoff
      } else {
        setConnectionStatus("error");
      }
    };

    return unsubscribe;
  }, [libraryId]);

  return { connectionStatus };
}
```

````

## 4. Next.js API Routes Documentation

**Health Check Endpoint:**
```typescript
// docs/api/health-endpoints.md
````
