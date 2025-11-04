/**
 * @module components/language-badge
 * @description Language badge component for displaying dataset/visualization language
 */

'use client';

import * as React from 'react';
import { Globe, Languages } from 'lucide-react';
import { languageMetadata, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LanguageBadgeProps {
  language: string;
  variant?: 'default' | 'compact' | 'minimal' | 'full';
  showFlag?: boolean;
  showLabel?: boolean;
  isInternational?: boolean;
  isTranslated?: boolean;
  availableLanguages?: string[];
  className?: string;
}

export function LanguageBadge({
  language,
  variant = 'default',
  showFlag = true,
  showLabel = true,
  isInternational = false,
  isTranslated = false,
  availableLanguages = [],
  className,
}: LanguageBadgeProps) {
  // Don't show badge for English/International content in minimal mode
  if (variant === 'minimal' && (language === 'en' || isInternational)) {
    return null;
  }

  const langData = languageMetadata[language as Locale];

  if (!langData && !isInternational) {
    // Unknown language
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
        'bg-muted text-muted-foreground',
        className
      )}>
        <Globe className="h-3 w-3" />
        <span>{language.toUpperCase()}</span>
      </span>
    );
  }

  // International/English badge
  if (isInternational || language === 'en') {
    if (variant === 'compact' || variant === 'minimal') {
      return (
        <span className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          className
        )}>
          <Globe className="h-3 w-3" />
          {showLabel && <span>INT</span>}
        </span>
      );
    }
    return null; // Don't show badge for English in default/full modes
  }

  // Compact badge (flag + code)
  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
        'bg-secondary/20 text-secondary-foreground',
        langData.direction === 'rtl' && 'flex-row-reverse',
        className
      )}>
        {showFlag && <span className="text-sm">{langData.flag}</span>}
        {showLabel && <span>{language.toUpperCase().split('-')[0]}</span>}
        {isTranslated && <span className="text-[10px]">✓</span>}
      </span>
    );
  }

  // Minimal badge (just code)
  if (variant === 'minimal') {
    return (
      <span className={cn(
        'inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium',
        'bg-muted text-muted-foreground',
        className
      )}>
        {language.toUpperCase().split('-')[0]}
      </span>
    );
  }

  // Full badge with tooltip
  if (variant === 'full') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'inline-flex items-center gap-2 px-2.5 py-1 rounded-md',
              'bg-secondary/10 text-secondary-foreground border border-border',
              langData.direction === 'rtl' && 'flex-row-reverse',
              className
            )}>
              {showFlag && <span className="text-base">{langData.flag}</span>}
              <div className="flex flex-col">
                <span className="text-xs font-medium">{langData.nativeName}</span>
                {availableLanguages.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{availableLanguages.length} translations
                  </span>
                )}
              </div>
              {isTranslated && (
                <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                  Translated
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{langData.name}</p>
              {availableLanguages.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available in: {availableLanguages.join(', ')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default badge
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
      'bg-secondary/20 text-secondary-foreground',
      langData.direction === 'rtl' && 'flex-row-reverse',
      className
    )}>
      {showFlag && <span className="text-sm">{langData.flag}</span>}
      {showLabel && (
        <span className="font-medium">{langData.nativeName}</span>
      )}
      {isTranslated && (
        <Languages className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  );
}

// Multi-language badge for datasets with multiple translations
interface MultiLanguageBadgeProps {
  languages: string[];
  primaryLanguage: string;
  maxDisplay?: number;
  className?: string;
}

export function MultiLanguageBadge({
  languages,
  primaryLanguage,
  maxDisplay = 3,
  className,
}: MultiLanguageBadgeProps) {
  const displayLanguages = languages.slice(0, maxDisplay);
  const remainingCount = languages.length - maxDisplay;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center gap-0.5',
            className
          )}>
            {displayLanguages.map((lang, index) => {
              const langData = languageMetadata[lang as Locale];
              if (!langData) return null;

              return (
                <span
                  key={lang}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'w-6 h-6 rounded-full text-xs',
                    'bg-background border border-border',
                    index > 0 && '-ml-2',
                    lang === primaryLanguage && 'ring-2 ring-primary ring-offset-1'
                  )}
                  style={{ zIndex: displayLanguages.length - index }}
                >
                  {langData.flag}
                </span>
              );
            })}
            {remainingCount > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center',
                'w-6 h-6 rounded-full text-[10px] font-medium',
                'bg-muted text-muted-foreground border border-border',
                '-ml-2'
              )}>
                +{remainingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-xs font-medium">Available languages:</p>
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {languages.map(lang => {
                const langData = languageMetadata[lang as Locale];
                return (
                  <span
                    key={lang}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5',
                      'rounded text-xs bg-secondary/20',
                      lang === primaryLanguage && 'font-medium bg-primary/20'
                    )}
                  >
                    {langData?.flag} {lang.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Language filter pills for catalog browsing
interface LanguageFilterProps {
  selectedLanguages: string[];
  onLanguageToggle: (language: string) => void;
  availableLanguages: string[];
  showInternational?: boolean;
  className?: string;
}

export function LanguageFilter({
  selectedLanguages,
  onLanguageToggle,
  availableLanguages,
  showInternational = true,
  className,
}: LanguageFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {showInternational && (
        <button
          onClick={() => onLanguageToggle('en')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'text-xs font-medium transition-colors',
            selectedLanguages.includes('en')
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30'
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          International
        </button>
      )}

      {availableLanguages.map(lang => {
        const langData = languageMetadata[lang as Locale];
        if (!langData || lang === 'en') return null;

        return (
          <button
            key={lang}
            onClick={() => onLanguageToggle(lang)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-xs font-medium transition-colors',
              selectedLanguages.includes(lang)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30'
            )}
          >
            <span>{langData.flag}</span>
            <span>{langData.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}

// Export convenience function for getting badge props
export function getLanguageBadgeProps(
  language: string,
  options: {
    isDataset?: boolean;
    isVisualization?: boolean;
    translations?: string[];
  } = {}
): LanguageBadgeProps {
  const { isDataset, translations = [] } = options;

  // English/International content
  if (language === 'en') {
    return {
      language: 'en',
      variant: 'minimal',
      isInternational: true,
    };
  }

  // Dataset with translations
  if (isDataset && translations.length > 0) {
    return {
      language,
      variant: 'compact',
      showFlag: true,
      showLabel: true,
      isTranslated: true,
      availableLanguages: translations,
    };
  }

  // Default badge
  return {
    language,
    variant: 'compact',
    showFlag: true,
    showLabel: true,
  };
}