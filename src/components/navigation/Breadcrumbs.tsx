'use client';

/**
 * Breadcrumb Navigation Component
 * 
 * Provides hierarchical navigation with ARIA support.
 * Helps users understand their location in the site structure.
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Dashboard', href: '/pkms' },
 *     { label: 'Strands', href: '/pkms/strands' },
 *     { label: 'Strand Detail' }  // Current page (no href)
 *   ]}
 * />
 * ```
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** URL to navigate to (omit for current page) */
  href?: string;
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Custom separator (default: ChevronRight) */
  separator?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of items to show before collapsing */
  maxItems?: number;
}

export function Breadcrumbs({
  items,
  showHomeIcon = true,
  separator,
  className,
  maxItems,
}: BreadcrumbsProps) {
  // Collapse breadcrumbs if too many items
  const displayItems = maxItems && items.length > maxItems
    ? [
        items[0],
        { label: '...', href: undefined, isCollapsed: true },
        ...items.slice(-(maxItems - 2)),
      ]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;
          const Icon = item.icon;
          const SeparatorIcon = separator || <ChevronRight className="h-4 w-4" />;

          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <span className="mx-2 text-muted-foreground" aria-hidden="true">
                  {SeparatorIcon}
                </span>
              )}

              {/* Breadcrumb item */}
              {isLast ? (
                // Current page (no link)
                <span
                  className="font-medium text-foreground inline-flex items-center gap-1.5"
                  aria-current="page"
                >
                  {isFirst && showHomeIcon && <Home className="h-4 w-4" />}
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : item.href ? (
                // Link to other pages
                <Link
                  href={item.href}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    'inline-flex items-center gap-1.5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm'
                  )}
                >
                  {isFirst && showHomeIcon && <Home className="h-4 w-4" />}
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ) : (
                // Collapsed indicator
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumbs with automatic generation from pathname
 * 
 * @example
 * ```tsx
 * // If pathname is /pkms/strands/123
 * <BreadcrumbsAuto />
 * // Renders: Home > PKMS > Strands > 123
 * ```
 */
export function BreadcrumbsAuto({
  showHomeIcon = true,
  className,
}: Omit<BreadcrumbsProps, 'items'>) {
  // This would need to be implemented based on your routing structure
  // You might use usePathname() from next/navigation
  // and map paths to labels
  
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/pkms' },
        // Add more items based on pathname
      ]}
      showHomeIcon={showHomeIcon}
      className={className}
    />
  );
}

/**
 * Compact breadcrumbs for mobile
 * Shows only current page with back button
 */
export function BreadcrumbsCompact({
  items,
  className,
}: Pick<BreadcrumbsProps, 'items' | 'className'>) {
  const current = items[items.length - 1];
  const previous = items[items.length - 2];

  if (!previous) {
    return (
      <div className={cn('text-sm font-medium text-foreground', className)}>
        {current.label}
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2', className)}>
      <Link
        href={previous.href || '/'}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        {previous.label}
      </Link>
      <span className="text-sm font-medium text-foreground">{current.label}</span>
    </nav>
  );
}

