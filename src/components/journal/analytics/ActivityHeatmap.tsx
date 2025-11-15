'use client';

/**
 * @module ActivityHeatmap
 * @description Calendar heatmap showing daily journal activity
 */

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ActivityHeatmap({ dateRange }: ActivityHeatmapProps) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/journal/daily-notes?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const activityMap: Record<string, number> = {};
          
          result.notes?.forEach((note: any) => {
            const date = new Date(note.noteDate).toISOString().split('T')[0];
            activityMap[date] = (activityMap[date] || 0) + 1;
          });

          setData(activityMap);
        }
      } catch (error) {
        console.error('Failed to load activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [dateRange]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // Generate calendar grid
  const days: Array<{ date: string; count: number }> = [];
  const current = new Date(dateRange.from);
  
  while (current <= dateRange.to) {
    const dateStr = current.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: data[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: level === 0 ? '#e5e7eb' : `rgba(99, 102, 241, ${0.2 + level * 0.2})`,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(12px, 1fr))' }}>
        {days.map((day) => {
          const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);
          return (
            <div
              key={day.date}
              className="w-3 h-3 rounded-sm cursor-pointer hover:ring-1 hover:ring-primary transition-all"
              style={{
                backgroundColor: intensity === 0 ? '#e5e7eb' : `rgba(99, 102, 241, ${0.2 + intensity * 0.2})`,
              }}
              title={`${day.date}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
