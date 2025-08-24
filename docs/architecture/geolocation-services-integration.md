# Geolocation Services Integration

EzLib integrates IP-based geolocation services to provide automatic country detection for internationalization, with GDPR compliance and fallback strategies.

## Geolocation Service Architecture

```typescript
// lib/services/geolocation.ts
export interface LocationDetectionResult {
  country: string;           // ISO 3166-1 Alpha-2
  country_name: string;      // Full country name
  timezone: string;          // IANA timezone
  suggested_language: string; // ISO 639-1
  confidence: number;        // 0-1 confidence score
  service: string;          // Detection service used
}

export interface GeolocationProvider {
  name: string;
  detectLocation(ip: string): Promise<LocationDetectionResult>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): { requests: number; window: string };
}

// Primary service: ipapi.co (GDPR compliant)
export class IpapiGeolocationProvider implements GeolocationProvider {
  name = 'ipapi.co';
  private readonly baseUrl = 'https://ipapi.co';
  
  async detectLocation(ip: string): Promise<LocationDetectionResult> {
    const response = await fetch(`${this.baseUrl}/${ip}/json/`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Location detection failed: ${data.reason}`);
    }
    
    return {
      country: data.country,
      country_name: data.country_name,
      timezone: data.timezone,
      suggested_language: this.mapCountryToLanguage(data.country),
      confidence: data.country ? 0.85 : 0.1,
      service: this.name
    };
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/json/`, { 
        method: 'HEAD',
        timeout: 5000 
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getRateLimit() {
    return { requests: 1000, window: 'day' }; // Free tier limits
  }
  
  private mapCountryToLanguage(countryCode: string): string {
    const mapping: Record<string, string> = {
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
      'FR': 'fr', 'BE': 'fr', 'CH': 'fr',
      'DE': 'de', 'AT': 'de'
    };
    return mapping[countryCode] || 'en';
  }
}
```

## Frontend Location Detection Hook

```typescript
// hooks/useLocationDetection.ts
export function useLocationDetection() {
  const [location, setLocation] = useState<LocationDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const detectLocation = useCallback(async (userConsent: boolean) => {
    if (!userConsent) {
      setError('Location detection requires user consent');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/detect-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: userConsent })
      });
      
      if (!response.ok) {
        throw new Error('Location detection failed');
      }
      
      const result = await response.json();
      setLocation(result);
      
      // Automatically apply suggested settings
      if (result.suggested_language && result.country) {
        await updateUserPreferences({
          preferred_country: result.country,
          preferred_language: result.suggested_language,
          auto_detected_country: result.country
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    location,
    loading,
    error,
    detectLocation
  };
}
```
