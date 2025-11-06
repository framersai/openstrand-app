'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  collapsedHeight?: string;
  className?: string;
  onPin?: () => void;
  onClose?: () => void;
  isPinned?: boolean;
  badge?: ReactNode;
  preview?: ReactNode; // What to show when collapsed
}

export function CollapsiblePanel({
  title,
  icon,
  children,
  defaultCollapsed = false,
  collapsedHeight = '48px',
  className,
  onPin,
  onClose,
  isPinned = false,
  badge,
  preview
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/50 bg-background/80 backdrop-blur transition-all duration-300',
        isMaximized && 'fixed inset-4 z-50 border-2 border-primary/50',
        isCollapsed && 'hover:shadow-md',
        className
      )}
      style={{
        height: isCollapsed && !isMaximized ? collapsedHeight : undefined,
      }}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 border-b border-border/30',
          isCollapsed && 'border-b-0 cursor-pointer hover:bg-muted/30',
        )}
        onClick={() => isCollapsed && setIsCollapsed(false)}
      >
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <h3 className="text-sm font-semibold">{title}</h3>
          {badge}
        </div>

        <div className="flex items-center gap-1">
          {onPin && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
            >
              <Pin className={cn('h-3 w-3', isPinned && 'text-primary')} />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(!isMaximized);
            }}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed ? (
        <div className={cn('p-4', isMaximized && 'overflow-auto max-h-[calc(100vh-8rem)]')}>
          {children}
        </div>
      ) : (
        preview && (
          <div className="px-4 py-1 text-xs text-muted-foreground truncate">
            {preview}
          </div>
        )
      )}
    </div>
  );
}