'use client';

import { UploadCloud, Sparkles, PlusCircle, Trash2, Command } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GuestCreditIndicator } from '@/components/guest-credit-indicator';

interface DashboardHeaderActionsProps {
  onOpenUpload: () => void;
  onRunAutoInsights: () => void;
  onOpenVisualize: () => void;
  onOpenCommandPalette: () => void;
  onClearVisualizations: () => void;
  disableAutoInsights: boolean;
  disableClear: boolean;
  showGuestIndicator: boolean;
}

export function DashboardHeaderActions({
  onOpenUpload,
  onRunAutoInsights,
  onOpenVisualize,
  onOpenCommandPalette,
  onClearVisualizations,
  disableAutoInsights,
  disableClear,
  showGuestIndicator,
}: DashboardHeaderActionsProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onOpenUpload}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Data
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open the Data tab (Shift+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onRunAutoInsights} disabled={disableAutoInsights}>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Auto Insights
              </Button>
            </TooltipTrigger>
            <TooltipContent>Analyse the active dataset (Shift+A)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={onOpenVisualize}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Visualization
              </Button>
            </TooltipTrigger>
            <TooltipContent>Jump to the Visualize tab (Shift+V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onOpenCommandPalette}>
                <Command className="mr-2 h-4 w-4" />
                Command Menu
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open the command palette (Ctrl/Cmd+K)</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearVisualizations}
                disabled={disableClear}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Visuals
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove all generated charts (Shift+C)</TooltipContent>
          </Tooltip>

          {showGuestIndicator && (
            <GuestCreditIndicator variant="minimal" showUpgrade={false} className="hidden sm:flex" />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
