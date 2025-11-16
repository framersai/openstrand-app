/**
 * Voice Quota Monitor
 * 
 * Background monitor for voice quota usage.
 * Shows proactive warnings and haptic feedback when approaching limits.
 * 
 * Features:
 * - Real-time quota tracking
 * - Toast notifications at 50%, 80%, 90%, 100%
 * - Haptic feedback on warnings
 * - Persistent indicator when near limit
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Volume2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';

export interface VoiceQuotaStatus {
  used: {
    ttsMinutes: number;
    sttMinutes: number;
    totalMinutes: number;
  };
  limits: {
    ttsMinutesPerDay: number | null;
    sttMinutesPerDay: number | null;
    totalMinutesPerDay: number | null;
  };
  percentUsed: number;
  hasCustomQuota: boolean;
}

export function VoiceQuotaMonitor() {
  const [quotaStatus, setQuotaStatus] = useState<VoiceQuotaStatus | null>(null);
  const [shownWarnings, setShownWarnings] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    checkQuota();

    // Poll every 60 seconds
    const interval = setInterval(checkQuota, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!quotaStatus) return;

    const { percentUsed } = quotaStatus;

    // Show warnings at thresholds
    const thresholds = [50, 80, 90, 100];

    for (const threshold of thresholds) {
      if (percentUsed >= threshold && !shownWarnings.has(threshold)) {
        showWarning(threshold);
        setShownWarnings((prev) => new Set(prev).add(threshold));
      }
    }
  }, [quotaStatus, shownWarnings]);

  const checkQuota = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/quota/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQuotaStatus(data);
      }
    } catch (error) {
      console.error('Failed to check quota:', error);
    }
  };

  const showWarning = (threshold: number) => {
    const messages = {
      50: {
        title: 'Voice quota: 50% used',
        description: 'You\'ve used half of your daily voice minutes',
        variant: 'default' as const,
        haptic: 'soft' as const,
      },
      80: {
        title: 'Voice quota: 80% used',
        description: 'Running low on voice minutes. Consider upgrading.',
        variant: 'default' as const,
        haptic: 'warning' as const,
      },
      90: {
        title: 'Voice quota: 90% used',
        description: 'Almost at your daily limit!',
        variant: 'destructive' as const,
        haptic: 'warning' as const,
      },
      100: {
        title: 'Voice quota exceeded',
        description: 'Daily voice limit reached. Upgrade or wait until tomorrow.',
        variant: 'destructive' as const,
        haptic: 'error' as const,
      },
    };

    const msg = messages[threshold as keyof typeof messages];

    // Haptic feedback
    if (haptic.canVibrate()) {
      haptic[msg.haptic]();
    }

    // Toast notification
    toast({
      title: msg.title,
      description: msg.description,
      variant: msg.variant,
      duration: threshold >= 90 ? 10000 : 5000,
    });
  };

  // Show persistent indicator when >80%
  if (!quotaStatus || quotaStatus.percentUsed < 80) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 right-4 w-80 shadow-lg z-40 border-destructive/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Voice Quota</span>
          </div>
          <Badge variant="destructive">{Math.round(quotaStatus.percentUsed)}%</Badge>
        </div>

        <Progress value={quotaStatus.percentUsed} className="h-2" />

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>TTS used:</span>
            <span>
              {quotaStatus.used.ttsMinutes.toFixed(1)} / {quotaStatus.limits.ttsMinutesPerDay || '∞'} min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>STT used:</span>
            <span>
              {quotaStatus.used.sttMinutes.toFixed(1)} / {quotaStatus.limits.sttMinutesPerDay || '∞'} min
            </span>
          </div>
        </div>

        {quotaStatus.percentUsed >= 100 && (
          <div className="text-xs text-center text-destructive font-medium pt-2 border-t">
            Daily limit reached. Resets at midnight.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

