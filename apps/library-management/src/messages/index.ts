import en from './en.json';
import vi from './vi.json';

export const messages = {
  en,
  vi,
} as const;

export type Messages = typeof en;
export type Locale = keyof typeof messages;

// Type-safe translation keys
export type TranslationKey = keyof Messages;

// Utility function to get all translation keys (for validation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTranslationKeys(messages: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(messages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllTranslationKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Validation function to ensure message consistency between locales
export function validateMessageConsistency(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const enKeys = getAllTranslationKeys(en);
  const viKeys = getAllTranslationKeys(vi);
  
  // Check for missing keys in Vietnamese
  const missingInVi = enKeys.filter(key => !viKeys.includes(key));
  if (missingInVi.length > 0) {
    errors.push(`Missing keys in Vietnamese: ${missingInVi.join(', ')}`);
  }
  
  // Check for extra keys in Vietnamese
  const extraInVi = viKeys.filter(key => !enKeys.includes(key));
  if (extraInVi.length > 0) {
    errors.push(`Extra keys in Vietnamese: ${extraInVi.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default messages;