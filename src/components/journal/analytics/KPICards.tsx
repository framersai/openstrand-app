'use client';

/**
 * @module KPICards
 * @description KPI summary cards for journal analytics
 */

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Smile } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KPICardsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function KPICards({ dateRange }: KPICardsProps) {
  const [stats, setStats] = useState<{
    totalEntries: number;
    currentStreak: number;
    avgMood: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/journal/analytics/mood?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setStats({
            totalEntries: result.totalEntries || 0,
            currentStreak: result.currentStreak || 0,
            avgMood: result.averageMood || 3,
          });
        }
      } catch (error) {
        console.error('Failed to load KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats?.totalEntries || 0}</div>
              <div className="text-xs text-muted-foreground">Total Entries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats?.currentStreak || 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Smile className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.avgMood.toFixed(1) || '3.0'}
              </div>
              <div className="text-xs text-muted-foreground">Avg Mood</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
