'use client';

/**
 * @module PDFReaderLayout
 * @description Two-pane PDF reader with text on left and illustrations on right
 * 
 * Features:
 * - Split layout: text (left) | illustration (right)
 * - Page navigation
 * - Generate illustrations on-the-fly or batch
 * - Progress indicator for generation
 * - Prefetch next page illustration
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Image as ImageIcon, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Page {
  pageNumber: number;
  title?: string;
  text: string;
  summary?: string;
  illustration?: {
    url: string;
    generated: boolean;
    cost?: number;
  };
}

interface PDFReaderLayoutProps {
  strandId: string;
  pages: Page[];
  onGenerateIllustrations?: () => void;
}

export function PDFReaderLayout({ strandId, pages, onGenerateIllustrations }: PDFReaderLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [generatingPage, setGeneratingPage] = useState<number | null>(null);
  const [illustrationMode, setIllustrationMode] = useState<'none' | 'lazy' | 'batch'>('none');

  const page = pages[currentPage];

  // Prefetch next page illustration in lazy mode
  useEffect(() => {
    if (illustrationMode === 'lazy' && currentPage < pages.length - 1) {
      const nextPage = pages[currentPage + 1];
      if (!nextPage.illustration) {
        // Queue generation for next page
        void prefetchIllustration(currentPage + 1);
      }
    }
  }, [currentPage, illustrationMode]);

  const prefetchIllustration = async (pageIndex: number) => {
    const targetPage = pages[pageIndex];
    if (!targetPage || targetPage.illustration) return;

    setGeneratingPage(pageIndex);

    try {
      // Generate illustration for this page
      const response = await fetch('/api/v1/illustrations/strand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          strandId,
          title: targetPage.title,
          summary: targetPage.summary || targetPage.text.substring(0, 500),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update page with illustration
        pages[pageIndex].illustration = {
          url: data.data.images[0].url,
          generated: true,
        };
      }
    } catch (error) {
      console.error(`Failed to generate illustration for page ${pageIndex}:`, error);
    } finally {
      setGeneratingPage(null);
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">PDF Reader</h2>
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {pages.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {illustrationMode === 'none' && (
              <Button onClick={onGenerateIllustrations} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Illustrations
              </Button>
            )}
            {illustrationMode === 'lazy' && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-generating
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Progress value={((currentPage + 1) / pages.length) * 100} className="w-64 h-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === pages.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Text Panel (Left) */}
        <div className="flex-1 overflow-y-auto border-r border-border bg-background p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {page.title && (
              <h3 className="text-2xl font-bold mb-4">{page.title}</h3>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">
                {page.text}
              </p>
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="h-full" />

        {/* Illustration Panel (Right) */}
        <div className="w-[500px] overflow-y-auto bg-muted/30 p-8">
          <div className="sticky top-0">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Illustration</span>
              {generatingPage === currentPage && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </Badge>
              )}
            </div>

            {page.illustration ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={page.illustration.url}
                    alt={`Page ${currentPage + 1} illustration`}
                    className="w-full h-auto"
                  />
                  {page.illustration.cost && (
                    <div className="p-2 text-xs text-muted-foreground text-center bg-muted">
                      Cost: ${page.illustration.cost.toFixed(4)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : generatingPage === currentPage ? (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating illustration...</p>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center border-dashed">
                <div className="text-center space-y-3 p-8">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No illustration generated yet
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => prefetchIllustration(currentPage)}
                    disabled={generatingPage !== null}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Now
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

