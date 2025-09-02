import { type Locale, locales, defaultLocale } from "@/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

/**
 * Get locale from client-side cookies
 */
export function getClientLocale(): Locale {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const cookies = document.cookie.split(";");
  const localeCookie = cookies
    .find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  return defaultLocale;
}

/**
 * Set locale in client-side cookies
 */
export function setClientLocale(locale: Locale): void {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1 year

  document.cookie = [
    `${COOKIE_NAME}=${locale}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    "SameSite=Strict",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Validate locale parameter
 */
export function validateLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
