'use client';

/**
 * @module ContentDiffViewer
 * @description Side-by-side diff viewer for AI-generated vs edited flashcards/quizzes
 * 
 * Features:
 * - Visual comparison of AI draft vs user edits
 * - Syntax highlighting for changes
 * - Accept/reject individual cards
 * - Batch operations
 * - Color-coded additions/deletions
 */

import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Check, X, ChevronLeft, ChevronRight, CheckCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlashcardDiff {
  id: string;
  original: {
    front: string;
    back: string;
    hints?: string[];
  };
  edited: {
    front: string;
    back: string;
    hints?: string[];
  };
  status: 'pending' | 'accepted' | 'rejected';
}

interface ContentDiffViewerProps {
  /** Array of flashcards with original/edited versions */
  diffs: FlashcardDiff[];
  
  /** Called when user accepts a card */
  onAccept?: (id: string) => void;
  
  /** Called when user rejects a card */
  onReject?: (id: string) => void;
  
  /** Called when user accepts all */
  onAcceptAll?: () => void;
  
  /** Called when user rejects all */
  onRejectAll?: () => void;
  
  /** Custom class name */
  className?: string;
}

export function ContentDiffViewer({
  diffs,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  className,
}: ContentDiffViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const currentDiff = diffs[currentIndex];
  
  if (!currentDiff) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No changes to review</p>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = diffs.filter((d) => d.status === 'pending').length;
  const acceptedCount = diffs.filter((d) => d.status === 'accepted').length;
  const rejectedCount = diffs.filter((d) => d.status === 'rejected').length;

  const handleNext = () => {
    if (currentIndex < diffs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAccept = () => {
    onAccept?.(currentDiff.id);
    if (currentIndex < diffs.length - 1) {
      handleNext();
    }
  };

  const handleReject = () => {
    onReject?.(currentDiff.id);
    if (currentIndex < diffs.length - 1) {
      handleNext();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Changes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare AI-generated content with your edits
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{acceptedCount} accepted</Badge>
              <Badge variant="outline">{rejectedCount} rejected</Badge>
              <Badge variant="default">{pendingCount} pending</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-accent rounded-md text-sm font-medium">
                {currentIndex + 1} / {diffs.length}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === diffs.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={currentDiff.status !== 'pending'}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleAccept}
                disabled={currentDiff.status !== 'pending'}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {pendingCount > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectAll}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject All
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onAcceptAll}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Accept All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Badge */}
      {currentDiff.status !== 'pending' && (
        <div className="flex justify-center">
          <Badge
            variant={currentDiff.status === 'accepted' ? 'default' : 'destructive'}
            className="py-1 px-3"
          >
            {currentDiff.status === 'accepted' ? 'Accepted ✓' : 'Rejected ✗'}
          </Badge>
        </div>
      )}

      {/* Diff Views */}
      <div className="space-y-4">
        {/* Front Side */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Front Side</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactDiffViewer
              oldValue={currentDiff.original.front}
              newValue={currentDiff.edited.front}
              splitView={viewMode === 'split'}
              useDarkTheme={false}
              leftTitle="AI Generated"
              rightTitle="Edited"
              styles={{
                diffContainer: {
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '14px',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Back Side */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Back Side</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactDiffViewer
              oldValue={currentDiff.original.back}
              newValue={currentDiff.edited.back}
              splitView={viewMode === 'split'}
              useDarkTheme={false}
              leftTitle="AI Generated"
              rightTitle="Edited"
            />
          </CardContent>
        </Card>

        {/* Hints (if present) */}
        {(currentDiff.original.hints || currentDiff.edited.hints) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hints</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactDiffViewer
                oldValue={(currentDiff.original.hints || []).join('\n')}
                newValue={(currentDiff.edited.hints || []).join('\n')}
                splitView={viewMode === 'split'}
                useDarkTheme={false}
                leftTitle="AI Generated"
                rightTitle="Edited"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            Split View
          </Button>
          <Button
            variant={viewMode === 'unified' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('unified')}
          >
            Unified View
          </Button>
        </div>
      </div>
    </div>
  );
}

