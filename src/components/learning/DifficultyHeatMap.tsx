'use client';

/**
 * @module DifficultyHeatMap
 * @description Visual heat map showing card difficulty (ease factor & lapses)
 * 
 * Features:
 * - Color-coded tiles (green = mastered, red = problematic)
 * - Click to study specific card
 * - Filter by difficulty range
 * - Tooltip with stats on hover
 * - Export/print view
 */

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FlashcardStats {
  id: string;
  front: { text: string };
  ease: number; // 1.3 to 2.5+ (higher = easier)
  lapses: number; // Times forgotten
  reviews: number;
  interval: number; // Days until next review
  deck: string;
}

interface DifficultyHeatMapProps {
  flashcards: FlashcardStats[];
  onCardClick?: (flashcard: FlashcardStats) => void;
  className?: string;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

/**
 * Calculate difficulty score (0 = hardest, 100 = easiest)
 */
function calculateDifficultyScore(card: FlashcardStats): number {
  // Normalize ease (1.3-2.5 range) to 0-100
  const easeScore = ((card.ease - 1.3) / (2.5 - 1.3)) * 50;
  
  // Penalize lapses (each lapse reduces score)
  const lapsePenalty = Math.min(card.lapses * 10, 50);
  
  // Bonus for successful reviews
  const reviewBonus = Math.min(card.reviews * 2, 20);
  
  const score = Math.max(0, Math.min(100, easeScore - lapsePenalty + reviewBonus));
  return score;
}

/**
 * Get color for difficulty score
 */
function getDifficultyColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function DifficultyHeatMap({
  flashcards,
  onCardClick,
  className,
}: DifficultyHeatMapProps) {
  const [filter, setFilter] = useState<DifficultyFilter>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    let cards = flashcards;

    if (filter !== 'all') {
      cards = cards.filter((card) => {
        const score = calculateDifficultyScore(card);
        switch (filter) {
          case 'easy':
            return score >= 70;
          case 'medium':
            return score >= 30 && score < 70;
          case 'hard':
            return score < 30;
          default:
            return true;
        }
      });
    }

    return cards;
  }, [flashcards, filter]);

  const stats = useMemo(() => {
    const scores = flashcards.map(calculateDifficultyScore);
    const easy = scores.filter((s) => s >= 70).length;
    const medium = scores.filter((s) => s >= 30 && s < 70).length;
    const hard = scores.filter((s) => s < 30).length;
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    return { easy, medium, hard, avgScore };
  }, [flashcards]);

  const handleExport = () => {
    // Generate CSV export
    const csv = [
      'Card,Ease,Lapses,Reviews,Interval,Score',
      ...flashcards.map((card) => {
        const score = calculateDifficultyScore(card);
        return `"${card.front.text.substring(0, 50)}...",${card.ease},${card.lapses},${card.reviews},${card.interval},${score}`;
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcard-heatmap-${Date.now()}.csv`;
    a.click();
    URL.createObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Difficulty Heat Map
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visual overview of card mastery levels
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as DifficultyFilter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="easy">Easy Only</SelectItem>
                <SelectItem value="medium">Medium Only</SelectItem>
                <SelectItem value="hard">Hard Only</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-green-600">{stats.easy}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
            <p className="text-xs text-muted-foreground">Learning</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-red-600">{stats.hard}</p>
            <p className="text-xs text-muted-foreground">Difficult</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">{Math.round(stats.avgScore)}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="grid grid-cols-10 gap-1">
          {filteredCards.map((card) => {
            const score = calculateDifficultyScore(card);
            const colorClass = getDifficultyColor(score);

            return (
              <button
                key={card.id}
                className={cn(
                  'aspect-square rounded-sm transition-all hover:scale-110 hover:z-10',
                  colorClass,
                  hoveredCard === card.id && 'ring-2 ring-primary ring-offset-1'
                )}
                onClick={() => onCardClick?.(card)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                title={`${card.front.text.substring(0, 50)}... | Score: ${Math.round(score)} | Ease: ${card.ease.toFixed(2)} | Lapses: ${card.lapses}`}
              />
            );
          })}
        </div>

        {/* Hover Details */}
        {hoveredCard && (
          <div className="p-4 bg-accent/50 rounded-lg text-sm space-y-2">
            {(() => {
              const card = filteredCards.find((c) => c.id === hoveredCard);
              if (!card) return null;
              const score = calculateDifficultyScore(card);
              return (
                <>
                  <p className="font-medium truncate">{card.front.text}</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Score</p>
                      <p className="font-semibold">{Math.round(score)}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ease</p>
                      <p className="font-semibold">{card.ease.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lapses</p>
                      <p className="font-semibold">{card.lapses}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reviews</p>
                      <p className="font-semibold">{card.reviews}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interval</p>
                      <p className="font-semibold">{card.interval}d</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deck</p>
                      <p className="font-semibold truncate">{card.deck}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-yellow-500" />
            <span className="text-muted-foreground">Learning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">Difficult</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

