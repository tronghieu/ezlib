import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient, checkServerConnection } from "@/lib/supabase/server";

/**
 * Connection health check utilities for Supabase integration
 * Used by health check endpoint and monitoring systems
 */

export interface HealthCheckResult {
  healthy: boolean;
  timestamp: string;
  latency: number;
  details: {
    database: {
      connected: boolean;
      error?: string;
    };
    environment: {
      configured: boolean;
      variables: string[];
      missing: string[];
    };
  };
}

/**
 * Client-side connection health check
 * @returns Promise resolving to health status
 */
export async function checkClientHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  ];
  
  const configured = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return value && value !== '' && !value.includes('placeholder');
  });
  
  const missing = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return !value || value === '' || value.includes('placeholder');
  });
  
  const environmentHealthy = missing.length === 0;
  
  let databaseHealthy = false;
  let databaseError: string | undefined;
  
  try {
    // Simple connection test - try to access a basic table
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("authors")
      .select("count")
      .limit(1);
    
    databaseHealthy = !error;
    if (error) {
      databaseError = error.message;
    }
  } catch (error) {
    databaseHealthy = false;
    databaseError = error instanceof Error ? error.message : "Unknown database error";
  }
  
  const latency = Date.now() - startTime;
  const healthy = environmentHealthy && databaseHealthy;
  
  return {
    healthy,
    timestamp,
    latency,
    details: {
      database: {
        connected: databaseHealthy,
        error: databaseError,
      },
      environment: {
        configured: environmentHealthy,
        variables: configured,
        missing,
      },
    },
  };
}

/**
 * Server-side connection health check
 * @returns Promise resolving to health status
 */
export async function checkServerHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Check environment variables (server-side)
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const configured = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return value && value !== '' && !value.includes('placeholder');
  });
  
  const missing = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return !value || value === '' || value.includes('placeholder');
  });
  
  const environmentHealthy = missing.length === 0;
  
  let databaseHealthy = false;
  let databaseError: string | undefined;
  
  try {
    // Create server client and test connection
    const client = await createServerClient();
    const result = await checkServerConnection(client);
    
    databaseHealthy = result.healthy;
    databaseError = result.error;
  } catch (error) {
    databaseHealthy = false;
    databaseError = error instanceof Error ? error.message : "Unknown server database error";
  }
  
  const latency = Date.now() - startTime;
  const healthy = environmentHealthy && databaseHealthy;
  
  return {
    healthy,
    timestamp,
    latency,
    details: {
      database: {
        connected: databaseHealthy,
        error: databaseError,
      },
      environment: {
        configured: environmentHealthy,
        variables: configured,
        missing,
      },
    },
  };
}

/**
 * Comprehensive health check that includes additional system information
 * @returns Extended health status with version and environment info
 */
export async function checkComprehensiveHealth(): Promise<HealthCheckResult & {
  version: string;
  environment: string;
  features: Record<string, boolean>;
}> {
  const baseHealth = await checkServerHealth();
  
  return {
    ...baseHealth,
    version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    environment: process.env.NODE_ENV || "unknown",
    features: {
      dueDates: process.env.NEXT_PUBLIC_ENABLE_DUE_DATES === "true",
      fines: process.env.NEXT_PUBLIC_ENABLE_FINES === "true", 
      holds: process.env.NEXT_PUBLIC_ENABLE_HOLDS === "true",
      advancedSearch: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH === "true",
    },
  };
}