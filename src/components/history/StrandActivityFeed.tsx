'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Edit, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrandActivityFeedProps {
  dateRange: { from: Date; to: Date };
  limit?: number;
}

interface ActivityEvent {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  strandTitle: string;
  timestamp: string;
}

export function StrandActivityFeed({ dateRange, limit = 20 }: StrandActivityFeedProps) {
  const t = useTranslations('history.activity');
  const [data, setData] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockData: ActivityEvent[] = [];
        const types: ActivityEvent['type'][] = ['created', 'updated', 'deleted'];
        
        for (let i = 0; i < limit; i++) {
          mockData.push({
            id: `event-${i}`,
            type: types[Math.floor(Math.random() * types.length)],
            strandTitle: `Strand ${i + 1}`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          });
        }
        
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [dateRange, limit]);

  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'created':
        return Plus;
      case 'updated':
        return Edit;
      case 'deleted':
        return Trash2;
    }
  };

  const getColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'created':
        return 'text-green-500 bg-green-500/10';
      case 'updated':
        return 'text-blue-500 bg-blue-500/10';
      case 'deleted':
        return 'text-red-500 bg-red-500/10';
    }
  };

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {data.map((event) => {
        const Icon = getIcon(event.type);
        return (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={cn('p-2 rounded-lg', getColor(event.type))}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{t(event.type)}</span>{' '}
                <span className="text-muted-foreground">{event.strandTitle}</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

