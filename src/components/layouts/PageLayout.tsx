'use client';

import { ReactNode, useState } from 'react';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { SiteFooter } from '@/components/site-footer';
import { cn } from '@/lib/utils';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  className?: string;
  collapsibleFooter?: boolean;
}

export function PageLayout({ children, hideFooter = false, className, collapsibleFooter = false }: PageLayoutProps) {
  const [footerCollapsed, setFooterCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      <UnifiedHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <main className="flex-1">
        {children}
      </main>

      {!hideFooter && (
        <>
          {collapsibleFooter ? (
            <div className={cn(
              "relative transition-all duration-300 ease-out",
              footerCollapsed ? "h-12" : "h-auto"
              )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFooterCollapsed(!footerCollapsed)}
                className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2 z-10",
                  "flex items-center gap-2 rounded-full",
                  "bg-background/80 backdrop-blur-sm border border-border/50",
                  "hover:bg-background/90 hover:border-border",
                  "transition-all duration-300"
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {footerCollapsed ? 'Show' : 'Hide'} Footer
                </span>
                <ChevronUp 
                  className={cn(
                    "h-3 w-3 transition-transform duration-300",
                    footerCollapsed ? "rotate-180" : ""
                  )}
                />
              </Button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                footerCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
              )}>
                <SiteFooter />
              </div>
              
              {footerCollapsed && (
                <div className="h-12 border-t border-border/50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    © 2024 OpenStrand. All rights reserved.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <SiteFooter />
          )}
        </>
      )}

      {/* Settings Dialog would go here */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <p className="text-muted-foreground mb-4">Settings panel placeholder</p>
            <Button onClick={() => setSettingsOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
