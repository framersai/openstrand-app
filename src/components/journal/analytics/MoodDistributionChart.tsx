'use client';

/**
 * @module MoodDistributionChart
 * @description Pie chart showing mood distribution
 */

import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Smile } from 'lucide-react';

interface MoodDistributionChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

const MOOD_COLORS: Record<string, string> = {
  'great': '#22C55E',
  'good': '#6366F1',
  'okay': '#F97316',
  'neutral': '#94A3B8',
  'bad': '#EF4444',
  'terrible': '#991B1B',
};

export function MoodDistributionChart({ dateRange }: MoodDistributionChartProps) {
  const [data, setData] = useState<Array<{ mood: string; count: number }>>([]);
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
          const distribution = result.moodDistribution || {};
          const chartData = Object.entries(distribution).map(([mood, count]) => ({
            mood,
            count: count as number,
          }));
          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to load mood distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Smile className="h-4 w-4 text-primary" />
          Mood Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No mood data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs font-medium text-foreground capitalize">
                        {payload[0].name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payload[0].value} {payload[0].value === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="mood"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood] || '#94A3B8'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
