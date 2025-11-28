'use client';

/**
 * DynamicIcon Component
 * 
 * Renders a preset icon by ID with full accessibility support.
 * Falls back to a default icon if the specified icon is not found.
 * 
 * @module components/icons/DynamicIcon
 */

import { memo } from 'react';
import { Folder, type LucideProps } from 'lucide-react';
import { 
  getPresetIcon, 
  getDefaultLoomIcon, 
  getDefaultWeaveIcon,
  type PresetIcon 
} from '@/lib/icons/preset-icons';
import { cn } from '@/lib/utils';

export interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  /** The preset icon ID to render */
  iconId?: string | null;
  /** Type of entity (affects default icon) */
  entityType?: 'loom' | 'weave' | 'folder' | 'file';
  /** Override the aria-label */
  ariaLabel?: string;
  /** Whether to hide from screen readers (decorative) */
  decorative?: boolean;
}

/**
 * Renders a dynamic icon from the preset icon registry
 * 
 * @example
 * ```tsx
 * // Render a specific icon
 * <DynamicIcon iconId="book" className="h-5 w-5" />
 * 
 * // Render with entity type fallback
 * <DynamicIcon iconId={loom.icon} entityType="loom" />
 * 
 * // Decorative icon (hidden from screen readers)
 * <DynamicIcon iconId="star" decorative />
 * ```
 */
export const DynamicIcon = memo(function DynamicIcon({
  iconId,
  entityType = 'folder',
  ariaLabel,
  decorative = false,
  className,
  ...props
}: DynamicIconProps) {
  // Get the icon from registry or fall back to default
  let presetIcon: PresetIcon | undefined = iconId ? getPresetIcon(iconId) : undefined;
  
  // If not found, use entity-specific default
  if (!presetIcon) {
    switch (entityType) {
      case 'loom':
        presetIcon = getDefaultLoomIcon();
        break;
      case 'weave':
        presetIcon = getDefaultWeaveIcon();
        break;
      default:
        presetIcon = getDefaultLoomIcon();
    }
  }

  const IconComponent = presetIcon?.icon || Folder;
  const label = ariaLabel || presetIcon?.ariaLabel || 'Icon';

  return (
    <IconComponent
      className={cn('shrink-0', className)}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
      role={decorative ? 'presentation' : 'img'}
      {...props}
    />
  );
});

/**
 * Renders a Loom icon with appropriate defaults
 */
export const LoomIcon = memo(function LoomIcon({
  iconId,
  ...props
}: Omit<DynamicIconProps, 'entityType'>) {
  return <DynamicIcon iconId={iconId} entityType="loom" {...props} />;
});

/**
 * Renders a Weave icon with appropriate defaults
 */
export const WeaveIcon = memo(function WeaveIcon({
  iconId,
  ...props
}: Omit<DynamicIconProps, 'entityType'>) {
  return <DynamicIcon iconId={iconId} entityType="weave" {...props} />;
});

export default DynamicIcon;




/**
 * DynamicIcon Component
 * 
 * Renders a preset icon by ID with full accessibility support.
 * Falls back to a default icon if the specified icon is not found.
 * 
 * @module components/icons/DynamicIcon
 */

import { memo } from 'react';
import { Folder, type LucideProps } from 'lucide-react';
import { 
  getPresetIcon, 
  getDefaultLoomIcon, 
  getDefaultWeaveIcon,
  type PresetIcon 
} from '@/lib/icons/preset-icons';
import { cn } from '@/lib/utils';

export interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  /** The preset icon ID to render */
  iconId?: string | null;
  /** Type of entity (affects default icon) */
  entityType?: 'loom' | 'weave' | 'folder' | 'file';
  /** Override the aria-label */
  ariaLabel?: string;
  /** Whether to hide from screen readers (decorative) */
  decorative?: boolean;
}

/**
 * Renders a dynamic icon from the preset icon registry
 * 
 * @example
 * ```tsx
 * // Render a specific icon
 * <DynamicIcon iconId="book" className="h-5 w-5" />
 * 
 * // Render with entity type fallback
 * <DynamicIcon iconId={loom.icon} entityType="loom" />
 * 
 * // Decorative icon (hidden from screen readers)
 * <DynamicIcon iconId="star" decorative />
 * ```
 */
export const DynamicIcon = memo(function DynamicIcon({
  iconId,
  entityType = 'folder',
  ariaLabel,
  decorative = false,
  className,
  ...props
}: DynamicIconProps) {
  // Get the icon from registry or fall back to default
  let presetIcon: PresetIcon | undefined = iconId ? getPresetIcon(iconId) : undefined;
  
  // If not found, use entity-specific default
  if (!presetIcon) {
    switch (entityType) {
      case 'loom':
        presetIcon = getDefaultLoomIcon();
        break;
      case 'weave':
        presetIcon = getDefaultWeaveIcon();
        break;
      default:
        presetIcon = getDefaultLoomIcon();
    }
  }

  const IconComponent = presetIcon?.icon || Folder;
  const label = ariaLabel || presetIcon?.ariaLabel || 'Icon';

  return (
    <IconComponent
      className={cn('shrink-0', className)}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
      role={decorative ? 'presentation' : 'img'}
      {...props}
    />
  );
});

/**
 * Renders a Loom icon with appropriate defaults
 */
export const LoomIcon = memo(function LoomIcon({
  iconId,
  ...props
}: Omit<DynamicIconProps, 'entityType'>) {
  return <DynamicIcon iconId={iconId} entityType="loom" {...props} />;
});

/**
 * Renders a Weave icon with appropriate defaults
 */
export const WeaveIcon = memo(function WeaveIcon({
  iconId,
  ...props
}: Omit<DynamicIconProps, 'entityType'>) {
  return <DynamicIcon iconId={iconId} entityType="weave" {...props} />;
});

export default DynamicIcon;



