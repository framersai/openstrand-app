'use client';

/**
 * @module GenerationCTA
 * @description Context-aware call-to-action for generating flashcards/quizzes
 * 
 * Features:
 * - Detects content type (long-form, PDF, dataset, image, etc.)
 * - Shows appropriate generation suggestions
 * - Cost estimates before generation
 * - Template selection
 */

import React, { useState, useEffect } from 'react';
import { Brain, ClipboardCheck, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CostBadge } from '@/components/ui/cost-badge';
import { cn } from '@/lib/utils';

interface Strand {
  id: string;
  title: string;
  content: any;
  contentType?: string;
  summary?: string;
}

interface GenerationCTAProps {
  strand: Strand;
  onGenerateFlashcards?: (options: any) => void;
  onGenerateQuiz?: (options: any) => void;
  className?: string;
}

interface ContentAnalysis {
  tokenCount: number;
  isLongForm: boolean; // > 500 tokens
  isShort: boolean; // < 100 tokens
  hasTabularData: boolean;
  hasCode: boolean;
  isPDF: boolean;
  isEPUB: boolean;
  isImage: boolean;
  recommendedTemplate: {
    flashcard?: string;
    quiz?: string;
  };
  suggestedCount: {
    flashcards: number;
    quizQuestions: number;
  };
  estimatedCost: {
    flashcards: number;
    quiz: number;
  };
}

export function GenerationCTA({ strand, onGenerateFlashcards, onGenerateQuiz, className }: GenerationCTAProps) {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    analyzeContent();
  }, [strand]);

  const analyzeContent = () => {
    const contentStr = JSON.stringify(strand.content);
    const tokenCount = Math.ceil(contentStr.length / 4);

    const isLongForm = tokenCount > 500;
    const isShort = tokenCount < 100;
    const hasTabularData = contentStr.includes('rows') || contentStr.includes('columns');
    const hasCode = contentStr.includes('function') || contentStr.includes('class');
    const isPDF = strand.contentType === 'application/pdf';
    const isEPUB = strand.contentType === 'application/epub+zip';
    const isImage = strand.contentType?.startsWith('image/');

    // Recommend templates
    let flashcardTemplate = 'qa';
    let quizTemplate = 'mcq_overview';

    if (hasTabularData) {
      flashcardTemplate = 'dataset_numeric';
      quizTemplate = 'dataset_analysis';
    } else if (hasCode) {
      quizTemplate = 'practical_code';
    } else if (isLongForm) {
      flashcardTemplate = 'cloze';
      quizTemplate = 'mixed_depth';
    } else if (isShort) {
      flashcardTemplate = 'minimal';
      quizTemplate = 'minimal';
    }

    // Suggest counts
    const flashcardCount = isShort ? 2 : isLongForm ? 15 : 5;
    const quizQuestionCount = isShort ? 3 : isLongForm ? 20 : 10;

    // Rough cost estimates (GPT-4o-mini for generation)
    const flashcardCost = flashcardCount * 0.002; // ~$0.002 per flashcard
    const quizCost = quizQuestionCount * 0.003; // ~$0.003 per question

    setAnalysis({
      tokenCount,
      isLongForm,
      isShort,
      hasTabularData,
      hasCode,
      isPDF,
      isEPUB,
      isImage,
      recommendedTemplate: {
        flashcard: flashcardTemplate,
        quiz: quizTemplate,
      },
      suggestedCount: {
        flashcards: flashcardCount,
        quizQuestions: quizQuestionCount,
      },
      estimatedCost: {
        flashcards: flashcardCost,
        quiz: quizCost,
      },
    });
  };

  if (!analysis) return null;

  // Don't show CTA for very short content (single image, tiny snippet)
  if (analysis.isShort && !analysis.hasTabularData) {
    return (
      <Card className={cn('border-dashed bg-muted/30', className)}>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Content is minimal. You can generate 1-2 basic flashcards if needed.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGenerateFlashcards?.({ count: 2, template: 'minimal' })}
          >
            Generate
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show recommendation for substantial content
  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          {analysis.isLongForm ? 'Recommended: ' : 'Optional: '}
          Study Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {analysis.isLongForm ? (
            <>
              This looks like substantial learning content ({analysis.tokenCount} tokens). 
              Generate <strong>flashcards</strong> or a <strong>quiz</strong> to study it effectively!
            </>
          ) : (
            <>You can generate flashcards or a quiz to review this content.</>
          )}
        </p>

        {/* Generation Options */}
        <div className="grid grid-cols-2 gap-3">
          {/* Flashcards */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onGenerateFlashcards?.({
                  count: analysis.suggestedCount.flashcards,
                  template: analysis.recommendedTemplate.flashcard,
                })}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Flashcards</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {analysis.suggestedCount.flashcards} cards
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs capitalize">
                  {analysis.recommendedTemplate.flashcard?.replace('_', ' ')}
                </Badge>
                <CostBadge 
                  amount={analysis.estimatedCost.flashcards} 
                  size="sm"
                  showIcon={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onGenerateQuiz?.({
                  questionCount: analysis.suggestedCount.quizQuestions,
                  template: analysis.recommendedTemplate.quiz,
                })}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Quiz</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {analysis.suggestedCount.quizQuestions} questions
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs capitalize">
                  {analysis.recommendedTemplate.quiz?.replace('_', ' ')}
                </Badge>
                <CostBadge 
                  amount={analysis.estimatedCost.quiz} 
                  size="sm"
                  showIcon={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional context for specific content types */}
        {analysis.hasTabularData && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Dataset detected - questions will focus on statistics and patterns
          </div>
        )}
        {analysis.hasCode && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Code detected - quiz will include practical coding questions
          </div>
        )}
      </CardContent>
    </Card>
  );
}

