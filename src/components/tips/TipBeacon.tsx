'use client';

/**
 * @module TipBeacon
 * @description Interactive "Did you know?" tip system with glassmorphism design
 * 
 * Features:
 * - Dismissible tips anchored to viewport
 * - localStorage persistence per tip ID
 * - "Show again next time" toggle
 * - Context-aware tips (flashcard page, quiz, productivity, etc.)
 * - Smooth animations with theme colors
 * - Auto-dismiss after first view (default) or persist based on user choice
 */

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface TipBeaconProps {
  /** Unique ID for this tip (used for localStorage tracking) */
  tipId: string;
  
  /** Tip title */
  title: string;
  
  /** Tip body content */
  body: string | React.ReactNode;
  
  /** Optional actions (buttons) to display */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /** Auto-dismiss after first view (default: true) */
  defaultHiddenAfterSeen?: boolean;
  
  /** Custom CSS class */
  className?: string;
  
  /** Force show even if dismissed */
  forceShow?: boolean;
}

const STORAGE_KEY_PREFIX = 'openstrand_tip_';

export function TipBeacon({
  tipId,
  title,
  body,
  actions,
  position = 'bottom-right',
  defaultHiddenAfterSeen = true,
  className,
  forceShow = false,
}: TipBeaconProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAgain, setShowAgain] = useState(!defaultHiddenAfterSeen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    // Check localStorage for dismissal state
    const storageKey = `${STORAGE_KEY_PREFIX}${tipId}`;
    const dismissalData = localStorage.getItem(storageKey);

    if (dismissalData) {
      try {
        const { dismissed, showAgainNext } = JSON.parse(dismissalData);
        
        // If dismissed and user said "don't show again", hide
        if (dismissed && !showAgainNext) {
          setIsVisible(false);
          return;
        }
      } catch (error) {
        console.error('Failed to parse tip dismissal data:', error);
      }
    }

    // Show tip after slight delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [tipId, forceShow, defaultHiddenAfterSeen]);

  const handleDismiss = () => {
    const storageKey = `${STORAGE_KEY_PREFIX}${tipId}`;
    
    // Save dismissal preference
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        dismissed: true,
        showAgainNext: showAgain,
        lastDismissed: new Date().toISOString(),
      })
    );

    // Animate out
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 max-w-md transition-all duration-300',
        positionClasses[position],
        isAnimatingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
        className
      )}
    >
      <Card className="border-primary/20 bg-card/95 backdrop-blur-md shadow-2xl">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary shrink-0" />
              <h4 className="font-semibold text-sm">{title}</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss tip"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="text-sm text-muted-foreground">
            {body}
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => {
                    action.onClick();
                    handleDismiss();
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Show Again Toggle */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              id={`tip-${tipId}-show-again`}
              checked={showAgain}
              onCheckedChange={(checked) => setShowAgain(checked as boolean)}
            />
            <label
              htmlFor={`tip-${tipId}-show-again`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Show again next time
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs h-auto py-1"
              onClick={() => {
                // Clear all tip dismissals
                const keys = Object.keys(localStorage).filter(key => 
                  key.startsWith(STORAGE_KEY_PREFIX)
                );
                keys.forEach(key => localStorage.removeItem(key));
                setShowAgain(true);
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset all tips
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to manage tip visibility across the app
 */
export function useTip(tipId: string) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${tipId}`;
    const dismissalData = localStorage.getItem(storageKey);

    if (!dismissalData) {
      setIsVisible(true);
      return;
    }

    try {
      const { dismissed, showAgainNext } = JSON.parse(dismissalData);
      setIsVisible(!dismissed || showAgainNext);
    } catch (error) {
      setIsVisible(true);
    }
  }, [tipId]);

  const dismiss = () => {
    const storageKey = `${STORAGE_KEY_PREFIX}${tipId}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        dismissed: true,
        showAgainNext: false,
        lastDismissed: new Date().toISOString(),
      })
    );
    setIsVisible(false);
  };

  const show = () => {
    setIsVisible(true);
  };

  return { isVisible, dismiss, show };
}


