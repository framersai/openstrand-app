'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccomplishmentsTimelineProps {
  dateRange: { from: Date; to: Date };
}

interface Accomplishment {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'goal' | 'milestone' | 'achievement';
}

export function AccomplishmentsTimeline({ dateRange }: AccomplishmentsTimelineProps) {
  const t = useTranslations('history.accomplishments');
  const [data, setData] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccomplishments = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setData([
          {
            id: '1',
            date: new Date().toISOString(),
            title: 'Completed Machine Learning Course',
            description: 'Finished all modules and passed final exam',
            type: 'milestone',
          },
          {
            id: '2',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            title: 'Created 10 Strands',
            description: 'Reached milestone of 10 knowledge strands',
            type: 'achievement',
          },
          {
            id: '3',
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            title: 'Daily Journaling Streak: 7 Days',
            type: 'goal',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch accomplishments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccomplishments();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('noAccomplishments')}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      {/* Timeline Items */}
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={item.id} className="relative pl-12">
            {/* Timeline Dot */}
            <div className={cn(
              'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
              item.type === 'milestone' && 'bg-purple-500/20 text-purple-500',
              item.type === 'achievement' && 'bg-yellow-500/20 text-yellow-500',
              item.type === 'goal' && 'bg-green-500/20 text-green-500'
            )}>
              {item.type === 'milestone' || item.type === 'achievement' ? (
                <Trophy className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

