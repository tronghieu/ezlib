/**
 * Test Configuration Helper
 * Browser-specific configurations and environment detection
 */

// Environment detection
export const isCI = process.env.CI === 'true';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Browser-specific timeout configurations
export const browserTimeouts = {
  chromium: {
    navigation: 10000,
    otp: 25000,
    loadState: 5000,
    element: 8000,
  },
  webkit: {
    navigation: 15000,
    otp: 35000,
    loadState: 8000,
    element: 12000,
  },
  firefox: {
    navigation: 15000,
    otp: 35000,
    loadState: 8000,
    element: 12000,
  },
} as const;

// CI environments need longer timeouts
export const ciTimeoutMultiplier = isCI ? 1.5 : 1;

/**
 * Get browser-specific timeout configuration
 */
export function getTimeouts(browserName: string) {
  const browser = browserName.toLowerCase() as keyof typeof browserTimeouts;
  const config = browserTimeouts[browser] || browserTimeouts.chromium;
  
  // Apply CI multiplier
  return {
    navigation: Math.round(config.navigation * ciTimeoutMultiplier),
    otp: Math.round(config.otp * ciTimeoutMultiplier),
    loadState: Math.round(config.loadState * ciTimeoutMultiplier),
    element: Math.round(config.element * ciTimeoutMultiplier),
  };
}

/**
 * Retry configuration for different operations
 */
export const retryConfig = {
  otp: {
    maxRetries: isCI ? 5 : 3,
    baseDelay: 2000,
    maxDelay: 6000,
  },
  navigation: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 3000,
  },
  element: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
  },
};

/**
 * Helper function for exponential backoff with jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Enhanced wait function with retry logic
 */
export async function waitWithRetry<T>(
  operation: () => Promise<T>,
  config: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    operationName?: string;
  }
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, operationName = 'operation' } = config;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`${operationName} failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
      console.log(`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}

/**
 * Test environment logging
 */
export function logTestEnvironment(browserName: string, testName: string) {
  const timeouts = getTimeouts(browserName);
  console.log(`[Test Config] ${testName} - Browser: ${browserName}, CI: ${isCI}, Timeouts:`, timeouts);
}