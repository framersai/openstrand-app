'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface TopTagsCloudProps {
  dateRange: { from: Date; to: Date };
}

interface TagData {
  tag: string;
  count: number;
}

export function TopTagsCloud({ dateRange }: TopTagsCloudProps) {
  const t = useTranslations('history.overview');
  const [data, setData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setData([
          { tag: 'machine-learning', count: 24 },
          { tag: 'typescript', count: 18 },
          { tag: 'architecture', count: 15 },
          { tag: 'productivity', count: 12 },
          { tag: 'learning', count: 10 },
          { tag: 'notes', count: 8 },
          { tag: 'ideas', count: 6 },
          { tag: 'research', count: 5 },
        ]);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [dateRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('topTags')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(t => t.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('topTags')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((tag) => {
            const size = Math.max(0.8, (tag.count / maxCount) * 1.5);
            return (
              <Badge
                key={tag.tag}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                style={{ fontSize: `${size}rem` }}
              >
                {tag.tag} ({tag.count})
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

