'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Sparkles,
  LineChart,
  Command,
  Settings,
  X,
  ChevronUp,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Layout,
  Keyboard,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FloatingAction {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

interface FloatingActionToolbarProps {
  actions: FloatingAction[];
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left';
  style?: 'radial' | 'linear' | 'grid';
}

export function FloatingActionToolbar({
  actions,
  position = 'bottom-right',
  style = 'radial'
}: FloatingActionToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Cmd/Ctrl + Space
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }

      // Handle action shortcuts when open
      if (isOpen) {
        actions.forEach(action => {
          if (action.shortcut && e.key === action.shortcut && !action.disabled) {
            e.preventDefault();
            action.onClick();
            setIsOpen(false);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actions]);

  const positionClasses: Record<NonNullable<FloatingActionToolbarProps['position']>, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-28 right-6',
    'top-center': 'top-28 left-1/2 -translate-x-1/2',
    'top-left': 'top-28 left-6',
  };

  const isTopPosition = position.startsWith('top');

  const renderRadialMenu = () => {
    const steps = Math.max(actions.length - 1, 1);
    const angleStep = 180 / steps; // Semi-circle spread
    return (
      <>
        {actions.map((action, index) => {
          const angle = isTopPosition
            ? 90 + angleStep * index // spread downward from the main button
            : -90 - angleStep * index; // spread upward when anchored to bottom
          const radius = 80;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={action.variant === 'danger' ? 'destructive' : 'default'}
                  className={cn(
                    'absolute h-10 w-10 transition-all duration-300',
                    isOpen
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-0 pointer-events-none'
                  )}
                  style={{
                    transform: isOpen
                      ? `translate(${x}px, ${y}px)`
                      : 'translate(0, 0)',
                    transitionDelay: isOpen ? `${index * 30}ms` : '0ms'
                  }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  disabled={action.disabled}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isTopPosition ? 'bottom' : 'top'}>
                <div>
                  {action.label}
                  {action.shortcut && (
                    <span className="ml-2 text-xs opacity-60">({action.shortcut})</span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </>
    );
  };

  const renderLinearMenu = () => {
    return (
      <div
        className={cn(
          'absolute flex flex-col gap-2 transition-all duration-300',
          isTopPosition ? 'top-16' : 'bottom-14',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          position === 'bottom-right' && 'right-0',
          position === 'top-right' && 'right-0',
          position === 'bottom-center' && 'left-1/2 -translate-x-1/2',
          position === 'top-center' && 'left-1/2 -translate-x-1/2',
          position === 'bottom-left' && 'left-0',
          position === 'top-left' && 'left-0'
        )}
      >
        {actions.map((action, index) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                size={isCompact ? 'icon' : 'default'}
                variant={action.variant === 'danger' ? 'destructive' : 'default'}
                className={cn(
                  'transition-all duration-300',
                  isOpen
                    ? 'translate-y-0 opacity-100'
                    : isTopPosition
                      ? '-translate-y-2 opacity-0'
                      : 'translate-y-2 opacity-0',
                  isCompact ? 'w-10' : 'justify-start'
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
              >
                <action.icon className={cn('h-4 w-4', !isCompact && 'mr-2')} />
                {!isCompact && action.label}
              </Button>
            </TooltipTrigger>
            {isCompact && (
              <TooltipContent side="left">
                <div>
                  {action.label}
                  {action.shortcut && (
                    <span className="ml-2 text-xs opacity-60">({action.shortcut})</span>
                  )}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    );
  };

  const renderGridMenu = () => {
    return (
      <div
        className={cn(
          'absolute grid grid-cols-3 gap-2 p-3 rounded-lg border bg-background/95 backdrop-blur shadow-lg transition-all duration-300',
          isTopPosition ? 'top-16' : 'bottom-14',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
          position === 'bottom-right' && 'right-0',
          position === 'top-right' && 'right-0',
          position === 'bottom-center' && 'left-1/2 -translate-x-1/2',
          position === 'top-center' && 'left-1/2 -translate-x-1/2',
          position === 'bottom-left' && 'left-0',
          position === 'top-left' && 'left-0'
        )}
      >
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={action.variant === 'danger' ? 'destructive' : 'ghost'}
                className="h-12 w-12"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                {action.label}
                {action.shortcut && (
                  <span className="ml-2 text-xs opacity-60">({action.shortcut})</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Action menu based on style */}
      {style === 'radial' && renderRadialMenu()}
      {style === 'linear' && renderLinearMenu()}
      {style === 'grid' && renderGridMenu()}

      {/* Main FAB */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={cn(
              'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              isOpen && 'rotate-45 scale-110'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div>Quick Actions (⌘ Space)</div>
        </TooltipContent>
      </Tooltip>

      {/* Compact mode toggle for linear */}
      {style === 'linear' && isOpen && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -top-12 right-0 h-8 w-8"
          onClick={() => setIsCompact(!isCompact)}
        >
          {isCompact ? <ChevronUp className="h-3 w-3" /> : <ChevronUp className="h-3 w-3 rotate-180" />}
        </Button>
      )}
    </div>
  );
}

// Default action presets
export const defaultDashboardActions: FloatingAction[] = [
  {
    id: 'upload',
    icon: Upload,
    label: 'Upload Dataset',
    onClick: () => {},
    shortcut: 'u'
  },
  {
    id: 'visualize',
    icon: LineChart,
    label: 'New Visualization',
    onClick: () => {},
    shortcut: 'v'
  },
  {
    id: 'insights',
    icon: Sparkles,
    label: 'Auto Insights',
    onClick: () => {},
    shortcut: 'i'
  },
  {
    id: 'command',
    icon: Command,
    label: 'Command Palette',
    onClick: () => {},
    shortcut: 'k'
  },
  {
    id: 'layout',
    icon: Layout,
    label: 'Change Layout',
    onClick: () => {},
    shortcut: 'l'
  },
  {
    id: 'clear',
    icon: Trash2,
    label: 'Clear All',
    onClick: () => {},
    shortcut: 'c',
    variant: 'danger'
  }
];