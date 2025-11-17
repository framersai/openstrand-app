'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DailyCheckIn } from '@/components/journal/DailyCheckIn';
import { QuoteCard } from '@/components/journal/QuoteCard';
import { JournalEntry } from '@/components/journal/JournalEntry';
import { GoalsCard } from '@/components/journal/GoalsCard';
import { AccomplishmentsCard } from '@/components/journal/AccomplishmentsCard';
import { RecommendationsFeed } from '@/components/journal/RecommendationsFeed';
import { JournalReflectionCard } from '@/components/journal/JournalReflectionCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Daily Dashboard Page
 *
 * The user's daily check-in hub featuring:
 * - Mood check-ins
 * - Daily journal entry with doodle support
 * - Goals and accomplishments tracking
 * - Personalized recommendations and notifications
 */
export default function DailyClient() {
  const t = useTranslations('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            aria-label={t('previousDay')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            aria-label={t('nextDay')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            onClick={handleToday}
            disabled={isToday}
            className="hidden sm:flex"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {t('today')}
          </Button>
        </div>
      </div>

      {/* Date indicator for mobile */}
      <div className="sm:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40 py-2 mb-4">
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousDay}
            aria-label={t('previousDay')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('selectedDate')}</p>
            <p className="text-lg font-semibold">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            aria-label={t('nextDay')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop date display */}
      <div className="hidden sm:flex items-center justify-between bg-muted/50 rounded-xl p-4 mb-8 border border-border/40">
        <div>
          <p className="text-sm text-muted-foreground">{t('selectedDate')}</p>
          <p className="text-2xl font-semibold">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        {!isToday && (
          <Button onClick={handleToday}>
            <Calendar className="mr-2 h-4 w-4" />
            {t('goToToday')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DailyCheckIn date={selectedDate} />
          <JournalEntry date={selectedDate} />
          <JournalReflectionCard date={selectedDate} />
        </div>

        <div className="space-y-6">
          <QuoteCard />
          <GoalsCard />
          <AccomplishmentsCard />
          <RecommendationsFeed />

          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span role="img" aria-label="tips">✨</span>
                {t('tips.title')}
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>{t('tips.tip1')}</li>
                <li>{t('tips.tip2')}</li>
                <li>{t('tips.tip3')}</li>
              </ul>
              <Button variant="secondary" className="w-full">
                {t('tips.cta')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

