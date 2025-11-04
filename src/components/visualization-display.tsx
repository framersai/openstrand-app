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
import { Download, Maximize2, Edit3, Trash2, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackButtons } from '@/components/feedback-buttons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Visualization, FeedbackSummary } from '@/types';
import { VisualizationTier } from '@/lib/visualization/types';
import type { AIArtisanResult } from '@/lib/visualization/types';

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
    label: 'Tier 1 - Static',
    className:
      'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-200',
  },
  [VisualizationTier.Dynamic]: {
    label: 'Tier 2 - Dynamic',
    className:
      'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200',
  },
  [VisualizationTier.AIArtisan]: {
    label: 'Tier 3 - AI Artisan',
    className:
      'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-200',
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
              nodes={visualization.data.nodes || []}
              links={visualization.data.links || []}
              width={800}
              height={600}
            />
          );
        case '3d-scatter':
        case 'three-scatter':
          return (
            <Three3DScatter
              data={visualization.data.points || []}
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
  
  return (
    <Card className={cn('visualization-card', isFullscreen && 'fixed inset-4 z-50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex flex-wrap items-center gap-2">
              <span>{visualization.title}</span>
              {tierBadge && (
                <Badge className={cn('border text-[11px] font-semibold uppercase tracking-wide', tierBadge.className)}>
                  {tierBadge.label}
                </Badge>
              )}
              {generationMode && (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {generationMode}
                </span>
              )}
            </CardTitle>
            {visualization.description && (
              <p className="text-sm text-muted-foreground">{visualization.description}</p>
            )}
            {!visualization.description && visualization.prompt && (
              <p className="text-xs text-muted-foreground leading-snug">
                Prompt: <span className="italic">"{visualization.prompt}"</span>
              </p>
            )}
            {(tierMetadata?.suggestedApproach || typeof tierMetadata?.estimatedCost === 'number') && (
              <p className="text-xs text-muted-foreground">
                {tierMetadata?.suggestedApproach}
                {typeof tierMetadata?.estimatedCost === 'number' && (
                  <>
                    {tierMetadata?.suggestedApproach ? ' · ' : ''}
                    Est. cost ${tierMetadata.estimatedCost.toFixed(2)} (BYOK)
                  </>
                )}
              </p>
            )}
            {tierMetadata?.tierReasoning && (
              <p className="text-[11px] text-muted-foreground/80">
                Reasoning: {tierMetadata.tierReasoning}
              </p>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
                disabled={disabled}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleModifyInput}
                disabled={disabled}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              {visualization.type !== 'table' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={safeExport}
                  disabled={disabled}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {visualization.debug && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', showDebug && 'text-primary')}
                  onClick={toggleDebug}
                  title="Toggle debug details"
                  disabled={disabled}
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
              
              {onExport && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={safeOnExport}
                  disabled={disabled}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={safeOnRemove}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Modify input */}
        {showModifyInput && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Describe how to modify this visualization..."
              className="flex-1 px-3 py-1 text-sm rounded border bg-background"
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
