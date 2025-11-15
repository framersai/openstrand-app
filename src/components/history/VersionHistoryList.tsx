'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, FileText, Palette, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionHistoryListProps {
  dateRange: { from: Date; to: Date };
}

interface VersionEntry {
  id: string;
  strandId: string;
  strandTitle: string;
  version: number;
  contentType: 'tiptap' | 'excalidraw';
  changeType: string;
  changeNote?: string;
  created: string;
  wordCount?: number;
}

export function VersionHistoryList({ dateRange }: VersionHistoryListProps) {
  const t = useTranslations('history.versions');
  const [data, setData] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call to fetch all user's version history
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setData([
          {
            id: '1',
            strandId: 'strand-1',
            strandTitle: 'Machine Learning Notes',
            version: 3,
            contentType: 'tiptap',
            changeType: 'updated',
            changeNote: 'Added neural network section',
            created: new Date().toISOString(),
            wordCount: 1250,
          },
          {
            id: '2',
            strandId: 'strand-2',
            strandTitle: 'System Architecture Diagram',
            version: 2,
            contentType: 'excalidraw',
            changeType: 'updated',
            changeNote: 'Refined component relationships',
            created: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch version history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
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
        {t('noVersions')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((version) => (
        <div
          key={version.id}
          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* Icon */}
          <div className={cn(
            'p-2 rounded-lg',
            version.contentType === 'tiptap' ? 'bg-blue-500/10' : 'bg-purple-500/10'
          )}>
            {version.contentType === 'tiptap' ? (
              <FileText className="h-5 w-5 text-blue-500" />
            ) : (
              <Palette className="h-5 w-5 text-purple-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{version.strandTitle}</h4>
              <Badge variant="outline" className="text-xs">
                v{version.version}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {version.contentType}
              </Badge>
            </div>
            {version.changeNote && (
              <p className="text-sm text-muted-foreground mb-2">{version.changeNote}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{new Date(version.created).toLocaleString()}</span>
              {version.wordCount && <span>{version.wordCount} words</span>}
            </div>
          </div>

          {/* Actions */}
          <Button variant="ghost" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('restore')}
          </Button>
        </div>
      ))}
    </div>
  );
}

