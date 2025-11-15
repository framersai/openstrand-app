'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Inbox, Archive, Link, FileText, Image, Mic, File, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabase } from '@/features/auth';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface QuickCaptureEntry {
  id: string;
  payloadType: 'text' | 'link' | 'image' | 'audio' | 'file';
  title?: string;
  description?: string;
  status: 'pending' | 'linked' | 'archived';
  created: string;
  tags: string[];
  payload: any;
}

const typeIcons = {
  text: FileText,
  link: Link,
  image: Image,
  audio: Mic,
  file: File,
};

export default function InboxPage() {
  const t = useTranslations('inbox');
  const { user } = useSupabase();
  const [entries, setEntries] = useState<QuickCaptureEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'linked' | 'archived'>('pending');

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from API
      // const data = await openstrandAPI.quickCapture.list({ status: filter === 'all' ? undefined : filter });
      // Placeholder data for now
      setEntries([
        {
          id: '1',
          payloadType: 'text',
          title: 'Meeting notes',
          description: 'Discussion about Q1 roadmap',
          status: 'pending',
          created: new Date().toISOString(),
          tags: ['work', 'planning'],
          payload: { text: 'Q1 priorities: 1) User analytics 2) Performance improvements...' }
        },
        {
          id: '2',
          payloadType: 'link',
          title: 'Interesting article',
          status: 'pending',
          created: new Date(Date.now() - 3600000).toISOString(),
          tags: ['research'],
          payload: { url: 'https://example.com/article' }
        },
      ]);
    } catch (error) {
      toast.error('Failed to load inbox items');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      // TODO: Update via API
      toast.success('Item archived');
      fetchEntries();
    } catch (error) {
      toast.error('Failed to archive item');
    }
  };

  const handleLink = (id: string) => {
    // TODO: Open modal to link to strand
    toast('Link to strand feature coming soon!');
  };

  const filteredEntries = entries.filter(entry => 
    filter === 'all' || entry.status === filter
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-full bg-primary/10">
          <Inbox className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">{t('filters.pending')}</TabsTrigger>
          <TabsTrigger value="linked">{t('filters.linked')}</TabsTrigger>
          <TabsTrigger value="archived">{t('filters.archived')}</TabsTrigger>
          <TabsTrigger value="all">{t('filters.all')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {t('loading')}
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {t('empty')}
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => {
            const Icon = typeIcons[entry.payloadType];

            return (
              <Card
                key={entry.id}
                className="transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {entry.title && (
                            <h3 className="font-semibold mb-1">{entry.title}</h3>
                          )}
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                        <Badge variant={entry.status === 'pending' ? 'default' : 'secondary'}>
                          {t(`status.${entry.status}`)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(entry.created), 'MMM d, h:mm a')}
                        </div>
                        {entry.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {entry.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => handleLink(entry.id)}>
                            {t('actions.linkToStrand')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchive(entry.id)}
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            {t('actions.archive')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
