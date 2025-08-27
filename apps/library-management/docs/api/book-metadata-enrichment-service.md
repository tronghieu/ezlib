# Book Metadata Enrichment Service

## Service Endpoint

**Base URL**: `http://localhost:8000` (development) | `https://crawler.ezlib.com` (production)  
**Endpoint**: `POST /api/v1/enrich`

## Authentication

Service uses shared authentication secret in request headers:

```http
Authorization: Bearer ${CRAWLER_SERVICE_AUTH_SECRET}
Content-Type: application/json
X-Library-Context: ${library_id}
```

## Request/Response Examples

**Successful Enrichment:**

```json
// Request
{
  "isbn_13": "9780142437239",
  "library_id": "550e8400-e29b-41d4-a716-446655440000",
  "enrichment_priority": "normal"
}

// Response (200 OK)
{
  "success": true,
  "book_metadata": {
    "title": "The Catcher in the Rye",
    "authors": ["J.D. Salinger"],
    "description": "A classic coming-of-age story...",
    "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780142437239-L.jpg",
    "publication_date": "2001-05-01",
    "genre_tags": ["fiction", "coming-of-age", "classic"],
    "publisher": "Penguin Classics",
    "page_count": 234
  }
}
```

**Error Scenarios:**

```json
// ISBN Not Found (404 Not Found)
{
  "success": false,
  "error_details": {
    "code": "ISBN_NOT_FOUND",
    "message": "No metadata available for ISBN 9780142437239 in external databases"
  }
}

// Rate Limited (429 Too Many Requests)
{
  "success": false,
  "error_details": {
    "code": "RATE_LIMITED",
    "message": "API rate limit exceeded. Please retry after the specified delay.",
    "retry_after": 60
  }
}
```

## Integration Patterns

**Graceful Degradation:**

```typescript
// components/inventory/isbn-lookup.tsx
export async function enrichBookMetadata(isbn: string, libraryId: string) {
  try {
    const response = await fetch(
      `${process.env.CRAWLER_API_URL}/api/v1/enrich`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRAWLER_SERVICE_AUTH_SECRET}`,
        },
        body: JSON.stringify({ isbn_13: isbn, library_id: libraryId }),
      }
    );

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        return { success: false, fallback: "manual_entry" };
      }
      if (response.status === 429) {
        const data = await response.json();
        return { success: false, retry_after: data.error_details?.retry_after };
      }
      throw new Error(`Enrichment failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, metadata: data.book_metadata };
  } catch (error) {
    // Network errors, service unavailable, etc.
    console.error("Book enrichment failed:", error);
    return { success: false, fallback: "manual_entry" };
  }
}
```

**Error Handling Strategy:**

- **ISBN Not Found**: Show manual entry form with ISBN pre-filled
- **Rate Limited**: Display countdown timer, cache request for retry
- **Service Unavailable**: Allow manual entry, queue enrichment for later
- **Invalid ISBN**: Show ISBN validation error, request correction

````

## 3. Real-Time Event Documentation

**Event Type Definitions:**
```typescript
// lib/realtime/event-types.ts

// Library Management App → Reader App synchronization
export type InventoryUpdateEvent = {
  type: 'availability_changed'
  book_id: string                    // book_edition_id for metadata lookup
  library_id: string                 // tenant context
  status: 'available' | 'checked_out' | 'hold' | 'maintenance'
  borrower_id?: string               // user_id when checked out
  due_date?: string                  // ISO timestamp (post-MVP)
  timestamp: string                  // Event occurrence time
}

// Reader App → Library Management App notifications
export type HoldRequestEvent = {
  type: 'hold_requested'             // Future enhancement
  book_id: string
  library_id: string
  requesting_user_id: string
  hold_position: number
  timestamp: string
}

// System-wide synchronization events
export type CrossAppSyncEvent = {
  type: 'inventory_updated' | 'member_updated' | 'transaction_processed'
  entity_id: string
  library_id: string
  changes: Record<string, any>       // Changed fields and new values
  timestamp: string
}
````

**Real-Time Integration Guide:**

```markdown

```
