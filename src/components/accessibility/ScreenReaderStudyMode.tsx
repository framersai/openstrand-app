/**
 * Screen-Reader Optimized Study Mode
 * 
 * Accessible study interface that auto-narrates flashcards/quizzes.
 * Optimized for screen readers and keyboard-only navigation.
 * 
 * Features:
 * - Auto-narration with ARIA live regions
 * - Arrow key navigation
 * - Number keys for answers
 * - Skip controls (Tab, Shift+Tab)
 * - High-contrast visual feedback
 * - Focus management
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { ArrowLeft, ArrowRight, Volume2, Eye } from 'lucide-react';

export interface ScreenReaderFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface ScreenReaderStudyModeProps {
  flashcards: ScreenReaderFlashcard[];
  onRate?: (id: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onComplete?: () => void;
  autoNarrate?: boolean;
}

export function ScreenReaderStudyMode({
  flashcards,
  onRate,
  onComplete,
  autoNarrate = true,
}: ScreenReaderStudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const { speak, playing, stop } = useTextToSpeech();
  const cardRef = useRef<HTMLDivElement>(null);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  // Auto-narrate current content
  useEffect(() => {
    if (!currentCard || !autoNarrate) return;

    const textToRead = isFlipped
      ? `Answer: ${currentCard.back}`
      : `Question ${currentIndex + 1} of ${flashcards.length}: ${currentCard.front}`;

    // Announce to screen reader
    setAnnouncement(textToRead);

    // Speak via TTS
    speak(textToRead);

    return () => stop();
  }, [currentIndex, isFlipped, autoNarrate, currentCard, flashcards.length, speak, stop]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!isFlipped) {
            setIsFlipped(true);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setShowHint(!showHint);
          break;
        case '1':
          if (isFlipped) {
            e.preventDefault();
            handleRate('again');
          }
          break;
        case '2':
          if (isFlipped) {
            e.preventDefault();
            handleRate('hard');
          }
          break;
        case '3':
          if (isFlipped) {
            e.preventDefault();
            handleRate('good');
          }
          break;
        case '4':
          if (isFlipped) {
            e.preventDefault();
            handleRate('easy');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, showHint]);

  const handleRate = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    onRate?.(currentCard.id, rating);

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      onComplete?.();
    }
  }, [currentCard, currentIndex, flashcards.length, onRate, onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, flashcards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  if (!currentCard) {
    return (
      <div role="region" aria-label="Study session complete">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
            <p className="text-muted-foreground">
              You've reviewed all {flashcards.length} cards.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="max-w-3xl mx-auto space-y-4"
      role="region"
      aria-label="Flashcard study area"
    >
      {/* ARIA Live Region for announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" aria-label={`Card ${currentIndex + 1} of ${flashcards.length}`}>
          {currentIndex + 1} / {flashcards.length}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </span>
      </div>

      <Progress value={progress} className="h-2" aria-valuenow={progress} />

      {/* Main Card */}
      <Card
        className={cn(
          'border-2 focus-within:ring-2 focus-within:ring-primary',
          isFlipped && 'border-primary bg-primary/5'
        )}
        tabIndex={0}
        role="article"
        aria-label={isFlipped ? 'Answer card' : 'Question card'}
      >
        <CardContent className="p-8 md:p-12 space-y-6">
          {/* Content */}
          <div className="text-center space-y-4">
            {!isFlipped ? (
              <>
                <h2
                  className="text-2xl md:text-3xl font-semibold"
                  role="heading"
                  aria-level={2}
                  id={`question-${currentCard.id}`}
                >
                  {currentCard.front}
                </h2>

                {showHint && currentCard.hint && (
                  <div
                    className="p-4 bg-accent rounded-lg text-sm text-muted-foreground"
                    role="note"
                    aria-label="Hint"
                  >
                    💡 {currentCard.hint}
                  </div>
                )}

                <Button
                  onClick={() => setIsFlipped(true)}
                  size="lg"
                  className="mt-6"
                  aria-label="Show answer"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Show Answer (Space/Enter)
                </Button>

                {currentCard.hint && !showHint && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowHint(true)}
                    aria-label="Show hint"
                  >
                    Show Hint (H key)
                  </Button>
                )}
              </>
            ) : (
              <>
                <h2
                  className="text-2xl md:text-3xl font-semibold text-primary"
                  role="heading"
                  aria-level={2}
                  id={`answer-${currentCard.id}`}
                >
                  {currentCard.back}
                </h2>

                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8"
                  role="group"
                  aria-label="Rate your confidence"
                >
                  <Button
                    variant="destructive"
                    onClick={() => handleRate('again')}
                    aria-label="Again. Press 1"
                    className="h-16"
                  >
                    <span className="sr-only">Press 1 for </span>
                    Again<span className="ml-2 text-xs">(1)</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleRate('hard')}
                    aria-label="Hard. Press 2"
                    className="h-16"
                  >
                    <span className="sr-only">Press 2 for </span>
                    Hard<span className="ml-2 text-xs">(2)</span>
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => handleRate('good')}
                    aria-label="Good. Press 3"
                    className="h-16"
                  >
                    <span className="sr-only">Press 3 for </span>
                    Good<span className="ml-2 text-xs">(3)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleRate('easy')}
                    aria-label="Easy. Press 4"
                    className="h-16 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <span className="sr-only">Press 4 for </span>
                    Easy<span className="ml-2 text-xs">(4)</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Hints */}
          <div
            className="text-sm text-muted-foreground text-center pt-4 border-t"
            role="note"
            aria-label="Keyboard shortcuts"
          >
            <p>← → Previous/Next • Space/Enter Show Answer • H Show Hint • 1-4 Rate</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => speak(isFlipped ? currentCard.back : currentCard.front)}
          aria-label="Repeat narration"
          title="Repeat"
        >
          <Volume2 className={cn('h-5 w-5', playing && 'text-primary animate-pulse')} />
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          aria-label="Next card"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Screen Reader Instructions */}
      <div className="sr-only" role="complementary" aria-label="Study mode help">
        <h3>Screen Reader Study Mode Instructions</h3>
        <ul>
          <li>Navigation: Use arrow keys to move between cards</li>
          <li>Show answer: Press Space or Enter</li>
          <li>Show hint: Press H</li>
          <li>Rate your confidence: Press 1 for Again, 2 for Hard, 3 for Good, 4 for Easy</li>
          <li>Repeat narration: Press R</li>
        </ul>
      </div>
    </div>
  );
}

