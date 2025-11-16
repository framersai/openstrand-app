'use client';

/**
 * @module BadgeShowcase
 * @description User badge display with unlock progress
 * 
 * Features:
 * - Grid of earned and available badges
 * - Rarity-based styling (common to legendary)
 * - Progress bars for progressive badges
 * - Toggle visibility of earned badges
 * - Tooltips with unlock criteria
 */

import React, { useState, useEffect } from 'react';
import { Award, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BadgeData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  assetType: 'svg' | 'png' | 'gif';
  assetUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  isVisible?: boolean;
  criteria: Record<string, any>;
}

interface BadgeShowcaseProps {
  userId?: string;
  teamId?: string;
  className?: string;
}

const RARITY_STYLES = {
  common: 'border-gray-400 bg-gray-50 dark:bg-gray-900',
  uncommon: 'border-green-400 bg-green-50 dark:bg-green-950',
  rare: 'border-blue-400 bg-blue-50 dark:bg-blue-950',
  epic: 'border-purple-400 bg-purple-50 dark:bg-purple-950',
  legendary: 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950',
};

const RARITY_GLOW = {
  common: '',
  uncommon: 'shadow-green-200',
  rare: 'shadow-blue-200',
  epic: 'shadow-purple-200',
  legendary: 'shadow-amber-300 shadow-lg animate-pulse',
};

export function BadgeShowcase({ userId, teamId, className }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId, teamId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (teamId) params.append('teamId', teamId);

      const response = await fetch(`/api/v1/badges?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data.data);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (badgeId: string) => {
    try {
      const response = await fetch(`/api/v1/badges/${badgeId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await loadBadges();
      }
    } catch (error) {
      console.error('Failed to toggle badge visibility:', error);
    }
  };

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  });

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalPoints = badges
    .filter((b) => b.earned)
    .reduce((sum, b) => sum + b.points, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Badges & Achievements
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {earnedCount} earned • {totalPoints} points
            </p>
          </div>

          {/* Filter */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'earned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('earned')}
            >
              Earned
            </Button>
            <Button
              variant={filter === 'locked' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('locked')}
            >
              Locked
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading badges...</p>
        ) : filteredBadges.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No badges to display
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBadges.map((badge) => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'relative aspect-square rounded-lg border-2 p-3 transition-all hover:scale-105',
                        RARITY_STYLES[badge.rarity],
                        badge.earned && RARITY_GLOW[badge.rarity],
                        !badge.earned && 'opacity-40 grayscale'
                      )}
                    >
                      {/* Badge Asset */}
                      <div className="flex items-center justify-center h-full">
                        {badge.assetType === 'svg' ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: badge.assetUrl }}
                            className="w-full h-full"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={badge.assetUrl}
                            alt={badge.name}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>

                      {/* Locked Overlay */}
                      {!badge.earned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <Lock className="h-8 w-8 text-white/80" />
                        </div>
                      )}

                      {/* Rarity Badge */}
                      {badge.earned && badge.rarity !== 'common' && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 right-1 text-[10px] px-1.5 py-0"
                        >
                          <Sparkles className="h-2 w-2 mr-1" />
                          {badge.rarity}
                        </Badge>
                      )}

                      {/* Visibility Toggle */}
                      {badge.earned && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-1 right-1 h-6 w-6"
                          onClick={() => handleToggleVisibility(badge.id)}
                        >
                          {badge.isVisible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                      )}

                      {/* Progress Bar (for progressive badges) */}
                      {!badge.earned && badge.progress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <Progress value={badge.progress * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      )}
                      {badge.earned ? (
                        <p className="text-xs text-green-600">
                          ✓ Earned {badge.earnedAt && `on ${new Date(badge.earnedAt).toLocaleDateString()}`}
                        </p>
                      ) : (
                        <div className="text-xs">
                          <p className="text-muted-foreground">How to unlock:</p>
                          <p className="mt-1">
                            {JSON.stringify(badge.criteria).replace(/[{}]/g, '').replace(/:/g, ': ').replace(/,/g, ', ')}
                          </p>
                        </div>
                      )}
                      <p className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          +{badge.points} pts
                        </Badge>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

