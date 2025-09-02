import type { defaultLocale } from "@/i18n/config";

export type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export type LocalePageProps = {
  params: { locale: string };
};

export type TranslationKey = keyof IntlMessages;

export type LocaleMessages = {
  [K in keyof IntlMessages]: IntlMessages[K];
};

// Utility type for nested translation keys (simplified to avoid circular reference)
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType]: ObjectType[Key] extends object ? Key : Key;
}[keyof ObjectType] &
  string;

// Type for translation function parameters
export type TranslationValues = Record<
  string,
  string | number | boolean | null | undefined
>;

// Type for locale-specific formatting options
export type LocaleFormatOptions = {
  locale: typeof defaultLocale | "vi";
  timeZone: string;
  currency: "USD" | "VND";
};
