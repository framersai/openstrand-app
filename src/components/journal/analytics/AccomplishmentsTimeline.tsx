'use client';

/**
 * @module AccomplishmentsTimeline
 * @description Timeline of daily accomplishments
 */

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AccomplishmentsTimelineProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function AccomplishmentsTimeline({ dateRange }: AccomplishmentsTimelineProps) {
  const [data, setData] = useState<Array<{ date: string; accomplishments: string[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/journal/analytics/accomplishments?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setData(result.accomplishments || []);
        }
      } catch (error) {
        console.error('Failed to load accomplishments:', error);
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
        No accomplishments recorded. Add them in your daily notes!
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {data.map((day, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-primary/20 p-2">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            {index < data.length - 1 && (
              <div className="w-px h-full bg-border/50 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-foreground mb-1">
              {new Date(day.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="space-y-1">
              {day.accomplishments.map((item, i) => (
                <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
