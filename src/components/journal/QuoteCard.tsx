'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Quote {
  quote: string;
  author: string;
  tags: string[];
}

// Sample quotes database (in production, this would come from an API or database)
const QUOTES: Quote[] = [
  {
    quote: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    tags: ['work', 'passion', 'motivation'],
  },
  {
    quote: 'Knowledge is power.',
    author: 'Francis Bacon',
    tags: ['learning', 'knowledge', 'education'],
  },
  {
    quote: 'The journey of a thousand miles begins with one step.',
    author: 'Lao Tzu',
    tags: ['motivation', 'progress', 'perseverance'],
  },
  {
    quote: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    tags: ['challenge', 'opportunity', 'growth'],
  },
  {
    quote: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    tags: ['action', 'motivation', 'timing'],
  },
  {
    quote: 'What we think, we become.',
    author: 'Buddha',
    tags: ['mindfulness', 'thoughts', 'self-improvement'],
  },
  {
    quote: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    tags: ['motivation', 'action', 'courage'],
  },
  {
    quote: 'Learning never exhausts the mind.',
    author: 'Leonardo da Vinci',
    tags: ['learning', 'education', 'curiosity'],
  },
];

export function QuoteCard() {
  const t = useTranslations('daily.quote');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: quote } = useQuery({
    queryKey: ['dailyQuote', refreshKey],
    queryFn: async () => {
      // In production, this would fetch from an API based on user interests
      // For now, return a random quote
      const randomIndex = Math.floor(Math.random() * QUOTES.length);
      return QUOTES[randomIndex];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{t('title')}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          aria-label={t('refresh')}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {quote ? (
          <div className="space-y-4">
            <blockquote className="text-lg font-medium italic leading-relaxed">
              "{quote.quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground text-right">
              — {quote.author}
            </p>
          </div>
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-1/3 ml-auto"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

