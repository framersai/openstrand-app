/**
 * @module components/language-switcher
 * @description Language switcher component for internationalization
 */

'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { locales, languageMetadata, type Locale } from '@/i18n/config';
import { replaceLocaleInPathname } from '@/lib/i18n/paths';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLocale?: Locale;
  variant?: 'default' | 'compact';
  showFlag?: boolean;
  showName?: boolean;
}

const LanguageGlyph = ({ className }: { className?: string }) => {
  const gradientId = React.useMemo(
    () => `language-gradient-${Math.random().toString(36).slice(2)}`,
    []
  );

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={cn(
        'h-4 w-4 text-slate-700 transition-all duration-500 ease-out group-hover:-translate-y-[1px] group-hover:text-primary',
        className
      )}
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="6" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      <path
        d="M6.5 9.5h9c1.1 0 2 .9 2 2v3.2c0 1.1-.9 2-2 2h-2.4l-3.1 3.8c-.3.4-.8.1-.7-.3l.6-3.5H8.5c-1.1 0-2-.9-2-2V11.5c0-1.1.9-2 2-2Z"
        fill={`url(#${gradientId})`}
        opacity="0.9"
      />
      <path
        d="M17.2 7.8c1.7.6 3.1 1.9 3.9 3.6.6 1.3.8 2.7.6 4.1"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M19.6 7.5 17 12.4l4.7 1.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="12.5" r="1" fill="#ecfeff" />
      <circle cx="14" cy="12.5" r="0.9" fill="#c7d2fe" />
      <path
        d="M9.3 14.8c.6.5 1.5.8 2.4.8 1 0 1.9-.3 2.5-.9"
        stroke="rgba(15,23,42,0.45)"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <circle
        cx="19.5"
        cy="18.5"
        r="2.6"
        className="origin-center stroke-current"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M18.4 17.6 20 19.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M20 17.6 18.4 19.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

export function LanguageSwitcher({
  currentLocale,
  variant = 'default',
  showFlag = true,
  showName = true,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const localeFromContext = useLocale() as Locale;
  const activeLocale = currentLocale ?? localeFromContext;
  const tLanguage = useTranslations('settings.appearance.language');
  const [isChanging, setIsChanging] = React.useState(false);

  const handleLanguageChange = React.useCallback((locale: Locale) => {
    setIsChanging(true);
    const newPathname = replaceLocaleInPathname(pathname, locale);

    // Set cookie for persistence
    document.cookie = `locale=${locale};max-age=${365 * 24 * 60 * 60};path=/;samesite=lax`;

    // Update HTML attributes for RTL support
    const direction = languageMetadata[locale].direction;
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;

    // Navigate to new locale
    router.push(newPathname);

    // Reset changing state after navigation
    setTimeout(() => setIsChanging(false), 500);
  }, [pathname, router]);
  const currentLanguage = languageMetadata[activeLocale];

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'group relative overflow-hidden rounded-full border border-border/60 bg-background/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
              isChanging && 'pointer-events-none opacity-60'
            )}
            aria-label={tLanguage('change')}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <LanguageGlyph className={cn(isChanging ? 'animate-spin' : '')} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {locales.map((locale) => {
            const lang = languageMetadata[locale];
            const isActive = locale === activeLocale;

            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
              >
                <span className="mr-2 text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.nativeName}</span>
                {isActive && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'group relative min-w-[160px] justify-between overflow-hidden border border-border/60 bg-background/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
            isChanging && 'pointer-events-none opacity-60'
          )}
        >
          <span className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {showFlag && <span className="text-lg drop-shadow-sm">{currentLanguage.flag}</span>}
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary/70">
                <LanguageGlyph className={cn('h-3.5 w-3.5')} />
              </div>
            </div>
            {showName && (
              <span className="text-sm">
                {currentLanguage.nativeName}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>{tLanguage('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {locales.map((locale) => {
            const lang = languageMetadata[locale];
            const isActive = locale === activeLocale;

            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
                {lang.direction === 'rtl' && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    RTL
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open('https://github.com/yourusername/yourrepo/tree/main/translations', '_blank')}
          className="text-xs text-muted-foreground"
        >
          Help translate this app →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified language indicator for mobile
export function LanguageIndicator({ locale }: { locale: Locale }) {
  const lang = languageMetadata[locale];

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs">
      <span>{lang.flag}</span>
      <span className="font-medium">{locale.toUpperCase()}</span>
    </div>
  );
}

// Language selector for settings page
export function LanguageSelector({ currentLocale }: { currentLocale?: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const activeLocale = currentLocale ?? locale;
  const tLanguage = useTranslations('settings.appearance.language');
  const [selectedLocale, setSelectedLocale] = React.useState<Locale>(activeLocale);

  const handleSave = () => {
    if (selectedLocale !== activeLocale) {
      const newPathname = replaceLocaleInPathname(pathname, selectedLocale);
      document.cookie = `locale=${selectedLocale};max-age=${365 * 24 * 60 * 60};path=/;samesite=lax`;
      router.push(newPathname);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {locales.map((locale) => {
          const lang = languageMetadata[locale];
          const isSelected = locale === selectedLocale;

          return (
            <button
              key={locale}
              onClick={() => setSelectedLocale(locale)}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-2xl mb-2">{lang.flag}</div>
              <div className="font-medium text-sm">{lang.nativeName}</div>
              <div className="text-xs text-muted-foreground">{lang.name}</div>
              {lang.direction === 'rtl' && (
                <div className="text-xs text-orange-500 mt-1">RTL</div>
              )}
            </button>
          );
        })}
      </div>
      {selectedLocale !== activeLocale && (
        <Button onClick={handleSave} className="w-full">
          {tLanguage('change')}
        </Button>
      )}
    </div>
  );
}
