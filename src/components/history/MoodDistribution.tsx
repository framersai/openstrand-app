'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Smile } from 'lucide-react';
import { LazyChart } from '@/components/analytics/LazyChart';

interface MoodDistributionProps {
  dateRange: { from: Date; to: Date };
}

interface MoodData {
  mood: string;
  count: number;
  color: string;
}

export function MoodDistribution({ dateRange }: MoodDistributionProps) {
  const t = useTranslations('history.journal');
  const [data, setData] = useState<MoodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodDistribution = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setData([
          { mood: 'Happy', count: 15, color: '#22c55e' },
          { mood: 'Neutral', count: 8, color: '#64748b' },
          { mood: 'Sad', count: 3, color: '#ef4444' },
          { mood: 'Excited', count: 6, color: '#f59e0b' },
          { mood: 'Tired', count: 5, color: '#8b5cf6' },
        ]);
      } catch (error) {
        console.error('Failed to fetch mood distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodDistribution();
  }, [dateRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5" />
            {t('moodDistribution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-5 w-5" />
          {t('moodDistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LazyChart minHeight={250}>
          {() => (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.mood}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </LazyChart>
      </CardContent>
    </Card>
  );
}

