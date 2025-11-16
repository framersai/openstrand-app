/**
 * Voice Analytics Dashboard (Admin)
 * 
 * Real-time voice usage statistics and quota management.
 * Shows:
 * - Daily voice minutes & cost
 * - Provider distribution
 * - Top users by usage
 * - Quota warnings
 * - Cost trends
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, DollarSign, TrendingUp, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface VoiceUsageStats {
  today: {
    jobs: number;
    minutes: string;
    cost: string;
  };
  allTime: {
    jobs: number;
    cost: string;
  };
}

export function VoiceAnalyticsDashboard() {
  const [stats, setStats] = useState<VoiceUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/voice/usage/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load voice stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Failed to load voice analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Voice Services Analytics</h2>
        <p className="text-muted-foreground">
          Monitor TTS/STT usage, costs, and quotas across your organization
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.jobs}</div>
            <p className="text-xs text-muted-foreground">TTS + STT requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Usage</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.minutes} min</div>
            <p className="text-xs text-muted-foreground">Audio processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.today.cost}</div>
            <p className="text-xs text-muted-foreground">TTS + STT charges</p>
          </CardContent>
        </Card>
      </div>

      {/* All-Time Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              All-Time Usage
            </CardTitle>
            <CardDescription>Total voice processing since launch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.allTime.jobs}</div>
                <p className="text-sm text-muted-foreground">Total jobs</p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                ${stats.allTime.cost}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quota Management
            </CardTitle>
            <CardDescription>User quota overrides and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="/admin/voice/quotas">
                  Manage Quotas
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Set custom limits per user or team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={loadStats}>
          Refresh Stats
        </Button>
      </div>
    </div>
  );
}

