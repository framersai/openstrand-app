'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LazyChart } from '@/components/analytics/LazyChart';

interface MoodTrendsChartProps {
  dateRange: { from: Date; to: Date };
}

interface MoodDataPoint {
  date: string;
  mood: number;
  avgMood: number;
}

export function MoodTrendsChart({ dateRange }: MoodTrendsChartProps) {
  const t = useTranslations('history.journal');
  const [data, setData] = useState<MoodDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call to /api/v1/journal/analytics/mood
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockData: MoodDataPoint[] = [];
        const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < daysDiff; i++) {
          const date = new Date(dateRange.from);
          date.setDate(date.getDate() + i);
          mockData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            mood: Math.random() * 4 + 5, // Random mood between 5-9
            avgMood: 7.5,
          });
        }
        
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <LazyChart minHeight={300}>
      {() => (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              domain={[0, 10]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              name={t('yourMood')}
            />
            <Line 
              type="monotone" 
              dataKey="avgMood" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name={t('average')}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </LazyChart>
  );
}

