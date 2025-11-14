'use client';

import { ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CitationCardProps {
  citation: {
    strandId?: string;
    chunkId: string;
    score: number;
    text: string;
  };
  index: number;
  onOpenStrand?: (strandId: string) => void;
  className?: string;
}

/**
 * CitationCard Component
 * 
 * Displays a source citation with score, preview text, and actions.
 * 
 * @example
 * ```tsx
 * <CitationCard
 *   citation={{
 *     strandId: 'strand-123',
 *     chunkId: 'chunk-456',
 *     score: 0.92,
 *     text: 'Quantum computing uses...'
 *   }}
 *   index={0}
 *   onOpenStrand={(id) => router.push(`/strands/${id}`)}
 * />
 * ```
 */
export function CitationCard({
  citation,
  index,
  onOpenStrand,
  className,
}: CitationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleOpen = () => {
    if (citation.strandId && onOpenStrand) {
      onOpenStrand(citation.strandId);
    }
  };

  return (
    <Card className={cn('group relative', className)}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Citation number */}
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px]">
              {index + 1}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Score */}
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${citation.score * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {(citation.score * 100).toFixed(0)}%
              </span>
            </div>

            {/* Text preview */}
            <p className="text-sm text-foreground/90 line-clamp-3">
              {citation.text}
            </p>

            {/* Actions */}
            <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy citation text</TooltipContent>
              </Tooltip>

              {citation.strandId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2"
                      onClick={handleOpen}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Open</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open source strand</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CitationList Component
 * 
 * Displays a list of citations in a compact format.
 * 
 * @example
 * ```tsx
 * <CitationList
 *   citations={[...]}
 *   onOpenStrand={(id) => router.push(`/strands/${id}`)}
 * />
 * ```
 */
export function CitationList({
  citations,
  onOpenStrand,
  className,
}: {
  citations: Citation[];
  onOpenStrand?: (strandId: string) => void;
  className?: string;
}) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <FileText className="h-3 w-3" />
        Sources ({citations.length})
      </div>
      {citations.map((citation, i) => (
        <CitationCard
          key={citation.chunkId}
          citation={citation}
          index={i}
          onOpenStrand={onOpenStrand}
        />
      ))}
    </div>
  );
}

