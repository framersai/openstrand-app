'use client';

/**
 * @module MoodTrendsChart
 * @description Line chart showing mood trends over time
 */

import { useEffect, useState } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MoodTrendsChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

const MOOD_VALUES: Record<string, number> = {
  'great': 5,
  'good': 4,
  'okay': 3,
  'neutral': 3,
  'bad': 2,
  'terrible': 1,
};

export function MoodTrendsChart({ dateRange }: MoodTrendsChartProps) {
  const [data, setData] = useState<Array<{ date: string; mood: number }>>([]);
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
          const moodData = result.dailyMoods?.map((item: any) => ({
            date: item.date,
            mood: MOOD_VALUES[item.mood] || 3,
          })) || [];
          setData(moodData);
        }
      } catch (error) {
        console.error('Failed to load mood trends:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [dateRange]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No mood data for this period. Start tracking your mood in daily check-ins.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.[0]) return null;
            const moodValue = payload[0].value as number;
            const moodLabel = Object.entries(MOOD_VALUES).find(([_, v]) => v === moodValue)?.[0] || 'neutral';
            return (
              <div className="rounded-lg border bg-background p-2 shadow-md">
                <div className="text-xs font-medium text-foreground capitalize">{moodLabel}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(payload[0].payload.date).toLocaleDateString()}
                </div>
              </div>
            );
          }}
        />
        <Line 
          type="monotone" 
          dataKey="mood" 
          stroke="#6366F1" 
          strokeWidth={2} 
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
