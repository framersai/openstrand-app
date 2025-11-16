/* eslint-disable @next/next/no-img-element */
'use client';

/**
 * @module FlashcardPlayer
 * @description Interactive flashcard study interface with spaced repetition
 * 
 * Features:
 * - Card flip animation
 * - Spaced repetition ratings (Again, Hard, Good, Easy)
 * - Progress tracking
 * - Keyboard shortcuts
 * - LaTeX and image support
 * - Study session statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RotateCcw, Check, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { flashcardAPI } from '@/services/openstrand.api';
import { useToast } from '@/hooks/use-toast';
import { MathRenderer } from './MathRenderer';

type FlashcardImage =
  | string
  | {
      url: string;
      alt?: string;
      prompt?: string;
      stylePreset?: string;
      safetyLevel?: string;
    };

interface FlashcardContent {
  text: string;
  images?: FlashcardImage[];
  latex?: string;
  audio?: string;
}

interface Flashcard {
  id: string;
  front: FlashcardContent;
  back: FlashcardContent;
  hints: FlashcardContent[];
  deck: string;
  tags: string[];
  reviews: number;
  ease: number;
}

interface FlashcardPlayerProps {
  deckName?: string;
  onComplete?: (results: StudyResults) => void;
}

interface StudyResults {
  totalCards: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
  totalTimeMs: number;
}

export function FlashcardPlayer({ deckName, onComplete }: FlashcardPlayerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StudyResults>({
    totalCards: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    totalTimeMs: 0,
  });
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [generatingSide, setGeneratingSide] = useState<'front' | 'back' | null>(null);
  const { toast } = useToast();

  // Load due flashcards
  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isFlipped) {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped) {
        switch (e.key) {
          case '1':
            handleRating('again');
            break;
          case '2':
            handleRating('hard');
            break;
          case '3':
            handleRating('good');
            break;
          case '4':
            handleRating('easy');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, handleRating]);

  const loadFlashcards = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        includeNew: 'true',
        ...(deckName && { deck: deckName }),
      });

      const response = await fetch(`/api/v1/flashcards/due/study?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.data);
        setResults((prev) => ({ ...prev, totalCards: data.data.length }));
      }
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  }, [deckName]);

  const handleRating = useCallback(async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    const timeSpentMs = Date.now() - cardStartTime;

    try {
      // Record study result
      await fetch('/api/v1/flashcards/study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          rating,
          timeSpentMs,
        }),
      });

      // Update results
      setResults((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
        totalTimeMs: prev.totalTimeMs + timeSpentMs,
      }));

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setShowHint(false);
        setCardStartTime(Date.now());
      } else {
        // Complete session
        onComplete?.({
          ...results,
          [rating]: results[rating] + 1,
          totalTimeMs: results.totalTimeMs + timeSpentMs,
        });
      }
    } catch (error) {
      console.error('Failed to record study:', error);
    }
  }, [flashcards, currentIndex, cardStartTime, results, onComplete]);

  const handleGenerateIllustration = async (side: 'front' | 'back') => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    try {
      setGeneratingSide(side);
      const response = await flashcardAPI.generateIllustration(currentCard.id, {
        side,
        stylePreset: 'flat_pastel',
        includeAnswerContext: side === 'front',
      });
      const updatedCard = response?.data ?? response;
      if (updatedCard?.id) {
        setFlashcards((prev) =>
          prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
        );
        toast({
          title: 'Illustration added',
          description: `A ${side} illustration was generated.`,
        });
      }
    } catch (error) {
      console.error('Failed to generate illustration:', error);
      toast({
        title: 'Generation failed',
        description: 'Unable to generate illustration right now.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSide(null);
    }
  };

  const renderImages = (images?: FlashcardImage[]) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="space-y-2">
        {images.map((img, i) => {
          const src = typeof img === 'string' ? img : img.url;
          if (!src) return null;
          const alt =
            typeof img === 'string'
              ? 'Flashcard illustration'
              : img.alt || 'Flashcard illustration';
          return (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg mx-auto"
            />
          );
        })}
      </div>
    );
  };

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No cards due for review right now. Come back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentCard) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Cards reviewed: {results.totalCards}</p>
            <p>Time spent: {Math.round(results.totalTimeMs / 60000)} minutes</p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="destructive">Again: {results.again}</Badge>
              <Badge variant="secondary">Hard: {results.hard}</Badge>
              <Badge variant="default">Good: {results.good}</Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Easy: {results.easy}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {currentCard.deck}
          </span>
          <Badge variant="outline">
            {currentIndex + 1} / {flashcards.length}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Reviews: {currentCard.reviews}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <div className="relative">
        <Card 
          className={cn(
            "min-h-[400px] cursor-pointer transition-all duration-300",
            "hover:shadow-lg",
            isFlipped && "bg-accent/50"
          )}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
            {!isFlipped ? (
              // Front side
              <div className="text-center space-y-4 w-full">
                <div className="text-2xl font-medium">
                  <MathRenderer content={currentCard.front.text} />
                </div>
                {renderImages(currentCard.front.images)}
                {currentCard.hints.length > 0 && !showHint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(true);
                    }}
                    className="mt-4"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Show Hint
                  </Button>
                )}
                {showHint && currentCard.hints[0] && (
                  <div className="mt-4 p-4 bg-accent/50 rounded-lg text-sm text-muted-foreground">
                    💡 <MathRenderer content={currentCard.hints[0].text} />
                  </div>
                )}
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateIllustration('front');
                    }}
                    disabled={generatingSide === 'front'}
                  >
                    {generatingSide === 'front' ? 'Generating…' : 'Illustrate Front'}
                  </Button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                  Press Space to flip
                </div>
              </div>
            ) : (
              // Back side
              <div className="text-center space-y-6 w-full">
                <div className="text-xl">
                  <MathRenderer content={currentCard.back.text} />
                </div>
                {renderImages(currentCard.back.images)}
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateIllustration('back');
                    }}
                    disabled={generatingSide === 'back'}
                  >
                    {generatingSide === 'back' ? 'Generating…' : 'Illustrate Back'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {currentCard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {currentCard.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Rating Buttons (only visible when flipped) */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRating('again')}
            className="flex-col h-auto py-4 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            <X className="h-5 w-5 mb-1 text-red-600" />
            <span className="font-semibold">Again</span>
            <span className="text-xs text-muted-foreground">1</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRating('hard')}
            className="flex-col h-auto py-4 border-orange-200 hover:bg-orange-50 dark:border-orange-900 dark:hover:bg-orange-950"
          >
            <RotateCcw className="h-5 w-5 mb-1 text-orange-600" />
            <span className="font-semibold">Hard</span>
            <span className="text-xs text-muted-foreground">2</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRating('good')}
            className="flex-col h-auto py-4 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
          >
            <Check className="h-5 w-5 mb-1 text-blue-600" />
            <span className="font-semibold">Good</span>
            <span className="text-xs text-muted-foreground">3</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRating('easy')}
            className="flex-col h-auto py-4 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950"
          >
            <Check className="h-5 w-5 mb-1 text-green-600" />
            <span className="font-semibold">Easy</span>
            <span className="text-xs text-muted-foreground">4</span>
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {isFlipped && (
        <div className="text-center text-xs text-muted-foreground">
          Use keyboard shortcuts: 1 (Again) · 2 (Hard) · 3 (Good) · 4 (Easy)
        </div>
      )}
    </div>
  );
}

