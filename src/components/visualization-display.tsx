'use client';

/**
 * @module components/visualization-display
 * @description Component for displaying various visualization types.
 * Now supports three-tier visualization system:
 * - Tier 1: Static charts (Chart.js)
 * - Tier 2: Dynamic visualizations (D3.js, Three.js)
 * - Tier 3: AI-generated custom visualizations
 */

import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { Download, Maximize2, Edit3, Trash2, Copy, Info, FileText, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackButtons } from '@/components/feedback-buttons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toTitleCase, truncate } from '@/lib/utils/format';
import type { Visualization, FeedbackSummary } from '@/types';
import { VisualizationTier } from '@/lib/visualization/types';
import type { AIArtisanResult } from '@/lib/visualization/types';
import { VisualizationDetailsDrawer } from '@/features/dashboard/components/VisualizationDetailsDrawer';

// Lazy load visualization components for better performance
const ChartDisplay = lazy(() => import('@/components/visualizations/tier1/ChartDisplay'));
const TableDisplay = lazy(() => import('@/components/visualizations/tier1/TableDisplay'));
const D3ForceGraph = lazy(() => import('@/components/visualizations/tier2/d3/D3ForceGraph'));
const Three3DScatter = lazy(() => import('@/components/visualizations/tier2/three/Three3DScatter'));
const AIArtisanSandbox = lazy(() => import('@/components/visualizations/tier3/sandbox/AIArtisanSandbox'));
const AIArtisanEditor = lazy(() =>
  import('@/components/visualizations/tier3/editor/AIArtisanEditor').then((module) => ({
    default: module.AIArtisanEditor,
  }))
);
const AIArtisanSecurityNotice = lazy(() =>
  import('@/components/visualizations/tier3/security/AIArtisanSecurityNotice').then((module) => ({
    default: module.AIArtisanSecurityNotice,
  }))
);

