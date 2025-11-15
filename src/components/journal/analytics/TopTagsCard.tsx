'use client';

/**
 * @module TopTagsCard
 * @description Card showing most frequently used journal tags
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';

interface TopTagsCardProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function TopTagsCard({ dateRange }: TopTagsCardProps) {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
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
          const tagCounts: Record<string, number> = {};
          
          result.notes?.forEach((note: any) => {
            note.tags?.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          });

          const sorted = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          setTags(sorted);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
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
          <Tag className="h-4 w-4 text-primary" />
          Top Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : tags.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No tags used yet
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((item, index) => (
              <div key={item.tag} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs w-6 justify-center">
                    {index + 1}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">#{item.tag}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.count}×</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
