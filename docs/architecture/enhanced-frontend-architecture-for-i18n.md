# Enhanced Frontend Architecture for i18n

EzLib's frontend architecture supports comprehensive internationalization with React-Intl, Next.js i18n routing, and cultural formatting across both Reader and Library Management applications.

## Preference-Based React-Intl Integration

```typescript
// lib/i18n/LanguagePreferenceManager.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import Cookies from 'js-cookie';

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: string[];
  changeLanguage: (locale: string, persist?: boolean) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface Props {
  children: ReactNode;
  initialLanguage?: string;
}

export function LanguageProvider({ children, initialLanguage }: Props) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLanguage || 'en');
  const [messages, setMessages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const availableLanguages = ['en', 'es', 'vi', 'fr', 'de']; // Add Vietnamese support
  
  // Language priority resolution (no router needed!)
  const resolveLanguagePreference = (): string => {
    // 1. Check if user is authenticated and has saved preference
    const savedUserLanguage = getUserLanguageFromAccount(); // From Supabase
    if (savedUserLanguage) return savedUserLanguage;
    
    // 2. Check cookie preference
    const cookieLanguage = Cookies.get('ezlib_lang');
    if (cookieLanguage && availableLanguages.includes(cookieLanguage)) {
      return cookieLanguage;
    }
    
    // 3. Check browser language
    if (typeof navigator !== 'undefined') {
      const browserLanguage = navigator.language.split('-')[0]; // 'en-US' -> 'en'
      if (availableLanguages.includes(browserLanguage)) {
        return browserLanguage;
      }
    }
    
    // 4. Default to English
    return 'en';
  };
  
  const loadMessages = async (locale: string) => {
    setIsLoading(true);
    
    try {
      // Load messages dynamically based on locale
      const [common, reader, library] = await Promise.all([
        import(`../../locales/${locale}/common.json`),
        import(`../../locales/${locale}/reader.json`),  
        import(`../../locales/${locale}/library.json`)
      ]);
      
      setMessages({
        ...common.default,
        ...reader.default,
        ...library.default
      });
    } catch (error) {
      console.warn(`Failed to load messages for ${locale}, using English fallback`);
      
      // Fallback to English
      const [common, reader, library] = await Promise.all([
        import(`../../locales/en/common.json`),
        import(`../../locales/en/reader.json`),
        import(`../../locales/en/library.json`)
      ]);
      
      setMessages({
        ...common.default,
        ...reader.default,
        ...library.default
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const changeLanguage = async (locale: string, persist: boolean = true) => {
    if (!availableLanguages.includes(locale)) return;
    
    setCurrentLanguage(locale);
    await loadMessages(locale);
    
    if (persist) {
      // Save to cookie (for anonymous users)
      Cookies.set('ezlib_lang', locale, { expires: 365 });
      
      // Save to user account (for authenticated users)
      const user = await getCurrentUser(); // Your auth function
      if (user) {
        await updateUserLanguagePreference(user.id, locale);
      }
    }
  };
  
  // Initialize on mount
  useEffect(() => {
    const preferredLanguage = resolveLanguagePreference();
    if (preferredLanguage !== currentLanguage) {
      setCurrentLanguage(preferredLanguage);
    }
    loadMessages(preferredLanguage);
  }, []);
  
  // Show loading state during translation load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading interface...</div>
      </div>
    );
  }
  
  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        availableLanguages, 
        changeLanguage, 
        isLoading 
      }}
    >
      <ReactIntlProvider
        locale={currentLanguage}
        messages={messages}
        onError={(err) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('React-Intl Error:', err);
          }
        }}
      >
        {children}
      </ReactIntlProvider>
    </LanguageContext.Provider>
  );
}

// Custom hook for language management
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Helper functions
async function getUserLanguageFromAccount(): Promise<string | null> {
  // Implementation depends on your auth system
  const user = await getCurrentUser();
  return user?.preferred_language || null;
}

async function updateUserLanguagePreference(userId: string, language: string) {
  // Update user preferences in Supabase
  const supabase = createClientComponentClient();
  await supabase
    .from('users')
    .update({ 
      'preferences.preferred_language': language,
      'preferences.language_source': 'user_selected',
      'preferences.language_changed_at': new Date().toISOString()
    })
    .eq('id', userId);
}
```

## Cultural Formatting Components

