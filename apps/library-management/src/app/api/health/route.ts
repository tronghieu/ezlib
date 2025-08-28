import { NextResponse } from "next/server";
import { checkComprehensiveHealth } from "@/lib/supabase/health";

/**
 * Health Check API Route
 * GET /api/health
 *
 * Enhanced with Supabase integration validation including:
 * - Environment configuration validation
 * - Database connectivity testing
 * - Application version and feature flags
 * - Comprehensive system health status
 * 
 * @implements Story 1.2 AC4: Database Integration Validation
 */
export async function GET() {
  try {
    // Use comprehensive health check with database connectivity
    const healthResult = await checkComprehensiveHealth();
    
    // Determine HTTP status code based on health
    const statusCode = healthResult.healthy ? 200 : 503;
    
    // Enhanced response structure
    const response = {
      status: healthResult.healthy ? "healthy" : "unhealthy", 
      timestamp: healthResult.timestamp,
      version: healthResult.version,
      environment: healthResult.environment,
      uptime: process.uptime(),
      latency_ms: healthResult.latency,
      services: {
        application: {
          status: "healthy",
          node_version: process.version,
          next_version: "15.5.2",
          typescript_version: "5+",
        },
        environment: {
          status: healthResult.details.environment.configured ? "healthy" : "unhealthy",
          variables_configured: healthResult.details.environment.variables,
          variables_missing: healthResult.details.environment.missing,
          total_required: healthResult.details.environment.variables.length + healthResult.details.environment.missing.length,
        },
        database: {
          status: healthResult.details.database.connected ? "healthy" : "unhealthy",
          connection_test: healthResult.details.database.connected ? "passed" : "failed",
          ...(healthResult.details.database.error && {
            error: healthResult.details.database.error,
          }),
          supabase_integration: "active",
          type_generation: "complete",
        },
        features: healthResult.features,
      },
      ...(!healthResult.healthy && {
        error_details: {
          database_error: healthResult.details.database.error,
          missing_env_vars: healthResult.details.environment.missing,
        },
      }),
    };
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    // Fallback error response
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
        services: {
          application: {
            status: "unhealthy",
            error: "Health check system failure",
          },
          database: {
            status: "unknown",
            error: "Could not perform connectivity test",
          },
        },
      },
      { status: 503 }
    );
  }
}

/**
 * Health check endpoint also supports HEAD requests for quick status checks
 * Uses comprehensive health check but returns only status code
 */
export async function HEAD() {
  try {
    const healthResult = await checkComprehensiveHealth();
    const statusCode = healthResult.healthy ? 200 : 503;
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'X-Health-Status': healthResult.healthy ? 'healthy' : 'unhealthy',
        'X-Database-Status': healthResult.details.database.connected ? 'connected' : 'disconnected',
        'X-Timestamp': healthResult.timestamp,
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