const TIER_BADGE_MAP: Record<number, { label: string; className: string }> = {
  [VisualizationTier.Static]: {
    label: 'Static',
    className:
      'border-sky-200/50 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  },
  [VisualizationTier.Dynamic]: {
    label: 'Dynamic',
    className:
      'border-amber-200/50 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  },
  [VisualizationTier.AIArtisan]: {
    label: 'AI Artisan',
    className:
      'border-purple-200/50 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300',
  },
};

interface VisualizationDisplayProps {
  /** Visualization data */
  visualization: Visualization;
  /** Callback for exporting */
  onExport?: () => void;
  /** Callback for removal */
  onRemove?: () => void;
  /** Callback for modification */
  onModify?: (prompt: string) => void;
  /** Whether to show controls */
  showControls?: boolean;
  /** Additional className */
  className?: string;
  /** Disable interactive controls */
  disabled?: boolean;
  /** Visualization feedback summary */
  feedback?: FeedbackSummary | null;
  /** Disable voting/favorite actions */
  feedbackDisabled?: boolean;
  /** Vote handler */
  onFeedbackVote?: (vote: 'up' | 'down' | null) => void;
  /** Favorite handler */
  onFavoriteChange?: (favorite: boolean) => void;
}

/**
 * VisualizationDisplay component for rendering charts and tables
 */
export const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({
  visualization,
  onExport,
  onRemove,
  onModify,
  showControls = true,
  className,
  disabled = false,
  feedback = null,
  feedbackDisabled = false,
  onFeedbackVote,
  onFavoriteChange,
}) => {
  const chartRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [artisanCode, setArtisanCode] = useState<AIArtisanResult['code'] | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const heuristicDebug = visualization.debug?.heuristic;
  const llmDebug = visualization.debug?.llm;
  const generationMode =
    heuristicDebug?.status === 'matched'
      ? 'Heuristic'
      : llmDebug?.usedProvider
        ? `LLM • ${llmDebug.usedProvider}`
        : visualization.provider_used
          ? visualization.provider_used
          : undefined;

  /**
   * Determine the visualization tier based on type and metadata
   */
  const getVisualizationTier = (): VisualizationTier => {
    // Check if it's a AI Artisan visualization
    if (visualization.metadata?.tier === 3 || visualization.metadata?.isAIArtisan || visualization.metadata?.isVibeCode) {
      return VisualizationTier.AIArtisan;
    }

    // Check for Tier 2 dynamic visualizations
    const tier2Types = ['force-graph', 'd3-force', '3d-scatter', 'three-scatter', 'sankey', 'treemap'];
    if (tier2Types.includes(visualization.type) || visualization.metadata?.tier === 2) {
      return VisualizationTier.Dynamic;
    }

    // Default to Tier 1 static charts
    return VisualizationTier.Static;
  };

  const initialArtisanCode = useMemo<AIArtisanResult['code']>(() => {
    const candidate = visualization.metadata?.aiArtisanCode ?? visualization.metadata?.vibeCode;
    if (candidate && typeof candidate === 'object') {
      const maybeCode = candidate as Partial<AIArtisanResult['code']>;
      return {
        html: typeof maybeCode?.html === 'string' ? maybeCode.html : '',
        css: typeof maybeCode?.css === 'string' ? maybeCode.css : '',
        js: typeof maybeCode?.js === 'string' ? maybeCode.js : '',
      };
    }
    return { html: '', css: '', js: '' };
  }, [visualization.metadata]);

  /**
   * Get the appropriate visualization component
   */
  const getVisualizationComponent = () => {
    const tier = getVisualizationTier();

    // Tier 3: AI-generated custom visualizations
    if (tier === VisualizationTier.AIArtisan) {
      const sandboxConfig = (visualization.metadata?.aiArtisanSandbox ?? visualization.metadata?.sandboxConfig) as
        | AIArtisanResult['sandboxConfig']
        | undefined;
      const effectiveCode = artisanCode ?? initialArtisanCode;

      return (
        <div className="space-y-4">
          <AIArtisanSandbox
            code={effectiveCode}
            data={visualization.data}
            sandboxConfig={sandboxConfig}
          />
          <AIArtisanSecurityNotice sandboxConfig={sandboxConfig} />
          {showControls && (
            <AIArtisanEditor
              code={effectiveCode}
              onChange={disabled ? undefined : (next) => setArtisanCode(next)}
              readOnly={disabled}
            />
          )}
        </div>
      );
    }

    // Tier 2: Dynamic visualizations
    if (tier === VisualizationTier.Dynamic) {
      switch (visualization.type) {
        case 'force-graph':
        case 'd3-force':
          return (
            <D3ForceGraph
              nodes={(visualization.data?.nodes as any[]) || []}
              links={(visualization.data?.links as any[]) || []}
              width={800}
              height={600}
            />
          );
        case '3d-scatter':
        case 'three-scatter':
          return (
            <Three3DScatter
              data={
                ((visualization.data?.points as any[]) || []).map((p) => ({
                  x: Number((p && p.x) ?? 0),
                  y: Number((p && p.y) ?? 0),
                  z: Number((p && p.z) ?? 0),
                  ...(typeof p === 'object' ? p : {}),
                }))
              }
              title={visualization.title}
            />
          );
        default:
          // Fallback to Chart.js if unrecognized
          return <ChartDisplay ref={chartRef} visualization={visualization} />;
      }
    }

    // Tier 1: Static charts and tables
    if (visualization.type === 'table') {
      return <TableDisplay visualization={visualization} />;
    }

    return <ChartDisplay ref={chartRef} visualization={visualization} />;
  };

  const tierMetadata = (visualization.metadata ?? {}) as Record<string, any>;
  const resolvedTier =
    typeof tierMetadata.tier === 'number' ? tierMetadata.tier : getVisualizationTier();
  const tierBadge = TIER_BADGE_MAP[resolvedTier] ?? TIER_BADGE_MAP[VisualizationTier.Static];

  useEffect(() => {
    if (resolvedTier === VisualizationTier.AIArtisan) {
      setArtisanCode(initialArtisanCode);
    } else {
      setArtisanCode(null);
    }
  }, [resolvedTier, initialArtisanCode, visualization.id]);

  /**
   * Export chart as image
   */
  const handleExportImage = () => {
    // Only works for Chart.js visualizations (Tier 1)
    if (chartRef.current?.exportAsImage) {
      const url = chartRef.current.exportAsImage();
      if (url) {
        const link = document.createElement('a');
        link.download = `${visualization.title.replace(/\s+/g, '-')}.png`;
        link.href = url;
        link.click();
      }
    }
  };
  
  /**
   * Handle modify submission
   */
  const handleModifySubmit = () => {
    if (disabled || !onModify || !modifyPrompt.trim()) {
      return;
    }
    onModify(modifyPrompt);
    setModifyPrompt('');
    setShowModifyInput(false);
  };

  const toggleFullscreen = () => {
    if (disabled) {
      return;
    }
    setIsFullscreen((prev) => !prev);
  };

  const toggleModifyInput = () => {
    if (disabled) {
      return;
    }
    setShowModifyInput((prev) => !prev);
  };

  const toggleDebug = () => {
    if (disabled) {
      return;
    }
    setShowDebug((prev) => !prev);
  };

  const safeExport = () => {
    if (!disabled) {
      handleExportImage();
    }
  };

  const safeOnExport = () => {
    if (!disabled && onExport) {
      onExport();
    }
  };

  const safeOnRemove = () => {
    if (!disabled && onRemove) {
      onRemove();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      handleModifySubmit();
    }
  };
  
  // Format the title nicely
  const formattedTitle = useMemo(() => {
    if (!visualization.title) return 'Visualization';
    // If it looks like a generated title with underscores or camelCase, format it
    if (visualization.title.includes('_') || /[a-z][A-Z]/.test(visualization.title)) {
      return toTitleCase(visualization.title);
    }
    return visualization.title;
  }, [visualization.title]);

  return (
    <Card className={cn('visualization-card overflow-hidden', isFullscreen && 'fixed inset-4 z-50', className)}>
      <CardHeader className="pb-3 space-y-0">
        {/* Top row: badges and actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tierBadge && (
              <Badge variant="outline" className={cn('h-5 text-[10px] font-medium', tierBadge.className)}>
                {tierBadge.label}
              </Badge>
            )}
            {generationMode && (
              <Badge variant="outline" className="h-5 text-[10px] font-medium text-muted-foreground">
                {generationMode}
              </Badge>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleFullscreen}
                disabled={disabled}
                title="Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={disabled}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={toggleModifyInput}>
                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                    Modify
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Details
                  </DropdownMenuItem>
                  {visualization.type !== 'table' && (
                    <DropdownMenuItem onClick={safeExport}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export Image
                    </DropdownMenuItem>
                  )}
                  {onExport && (
                    <DropdownMenuItem onClick={safeOnExport}>
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Copy Data
                    </DropdownMenuItem>
                  )}
                  {visualization.debug && (
                    <DropdownMenuItem onClick={toggleDebug}>
                      <Info className="h-3.5 w-3.5 mr-2" />
                      {showDebug ? 'Hide Debug' : 'Show Debug'}
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={safeOnRemove}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold leading-tight">
          {formattedTitle}
        </h3>
        
        {/* Description or prompt */}
        {visualization.description ? (
          <p className="text-sm text-muted-foreground mt-1">
            {visualization.description}
          </p>
        ) : visualization.prompt ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            <span className="font-medium">Prompt:</span>{' '}
            <span className="italic">&ldquo;{truncate(visualization.prompt, 120)}&rdquo;</span>
          </p>
        ) : null}
        
        {/* Modify input */}
        {showModifyInput && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Describe how to modify..."
              className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={disabled}
            />
            <Button size="sm" onClick={handleModifySubmit} disabled={disabled}>
              Apply
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className={cn('chart-container', isFullscreen && 'h-[calc(100vh-200px)]')}>
          <Suspense fallback={<VisualizationSkeleton />}>
            {getVisualizationComponent()}
          </Suspense>
        </div>
        
        {/* Cost indicator */}
        {visualization.cost && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Generated: {new Date(visualization.createdAt).toLocaleString()}</span>
            <span>Cost: ${visualization.cost.totalCost.toFixed(4)}</span>
          </div>
        )}

        <div className="mt-3">
          <FeedbackButtons
            summary={feedback}
            disabled={feedbackDisabled || disabled || (!onFeedbackVote && !onFavoriteChange)}
            onVote={onFeedbackVote}
            onFavoriteChange={onFavoriteChange}
            size="sm"
            disabledReason={
              feedbackDisabled ? 'Sign in to vote on visualizations.' : undefined
            }
            layout="row"
          />
        </div>
        
        {showDebug && visualization.debug && (
          <div className="mt-4 space-y-3 rounded-lg border bg-muted/40 p-3 text-xs">
            <div>
              <p className="font-semibold text-sm">Sanitized Prompt</p>
              <p className="font-mono break-words">{visualization.debug.sanitizedPrompt}</p>
            </div>
            
            {heuristicDebug && (
              <div className="space-y-1">
                <p className="font-semibold text-sm">Heuristic Parser</p>
                <p>Status: {heuristicDebug.status ?? (heuristicDebug.attempted ? 'unknown' : 'skipped')}</p>
                {heuristicDebug.reason && <p>Reason: {heuristicDebug.reason}</p>}
                {heuristicDebug.matchedPattern && (
                  <p>
                    Pattern: {heuristicDebug.matchedPattern}
                    {typeof heuristicDebug.confidence !== 'undefined' && (
                      <> (confidence {Math.round((heuristicDebug.confidence ?? 0) * 100)}%)</>
                    )}
                  </p>
                )}
                {heuristicDebug.selectedColumns && heuristicDebug.selectedColumns.length > 0 && (
                  <p>Columns: {heuristicDebug.selectedColumns.join(', ')}</p>
                )}
                {heuristicDebug.tokens && heuristicDebug.tokens.length > 0 && (
                  <p className="break-words">
                    Tokens:{' '}
                    <span className="font-mono">{heuristicDebug.tokens.join(' | ')}</span>
                  </p>
                )}
                {heuristicDebug.patternsEvaluated && heuristicDebug.patternsEvaluated.length > 0 && (
                  <details>
                    <summary className="cursor-pointer">Patterns evaluated</summary>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {heuristicDebug.patternsEvaluated.map((item, index) => (
                        <li key={`${item.pattern}-${index}`}>
                          {item.pattern} — {item.matched ? 'matched' : 'not matched'}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
            
            {llmDebug && (
              <div className="space-y-1">
                <p className="font-semibold text-sm">LLM Orchestration</p>
                {llmDebug.reason && <p>Reason: {llmDebug.reason}</p>}
                {llmDebug.providerOrder && llmDebug.providerOrder.length > 0 && (
                  <p>Provider order: {llmDebug.providerOrder.join(' → ')}</p>
                )}
                {typeof llmDebug.usedProvider !== 'undefined' && (
                  <p>Used provider: {llmDebug.usedProvider ?? 'None'}</p>
                )}
                {llmDebug.attempts && llmDebug.attempts.length > 0 && (
                  <div className="space-y-1">
                    <p>Attempts:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {llmDebug.attempts.map((attempt, index) => (
                        <li key={`${attempt.provider}-${index}`}>
                          <span className="font-medium">{attempt.provider}</span> — {attempt.status || 'unknown'}
                          {attempt.error && <span className="text-destructive"> ({attempt.error})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {llmDebug.userPromptSample && (
                  <details>
                    <summary className="cursor-pointer">User prompt sample</summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-background/70 p-2 font-mono">
                      {llmDebug.userPromptSample}
                    </pre>
                  </details>
                )}
                {llmDebug.systemPromptSample && (
                  <details>
                    <summary className="cursor-pointer">System prompt sample</summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-background/70 p-2 font-mono">
                      {llmDebug.systemPromptSample}
                    </pre>
                  </details>
                )}
                {llmDebug.error && <p className="text-destructive">Error: {llmDebug.error}</p>}
              </div>
            )}
            
            {visualization.debug.visualization && (
              <div className="space-y-1">
                <p className="font-semibold text-sm">Visualization Factory</p>
                <p>Type: {visualization.debug.visualization.type ?? visualization.type}</p>
                {visualization.debug.visualization.columns && visualization.debug.visualization.columns.length > 0 && (
                  <p>Columns: {visualization.debug.visualization.columns.join(', ')}</p>
                )}
                {typeof visualization.debug.visualization.aggregation !== 'undefined' && (
                  <p>Aggregation: {visualization.debug.visualization.aggregation || 'None'}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <VisualizationDetailsDrawer
        open={showDetails}
        onOpenChange={setShowDetails}
        visualization={visualization}
      />
    </Card>
  );
};

/**
 * VisualizationSkeleton component for loading state
 */
const VisualizationSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
      <Skeleton className="w-full h-full rounded-lg" />
      <div className="mt-2 flex justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">
          Loading visualization...
        </span>
      </div>
    </div>
  );
};
