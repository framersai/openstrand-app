'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  Inbox,
  Search,
  AlertCircle,
  PackageX,
  Database,
  Users,
  Sparkles,
  Upload,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Preset empty state icons
 */
const PRESET_ICONS: Record<string, LucideIcon> = {
  empty: Inbox,
  search: Search,
  error: AlertCircle,
  notFound: FileQuestion,
  noData: Database,
  noResults: PackageX,
  noUsers: Users,
  noContent: FolderOpen,
};

interface EmptyStateAction {
  /** Action label */
  label: string;
  /** Action handler or href */
  onClick?: () => void;
  href?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Icon to display */
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Preset variant or custom */
  variant?: 'empty' | 'search' | 'error' | 'notFound' | 'noData' | 'noResults' | 'noUsers' | 'noContent' | 'custom';
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action */
  action?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Custom illustration/image */
  illustration?: React.ReactNode;
  /** Compact mode (smaller padding) */
  compact?: boolean;
}

/**
 * EmptyState
 * 
 * A reusable component for displaying empty states with helpful CTAs.
 * Provides consistent UX for when there's no content to display.
 * 
 * Features:
 * - Multiple preset variants for common scenarios
 * - Customizable icon, title, description
 * - Primary and secondary action buttons
 * - Accessible (semantic HTML, ARIA labels)
 * - Dark mode compatible
 * - Responsive design
 * - Optional custom illustrations
 * 
 * Best Practices:
 * - Use clear, action-oriented titles
 * - Provide context in the description
 * - Always include at least one action
 * - Use appropriate variant for the context
 * 
 * @example
 * ```tsx
 * // No search results
 * <EmptyState
 *   variant="search"
 *   title="No results found"
 *   description="Try adjusting your search or filters"
 *   action={{
 *     label: "Clear filters",
 *     onClick: () => clearFilters()
 *   }}
 * />
 * 
 * // No data
 * <EmptyState
 *   variant="noData"
 *   title="No strands yet"
 *   description="Get started by creating your first strand"
 *   action={{
 *     label: "Create strand",
 *     href: "/pkms/strands/new",
 *     icon: Plus
 *   }}
 *   secondaryAction={{
 *     label: "Import data",
 *     onClick: () => openImport()
 *   }}
 * />
 * ```
 */
export function EmptyState({
  variant = 'empty',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  illustration,
  compact = false,
}: EmptyStateProps) {
  // Select icon based on variant or custom icon
  const Icon = icon || (variant !== 'custom' ? PRESET_ICONS[variant] : Inbox);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-12 sm:py-16',
        className
      )}
      role="status"
      aria-label={title}
    >
      <Card className="max-w-md border-dashed">
        <CardContent className={cn(
          'flex flex-col items-center gap-4',
          compact ? 'p-6' : 'p-8'
        )}>
          {/* Custom illustration or icon */}
          {illustration || (
            <div className={cn(
              'flex items-center justify-center rounded-full bg-muted',
              compact ? 'h-16 w-16' : 'h-20 w-20'
            )}>
              <Icon className={cn(
                'text-muted-foreground',
                compact ? 'h-8 w-8' : 'h-10 w-10'
              )} />
            </div>
          )}

          {/* Title and description */}
          <div className="space-y-2">
            <h3 className={cn(
              'font-semibold text-foreground',
              compact ? 'text-base' : 'text-lg'
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                'text-muted-foreground',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2">
              {action && (
                action.href ? (
                  <Button asChild variant={action.variant || 'default'}>
                    <Link href={action.href} className="w-full sm:w-auto">
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={action.onClick}
                    variant={action.variant || 'default'}
                    className="w-full sm:w-auto"
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                )
              )}

              {secondaryAction && (
                secondaryAction.href ? (
                  <Button asChild variant={secondaryAction.variant || 'outline'}>
                    <Link href={secondaryAction.href} className="w-full sm:w-auto">
                      {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
                      {secondaryAction.label}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={secondaryAction.onClick}
                    variant={secondaryAction.variant || 'outline'}
                    className="w-full sm:w-auto"
                  >
                    {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
                    {secondaryAction.label}
                  </Button>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Preset empty state components for common scenarios
 */

export function NoSearchResults({ 
  query, 
  onClear 
}: { 
  query?: string; 
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={query ? `No results for "${query}"` : 'Try adjusting your search or filters'}
      action={onClear ? {
        label: 'Clear search',
        onClick: onClear,
        variant: 'outline',
      } : undefined}
    />
  );
}

export function NoDataYet({ 
  resource,
  onCreate,
  onImport,
}: { 
  resource: string;
  onCreate?: () => void;
  onImport?: () => void;
}) {
  return (
    <EmptyState
      variant="noData"
      title={`No ${resource} yet`}
      description={`Get started by creating your first ${resource.toLowerCase()}`}
      action={onCreate ? {
        label: `Create ${resource.toLowerCase()}`,
        onClick: onCreate,
        icon: Sparkles,
      } : undefined}
      secondaryAction={onImport ? {
        label: 'Import data',
        onClick: onImport,
        icon: Upload,
        variant: 'outline',
      } : undefined}
    />
  );
}

export function ErrorState({ 
  title = 'Something went wrong',
  description = 'Please try again or contact support if the problem persists',
  onRetry,
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try again',
        onClick: onRetry,
      } : undefined}
    />
  );
}

