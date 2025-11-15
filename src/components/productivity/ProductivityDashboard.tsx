'use client';

/**
 * @module ProductivityDashboard
 * @description Comprehensive productivity analytics dashboard
 * 
 * Features:
 * - Streak heatmap (GitHub-style)
 * - Daily/weekly/monthly statistics
 * - Study time charts
 * - Insights and achievements
 * - Goals tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Brain, 
  Zap, 
  Award, 
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface DashboardMetrics {
  streaks: {
    current: number;
    longest: number;
    lastActive: Date | null;
  };
  today: {
    pomodoroSessions: number;
    studyMinutes: number;
    flashcardsReviewed: number;
    quizzesTaken: number;
    strandsViewed: number;
    strandsCreated: number;
  };
  thisWeek: {
    pomodoroSessions: number;
    studyMinutes: number;
    flashcardsReviewed: number;
    quizzesTaken: number;
    dailyActivity: Array<{
      date: string;
      pomodoroSessions: number;
      studyMinutes: number;
      active: boolean;
    }>;
  };
  allTime: {
    totalPomodoroSessions: number;
    totalStudyMinutes: number;
    totalFlashcardsReviewed: number;
    totalQuizzesTaken: number;
    totalStrandsCreated: number;
  };
  averages: {
    dailyMinutes: number;
    dailyPomodoros: number;
    quizScore: number;
    flashcardAccuracy: number;
  };
  goals: {
    dailyMinutesGoal: number;
    dailyMinutesProgress: number;
    weeklySessionsGoal: number;
    weeklySessionsProgress: number;
  };
}

interface StreakDay {
  date: string;
  active: boolean;
  pomodoroCount: number;
  studyMinutes: number;
  activities: string[];
}

interface Insight {
  type: 'achievement' | 'recommendation' | 'trend';
  title: string;
  description: string;
  icon?: string;
}

export function ProductivityDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [streakHistory, setStreakHistory] = useState<StreakDay[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [metricsRes, streakRes, insightsRes] = await Promise.all([
        fetch('/api/v1/analytics/dashboard', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/v1/analytics/streaks/history?days=365', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/v1/analytics/insights', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }

      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreakHistory(data.data);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.data.insights);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (minutes: number): string => {
    if (minutes === 0) return 'bg-muted';
    if (minutes < 15) return 'bg-green-200 dark:bg-green-900';
    if (minutes < 30) return 'bg-green-300 dark:bg-green-800';
    if (minutes < 60) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-600';
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productivity Dashboard</h1>
          <p className="text-muted-foreground">Track your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            {metrics.streaks.current} day streak
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          title="Current Streak"
          value={metrics.streaks.current}
          subtitle={`Longest: ${metrics.streaks.longest} days`}
          color="text-orange-500"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          title="Today's Study Time"
          value={`${metrics.today.studyMinutes}m`}
          subtitle={`Avg: ${Math.round(metrics.averages.dailyMinutes)}m/day`}
          color="text-blue-500"
        />
        <StatsCard
          icon={<Brain className="h-5 w-5" />}
          title="Flashcards Reviewed"
          value={metrics.today.flashcardsReviewed}
          subtitle={`${metrics.allTime.totalFlashcardsReviewed} all-time`}
          color="text-purple-500"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Pomodoro Sessions"
          value={metrics.today.pomodoroSessions}
          subtitle={`${metrics.thisWeek.pomodoroSessions} this week`}
          color="text-green-500"
        />
      </div>

      {/* Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Study Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{metrics.goals.dailyMinutesProgress} / {metrics.goals.dailyMinutesGoal} minutes</span>
              <span className="font-semibold">
                {Math.round((metrics.goals.dailyMinutesProgress / metrics.goals.dailyMinutesGoal) * 100)}%
              </span>
            </div>
            <Progress 
              value={(metrics.goals.dailyMinutesProgress / metrics.goals.dailyMinutesGoal) * 100} 
              className="h-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Sessions Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{metrics.goals.weeklySessionsProgress} / {metrics.goals.weeklySessionsGoal} sessions</span>
              <span className="font-semibold">
                {Math.round((metrics.goals.weeklySessionsProgress / metrics.goals.weeklySessionsGoal) * 100)}%
              </span>
            </div>
            <Progress 
              value={(metrics.goals.weeklySessionsProgress / metrics.goals.weeklySessionsGoal) * 100} 
              className="h-3"
            />
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Weeks */}
            <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1">
              {streakHistory.slice(-365).map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors",
                    getActivityColor(day.studyMinutes)
                  )}
                  title={`${day.date}: ${day.studyMinutes}m`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Insights & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border",
                    insight.type === 'achievement' && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                    insight.type === 'recommendation' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                    insight.type === 'trend' && "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
                  )}
                >
                  <div className="font-semibold">{insight.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Stats Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Study Time:</span>
                  <span className="font-semibold">{metrics.thisWeek.studyMinutes}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-semibold">{metrics.thisWeek.pomodoroSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flashcards:</span>
                  <span className="font-semibold">{metrics.thisWeek.flashcardsReviewed}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-semibold">
                    {Math.round(metrics.allTime.totalStudyMinutes / 60)}h
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-semibold">{metrics.allTime.totalPomodoroSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quizzes:</span>
                  <span className="font-semibold">{metrics.allTime.totalQuizzesTaken}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Averages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Minutes:</span>
                  <span className="font-semibold">{Math.round(metrics.averages.dailyMinutes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quiz Score:</span>
                  <span className="font-semibold">{Math.round(metrics.averages.quizScore)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flashcard Rate:</span>
                  <span className="font-semibold">
                    {Math.round(metrics.averages.flashcardAccuracy)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pomodoro">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoro Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Detailed Pomodoro stats coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Detailed learning stats coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
          <div className={cn("p-3 rounded-lg bg-muted", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

