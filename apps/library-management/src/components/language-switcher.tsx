'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Languages, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Locale, locales } from '@/i18n/config';
import { setClientLocale } from '@/lib/locale-cookie';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps): React.JSX.Element {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isChanging, setIsChanging] = useState(false);

  const languageNames: Record<Locale, string> = {
    en: t('english'),
    vi: t('vietnamese'),
  };

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    setIsChanging(true);
    startTransition(async () => {
      try {
        // Update client-side cookie
        setClientLocale(newLocale);
        
        // Call API to update server-side locale
        const response = await fetch('/api/locale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locale: newLocale }),
        });

        if (!response.ok) {
          throw new Error('Failed to update locale');
        }

        // Force router refresh to apply new locale
        router.refresh();
      } catch (error) {
        console.error('Failed to change language:', error);
        // Revert client cookie on error
        setClientLocale(locale);
      } finally {
        setIsChanging(false);
      }
    });
  };

  const isLoading = isPending || isChanging;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          <span className="ml-2">{languageNames[locale]}</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            disabled={isLoading}
            className={loc === locale ? 'bg-accent' : ''}
          >
            {languageNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}