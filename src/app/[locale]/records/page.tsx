'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodTrendsChart } from '@/components/journal/analytics/MoodTrendsChart';
import { ActivityHeatmap } from '@/components/journal/analytics/ActivityHeatmap';
import { AccomplishmentsTimeline } from '@/components/journal/analytics/AccomplishmentsTimeline';
import { TopTagsCard } from '@/components/journal/analytics/TopTagsCard';
import { MoodDistributionChart } from '@/components/journal/analytics/MoodDistributionChart';
import { KPICards } from '@/components/journal/analytics/KPICards';
import { Calendar, Download } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { subDays } from 'date-fns';

/**
 * Records & Analytics Page
 * 
 * Provides insights into journaling habits, mood trends, and accomplishments.
 * Features:
 * - KPI cards (streak, total entries, avg mood)
 * - Mood trends line chart
 * - Activity heatmap calendar
 * - Accomplishments timeline
 * - Top tags and mood distribution
 */
export default function RecordsPage() {
  const t = useTranslations('records');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Records & Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your journaling habits and mood patterns
          </p>
        </div>
        
        {/* Date Range & Export */}
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline" onClick={handleExport} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards dateRange={dateRange} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Mood Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodTrendsChart dateRange={dateRange} />
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap dateRange={dateRange} />
          </CardContent>
        </Card>

        {/* Accomplishments Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accomplishments Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <AccomplishmentsTimeline dateRange={dateRange} />
          </CardContent>
        </Card>

        {/* Bottom Row: Top Tags & Mood Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopTagsCard dateRange={dateRange} />
          <MoodDistributionChart dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
}

