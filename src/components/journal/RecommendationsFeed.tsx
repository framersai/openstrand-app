'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lightbulb, Users, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'team' | 'personal' | 'system';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export function RecommendationsFeed() {
  const t = useTranslations('daily.recommendations');
  const [filter, setFilter] = useState<'all' | 'team' | 'personal' | 'system'>('all');

  // Fetch notifications and recommendations
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      // In production, this would fetch from the API
      // For now, return mock data
      return [
        {
          id: '1',
          type: 'team',
          icon: '💬',
          title: 'New comment on "Project Alpha"',
          description: 'Sarah commented on your strand',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          link: '/strands/project-alpha',
        },
        {
          id: '2',
          type: 'personal',
          icon: '📚',
          title: 'Review: Machine Learning Basics',
          description: 'Due for spaced repetition review',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          link: '/strands/ml-basics',
        },
        {
          id: '3',
          type: 'personal',
          icon: '💡',
          title: 'Recommended: Deep Learning',
          description: 'Based on your recent activity',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          link: '/strands/deep-learning',
        },
        {
          id: '4',
          type: 'system',
          icon: '🔔',
          title: 'Daily streak: 7 days!',
          description: "Keep up the great work!",
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
        {
          id: '5',
          type: 'team',
          icon: '👥',
          title: 'Team meeting notes updated',
          description: 'New action items added',
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          link: '/teams/meeting-notes',
        },
      ].filter((n) => filter === 'all' || n.type === filter);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return t('timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('timeAgo.hours', { count: diffHours });
    return t('timeAgo.days', { count: diffDays });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'team':
        return 'bg-blue-500/10 text-blue-500';
      case 'personal':
        return 'bg-green-500/10 text-green-500';
      case 'system':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">{t('filters.all')}</TabsTrigger>
            <TabsTrigger value="team">{t('filters.team')}</TabsTrigger>
            <TabsTrigger value="personal">{t('filters.personal')}</TabsTrigger>
            <TabsTrigger value="system">{t('filters.system')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                if (notification.link) {
                  window.location.href = notification.link;
                }
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{notification.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(notification.type)}`}>
                      {t(`types.${notification.type}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('noNotifications')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

