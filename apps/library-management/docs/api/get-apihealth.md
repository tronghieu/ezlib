# GET /api/health

Comprehensive system status endpoint for monitoring and deployment validation.

## Response Schema

```typescript
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string; // ISO 8601 format
  uptime_seconds: number; // Process uptime
  services: {
    database: {
      status: "healthy" | "degraded" | "unhealthy";
      latency_ms: number; // Query response time
      connection_pool?: {
        // Optional connection pool status
        active: number;
        idle: number;
        total: number;
      };
    };
    realtime: {
      status: "healthy" | "degraded" | "unhealthy";
      active_subscriptions: number; // Current WebSocket connections
      last_event_timestamp?: string;
    };
    crawler_service?: {
      // Optional external service check
      status: "healthy" | "degraded" | "unhealthy" | "unavailable";
      last_successful_call?: string;
      error?: string;
    };
  };
}
```

## Response Examples

**Healthy System:**

```json
{
  "status": "healthy",
  "timestamp": "2024-08-26T10:30:00.000Z",
  "uptime_seconds": 86400,
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 45
    },
    "realtime": {
      "status": "healthy",
      "active_subscriptions": 12,
      "last_event_timestamp": "2024-08-26T10:29:55.000Z"
    },
    "crawler_service": {
      "status": "healthy",
      "last_successful_call": "2024-08-26T10:25:00.000Z"
    }
  }
}
```

**Degraded System:**

```json
{
  "status": "degraded",
  "timestamp": "2024-08-26T10:30:00.000Z",
  "uptime_seconds": 86400,
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 45
    },
    "realtime": {
      "status": "healthy",
      "active_subscriptions": 12
    },
    "crawler_service": {
      "status": "degraded",
      "error": "Rate limit exceeded - enrichment temporarily disabled"
    }
  }
}
```

## Use Cases

- **CI/CD Pipeline**: Deployment validation and rollback triggers
- **Load Balancer**: Health check endpoint for traffic routing
- **Monitoring Systems**: Integration with Datadog, New Relic, etc.
- **Operations Dashboard**: Real-time system status visibility
- **Incident Response**: Quick triage and status verification

## Implementation Example

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  try {
    const supabase = createClient();

    // Database health check
    const dbStart = Date.now();
    const { data: dbTest, error: dbError } = await supabase
      .from("libraries")
      .select("id")
      .limit(1);

    const dbLatency = Date.now() - dbStart;

    // Determine database status
    const dbStatus = dbError
      ? "unhealthy"
      : dbLatency > 1000
        ? "degraded"
        : "healthy";

    if (dbStatus !== "healthy") {
      overallStatus = dbStatus === "unhealthy" ? "unhealthy" : "degraded";
    }

    // Crawler service check (optional)
    let crawlerStatus = "healthy";
    try {
      const crawlerResponse = await fetch(
        `${process.env.CRAWLER_API_URL}/health`,
        {
          timeout: 2000,
        }
      );
      crawlerStatus = crawlerResponse.ok ? "healthy" : "degraded";
    } catch {
      crawlerStatus = "unavailable";
      overallStatus = "degraded";
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
          ...(dbError && { error: dbError.message }),
        },
        realtime: {
          status: "healthy", // Assume healthy if DB is healthy
          active_subscriptions: 0, // Would track actual connections
        },
        ...(process.env.CRAWLER_API_URL && {
          crawler_service: {
            status: crawlerStatus,
          },
        }),
      },
    };

    return NextResponse.json(response, {
      status: overallStatus === "unhealthy" ? 503 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown system error",
      },
      { status: 503 }
    );
  }
}
```

---
