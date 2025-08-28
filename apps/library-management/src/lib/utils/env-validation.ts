import { z } from "zod";

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present at startup
 */
const envSchema = z.object({
  // Next.js Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0"),

  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Only needed server-side

  // Feature Flags
  NEXT_PUBLIC_ENABLE_DUE_DATES: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_FINES: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_HOLDS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // Development Settings
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DEBUG: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables at application startup
 * Throws an error if required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    if (env.DEBUG) {
      console.log("✅ Environment validation successful");
      console.log("📋 Configuration:", {
        siteUrl: env.NEXT_PUBLIC_SITE_URL,
        version: env.NEXT_PUBLIC_APP_VERSION,
        environment: env.NODE_ENV,
        features: {
          dueDates: env.NEXT_PUBLIC_ENABLE_DUE_DATES,
          fines: env.NEXT_PUBLIC_ENABLE_FINES,
          holds: env.NEXT_PUBLIC_ENABLE_HOLDS,
          advancedSearch: env.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH,
        },
      });
    }

    return env;
  } catch (error) {
    console.error("❌ Environment validation failed");

    if (error instanceof z.ZodError) {
      const missing = error.issues.map((issue) => {
        return `  - ${issue.path.join(".")}: ${issue.message}`;
      });

      console.error("Missing or invalid environment variables:");
      console.error(missing.join("\n"));
      console.error("\n📖 Please check .env.example for required variables");
    }

    throw new Error("Environment validation failed");
  }
}

/**
 * Helper to check if a feature flag is enabled
 */
export function isFeatureEnabled(
  feature: keyof Pick<
    EnvConfig,
    | "NEXT_PUBLIC_ENABLE_DUE_DATES"
    | "NEXT_PUBLIC_ENABLE_FINES"
    | "NEXT_PUBLIC_ENABLE_HOLDS"
    | "NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH"
  >
): boolean {
  const env = validateEnv();
  return env[feature] === true;
}

/**
 * Get the current environment
 */
export function getEnvironment(): "development" | "test" | "production" {
  return (
    (process.env.NODE_ENV as "development" | "test" | "production") ||
    "development"
  );
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}
