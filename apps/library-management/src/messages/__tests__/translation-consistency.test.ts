/* eslint-disable @typescript-eslint/no-explicit-any */
// Using globals available in test environment
// import { describe, it, expect } from '@jest/globals';
import { getAllTranslationKeys, validateMessageConsistency } from '../index';
import en from '../en.json';
import vi from '../vi.json';

describe('Translation consistency', () => {
  it('should have matching keys in all locales', () => {
    const enKeys = getAllTranslationKeys(en as any);
    const viKeys = getAllTranslationKeys(vi as any);
    
    expect(viKeys).toEqual(enKeys);
  });

  it('should validate message consistency', () => {
    const validation = validateMessageConsistency();
    
    if (!validation.isValid) {
      console.log('Translation consistency errors:', validation.errors);
    }
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should have all required top-level sections', () => {
    const requiredSections = [
      'navigation',
      'dashboard',
      'books',
      'members',
      'circulation',
      'auth',
      'common',
      'errors',
      'validation',
      'settings',
      'messages'
    ];

    requiredSections.forEach(section => {
      expect(en).toHaveProperty(section);
      expect(vi).toHaveProperty(section);
    });
  });

  it('should have consistent structure in nested objects', () => {
    const checkStructure = (enObj: Record<string, any>, viObj: Record<string, any>, path = '') => {
      const enKeys = Object.keys(enObj);
      const viKeys = Object.keys(viObj);
      
      expect(viKeys.sort()).toEqual(enKeys.sort());
      
      enKeys.forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof enObj[key] === 'object' && enObj[key] !== null) {
          expect(typeof viObj[key]).toBe('object');
          expect(viObj[key]).not.toBeNull();
          checkStructure(enObj[key], viObj[key], currentPath);
        } else {
          expect(typeof viObj[key]).toBe('string');
          expect(viObj[key]).toBeTruthy();
        }
      });
    };

    checkStructure(en as any, vi as any);
  });

  it('should have translations for interpolated values', () => {
    const enKeys = getAllTranslationKeys(en as any);
    const interpolatedKeys = enKeys.filter(key => {
      const value = getValueByPath(en as any, key);
      return typeof value === 'string' && value.includes('{');
    });

    interpolatedKeys.forEach(key => {
      const enValue = getValueByPath(en as any, key) as string;
      const viValue = getValueByPath(vi as any, key) as string;
      
      // Extract interpolation variables from English
      const enVars = (enValue.match(/\{[^}]+\}/g) || []).map(v => v.slice(1, -1));
      const viVars = (viValue.match(/\{[^}]+\}/g) || []).map(v => v.slice(1, -1));
      
      expect(viVars.sort()).toEqual(enVars.sort());
    });
  });
});

// Helper function to get value by dot notation path
function getValueByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}