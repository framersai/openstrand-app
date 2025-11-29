'use client';

/**
 * @module DynamicIcon
 * @description Dynamic icon renderer with entity-specific fallbacks
 * 
 * Features:
 * - Renders icons from preset registry
 * - Entity-specific fallbacks (Loom, Weave, Strand)
 * - Accessibility support with ARIA labels
 * - Memoized for performance
 */

import { memo, useMemo } from 'react';
import { Folder, FileText, Network, HelpCircle } from 'lucide-react';
import { getPresetIcon, getDefaultLoomIcon, getDefaultWeaveIcon } from '@/lib/icons/preset-icons';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DynamicIconProps {
  /** Icon ID from preset registry */
  iconId?: string | null;
  /** Entity type for fallback icon */
  entityType?: 'loom' | 'weave' | 'strand' | 'folder';
  /** Icon size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional class names */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

// ============================================================================
// Size mappings
// ============================================================================

const SIZE_CLASSES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Dynamic icon component that renders icons from the preset registry
 * with intelligent fallbacks based on entity type.
 */
export const DynamicIcon = memo(function DynamicIcon({
  iconId,
  entityType = 'strand',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: DynamicIconProps) {
  const IconComponent = useMemo(() => {
    // Try to get the specified icon
    if (iconId) {
      const preset = getPresetIcon(iconId);
      if (preset) {
        return preset.icon;
      }
    }

    // Fall back to entity-specific default
    switch (entityType) {
      case 'loom':
        return getDefaultLoomIcon().icon;
      case 'weave':
        return getDefaultWeaveIcon().icon;
      case 'folder':
        return Folder;
      case 'strand':
      default:
        return FileText;
    }
  }, [iconId, entityType]);

  const sizeClass = SIZE_CLASSES[size];

  return (
    <IconComponent
      className={cn(sizeClass, className)}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
});

/**
 * Convenience component for Loom icons
 */
export const LoomIcon = memo(function LoomIcon(
  props: Omit<DynamicIconProps, 'entityType'>
) {
  return <DynamicIcon {...props} entityType="loom" />;
});

/**
 * Convenience component for Weave icons
 */
export const WeaveIcon = memo(function WeaveIcon(
  props: Omit<DynamicIconProps, 'entityType'>
) {
  return <DynamicIcon {...props} entityType="weave" />;
});

export default DynamicIcon;

