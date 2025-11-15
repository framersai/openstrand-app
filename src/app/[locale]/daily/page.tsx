'use client';

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
export default function DailyPage() {
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
            onClick={handleToday}
            disabled={isToday}
            className="min-w-[120px]"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isToday ? t('today') : selectedDate.toLocaleDateString()}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            disabled={isToday}
            aria-label={t('nextDay')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Check-In & Quote Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DailyCheckIn date={selectedDate} />
            <QuoteCard />
          </div>

          {/* Journal Entry */}
          <JournalEntry date={selectedDate} />

          {/* Goals & Accomplishments Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoalsCard date={selectedDate} />
            <AccomplishmentsCard date={selectedDate} />
          </div>
        </div>

        {/* Right Column - Recommendations & Reflections */}
        <div className="lg:col-span-1 space-y-6">
          <JournalReflectionCard />
          <RecommendationsFeed />
        </div>
      </div>
    </div>
  );
}

