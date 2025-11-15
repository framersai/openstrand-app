'use client';

/**
 * @module FlashcardsPage
 * @description Main flashcards page - browse decks and study
 * 
 * Features:
 * - Deck browser with stats
 * - Due cards indicator
 * - Quick start study session
 * - Create new flashcards
 * - Generate from strands
 */

import React, { useState, useEffect } from 'react';
import { Brain, Plus, Play, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { flashcardAPI } from '@/services/openstrand.api';
import Link from 'next/link';

interface Deck {
  name: string;
  total: number;
  due: number;
  new: number;
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await flashcardAPI.getDecks();
      setDecks(data);
      setTotalDue(data.reduce((sum, d) => sum + d.due, 0));
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Flashcards
          </h1>
          <p className="text-muted-foreground mt-1">
            Spaced repetition learning with intelligent review scheduling
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/flashcards/create">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Link>
          </Button>
          {totalDue > 0 && (
            <Button asChild>
              <Link href="/flashcards/study">
                <Play className="h-4 w-4 mr-2" />
                Study Now ({totalDue})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-3xl font-bold text-primary">{totalDue}</p>
              </div>
              <Clock className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-3xl font-bold">
                  {decks.reduce((sum, d) => sum + d.total, 0)}
                </p>
              </div>
              <BookOpen className="h-10 w-10 text-muted/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Decks</p>
                <p className="text-3xl font-bold">{decks.length}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decks Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Decks</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading decks...</p>
        ) : decks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No flashcards yet</p>
              <p className="text-muted-foreground mb-4">
                Create flashcards manually or generate them from your strands
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link href="/flashcards/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flashcard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pkms/strands">
                    Browse Strands
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card key={deck.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{deck.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{deck.total} cards</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due</span>
                      <Badge variant={deck.due > 0 ? 'default' : 'secondary'}>
                        {deck.due}
                      </Badge>
                    </div>
                    {deck.due > 0 && (
                      <Progress value={(deck.due / deck.total) * 100} className="h-2" />
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {deck.due > 0 && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/flashcards/study?deck=${encodeURIComponent(deck.name)}`}>
                          <Play className="h-4 w-4 mr-1" />
                          Study
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/flashcards?deck=${encodeURIComponent(deck.name)}`}>
                        Browse
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


