import { Pathnames } from 'next-intl/routing';

export const defaultLocale = 'en' as const;

export const locales = ['en', 'vi'] as const;

export type Locale = typeof locales[number];

export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
  '/dashboard': '/dashboard',
};

export const localePrefix = 'never' as const;

export const port = process.env.PORT || 3001;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;