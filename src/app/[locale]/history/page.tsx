'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, History as HistoryIcon, BookOpen, Award, Activity } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { subDays } from 'date-fns';
import { MoodTrendsChart } from '@/components/history/MoodTrendsChart';
import { ActivityHeatmap } from '@/components/history/ActivityHeatmap';
import { AccomplishmentsTimeline } from '@/components/history/AccomplishmentsTimeline';
import { VersionHistoryList } from '@/components/history/VersionHistoryList';
import { TopTagsCloud } from '@/components/history/TopTagsCloud';
import { MoodDistribution } from '@/components/history/MoodDistribution';
import { KPICards } from '@/components/history/KPICards';
import { StrandActivityFeed } from '@/components/history/StrandActivityFeed';

/**
 * History & Analytics Page
 * 
 * Comprehensive view of user's entire OpenStrand journey:
 * - Version history for all strands
 * - Daily journal mood trends
 * - Activity heatmap (GitHub-style)
 * - Accomplishments timeline
 * - Strand creation/edit history
 * - Tag usage analytics
 * - KPIs (streaks, total entries, avg mood)
 */
export default function HistoryPage() {
  const t = useTranslations('history');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <HistoryIcon className="h-10 w-10 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        {/* Date Range Picker */}
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* KPI Cards */}
      <KPICards dateRange={dateRange} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('tabs.journal')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('tabs.activity')}
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            {t('tabs.versions')}
          </TabsTrigger>
          <TabsTrigger value="accomplishments" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            {t('tabs.accomplishments')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('overview.activityHeatmap')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap dateRange={dateRange} />
            </CardContent>
          </Card>

          {/* Strand Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>{t('overview.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StrandActivityFeed dateRange={dateRange} limit={20} />
            </CardContent>
          </Card>

          {/* Tag Cloud & Mood Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopTagsCloud dateRange={dateRange} />
            <MoodDistribution dateRange={dateRange} />
          </div>
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="space-y-6">
          {/* Mood Trends */}
          <Card>
            <CardHeader>
              <CardTitle>{t('journal.moodTrends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodTrendsChart dateRange={dateRange} />
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <MoodDistribution dateRange={dateRange} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>{t('activity.heatmap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap dateRange={dateRange} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>{t('activity.feed')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StrandActivityFeed dateRange={dateRange} limit={50} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('versions.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('versions.description')}
              </p>
            </CardHeader>
            <CardContent>
              <VersionHistoryList dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accomplishments Tab */}
        <TabsContent value="accomplishments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('accomplishments.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AccomplishmentsTimeline dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

