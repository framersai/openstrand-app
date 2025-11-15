'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  dateRange: { from: Date; to: Date };
}

interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function ActivityHeatmap({ dateRange }: ActivityHeatmapProps) {
  const t = useTranslations('history.activity');
  const [data, setData] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate mock data for last 365 days
        const mockData: DayActivity[] = [];
        const today = new Date();
        
        for (let i = 364; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const count = Math.floor(Math.random() * 10);
          const level = count === 0 ? 0 : count < 3 ? 1 : count < 5 ? 2 : count < 7 ? 3 : 4;
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            count,
            level: level as 0 | 1 | 2 | 3 | 4,
          });
        }
        
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [dateRange]);

  const getActivityColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-muted';
      case 1:
        return 'bg-green-200 dark:bg-green-900';
      case 2:
        return 'bg-green-300 dark:bg-green-800';
      case 3:
        return 'bg-green-400 dark:bg-green-700';
      case 4:
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Group by weeks
  const weeks: DayActivity[][] = [];
  let currentWeek: DayActivity[] = [];
  
  data.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer',
                    getActivityColor(day.level)
                  )}
                  title={`${day.date}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('less')}</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
        </div>
        <span>{t('more')}</span>
      </div>
    </div>
  );
}