```typescript
// components/i18n/CulturalText.tsx
import { useIntl } from 'react-intl';
import { useCulturalFormatter } from '@/hooks/useCulturalFormatter';

interface Props {
  date?: Date;
  number?: number;
  currency?: { amount: number; code: string };
  children?: React.ReactNode;
}

export function CulturalText({ date, number, currency, children }: Props) {
  const intl = useIntl();
  const formatter = useCulturalFormatter();
  
  if (date) {
    return <span>{formatter.formatDate(date)}</span>;
  }
  
  if (number !== undefined) {
    return <span>{formatter.formatNumber(number)}</span>;
  }
  
  if (currency) {
    return (
      <span>
        {formatter.formatNumber(currency.amount, 'currency')}
      </span>
    );
  }
  
  return <>{children}</>;
}

// components/i18n/TranslatedMessage.tsx
import { FormattedMessage } from 'react-intl';

interface Props {
  id: string;
  values?: Record<string, any>;
  defaultMessage?: string;
}

export function T({ id, values, defaultMessage }: Props) {
  return (
    <FormattedMessage
      id={id}
      values={values}
      defaultMessage={defaultMessage}
    />
  );
}

// Usage examples:
// <T id="common.welcome" values={{ name: user.display_name }} />
// <CulturalText date={book.due_date} />
// <CulturalText currency={{ amount: 25.99, code: 'USD' }} />
```

## Language Switcher Components (No Routing)

```typescript
// components/i18n/LanguageSwitcher.tsx - No routing involved!
import { useLanguage } from '@/lib/i18n/LanguagePreferenceManager';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export function LanguageSwitcher() {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading } = useLanguage();
  
  // No router.push needed! Language changes instantly
  const switchLanguage = async (newLocale: string) => {
    await changeLanguage(newLocale, true); // Persist to cookie + user account
    // Page content updates automatically through React-Intl context
  };
  
  if (isLoading) {
    return <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />;
  }
  
  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => switchLanguage(e.target.value)}
        className="block appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 text-sm"
        disabled={isLoading}
      >
        {availableLanguages.map((locale) => (
          <option key={locale} value={locale}>
            {getLanguageName(locale)}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  );
}

// Enhanced language switcher with flags
export function LanguageSwitcherWithFlags() {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  
  return (
    <div className="flex items-center space-x-2">
      {availableLanguages.map((locale) => (
        <button
          key={locale}
          onClick={() => changeLanguage(locale)}
          className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
            currentLanguage === locale 
              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span className="mr-1">{getFlagEmoji(locale)}</span>
          {getLanguageCode(locale)}
        </button>
      ))}
    </div>
  );
}

function getLanguageName(locale: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Español', 
    vi: 'Tiếng Việt',  // Vietnamese support added
    fr: 'Français',
    de: 'Deutsch'
  };
  return names[locale] || locale;
}

function getLanguageCode(locale: string): string {
  const codes: Record<string, string> = {
    en: 'EN',
    es: 'ES',
    vi: 'VI',  // Vietnamese support added
    fr: 'FR', 
    de: 'DE'
  };
  return codes[locale] || locale.toUpperCase();
}

function getFlagEmoji(locale: string): string {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    vi: '🇻🇳',  // Vietnamese flag added
    fr: '🇫🇷',
    de: '🇩🇪'
  };
  return flags[locale] || '🌐';
}
```

## Server-Side Language Detection (No Routing)

```typescript
// middleware.ts - Detects language preferences without URL redirects
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We don't redirect based on language preferences!
  // Just detect and pass preferred language to app via headers
  
  const acceptLanguage = request.headers.get('accept-language') || '';
  const cookieLanguage = request.cookies.get('ezlib_lang')?.value;
  
  // Determine preferred language for server-side rendering
  const preferredLanguage = cookieLanguage || 
    extractLanguageFromAcceptHeader(acceptLanguage) || 
    'en';
  
  // Pass language preference to app (no redirect!)
  const response = NextResponse.next();
  response.headers.set('x-preferred-language', preferredLanguage);
  
  return response;
}

function extractLanguageFromAcceptHeader(acceptLanguage: string): string | null {
  const supportedLanguages = ['en', 'es', 'vi', 'fr', 'de'];
  
  // Parse Accept-Language header: "en-US,en;q=0.9,vi;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].split('-')[0].trim())
    .filter(lang => supportedLanguages.includes(lang));
  
  return languages[0] || null;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## App Integration (pages/_app.tsx)

```typescript
// pages/_app.tsx - Clean integration without routing
import type { AppProps } from 'next/app';
import { LanguageProvider } from '@/lib/i18n/LanguagePreferenceManager';
import { ConsentBanner } from '@/components/privacy/ConsentBanner';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider initialLanguage={pageProps.preferredLanguage}>
      <ConsentBanner />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}

// getServerSideProps example for any page
export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  // Get language preference from middleware header
  const preferredLanguage = req.headers['x-preferred-language'] as string || 'en';
  
  return {
    props: {
      preferredLanguage, // Pass to LanguageProvider
      // ... other props
    }
  };
}
```

---

*EzLib Fullstack Architecture Document v1.1 - Generated using the BMAD-METHOD framework*  
*Updated: August 2025 with Internationalization, Authentication, Privacy, and Frontend Architecture*