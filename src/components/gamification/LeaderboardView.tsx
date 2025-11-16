'use client';

/**
 * @module LeaderboardView
 * @description Team leaderboard with opt-in/opt-out controls
 * 
 * Features:
 * - Multiple categories (overall, flashcards, quizzes, pomodoro, streak)
 * - Period selection (weekly, monthly, all-time)
 * - Rank change indicators
 * - User opt-in/opt-out toggle
 * - Highlighted current user position
 */

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  userId: string;
  rank: number;
  previousRank?: number;
  rankChange: number;
  score: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
  pomodoroSessions: number;
  studyMinutes: number;
  currentStreak: number;
  user: {
    username: string;
    displayName: string | null;
  };
}

interface LeaderboardViewProps {
  teamId: string;
  currentUserId?: string;
  className?: string;
}

type Category = 'overall' | 'flashcards' | 'quizzes' | 'pomodoro' | 'streak';
type Period = 'weekly' | 'monthly' | 'all_time';

export function LeaderboardView({ teamId, currentUserId, className }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<Category>('overall');
  const [period, setPeriod] = useState<Period>('all_time');
  const [isOptedIn, setIsOptedIn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [teamId, category, period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/leaderboard/${teamId}?category=${category}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptInToggle = async (optIn: boolean) => {
    try {
      const endpoint = optIn ? '/api/v1/leaderboard/opt-in' : '/api/v1/leaderboard/opt-out';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ teamId }),
      });

      if (response.ok) {
        setIsOptedIn(optIn);
        await loadLeaderboard();
      }
    } catch (error) {
      console.error('Failed to update opt-in status:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Team Leaderboard
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compete with your teammates and track progress
            </p>
          </div>

          {/* Opt-in/Opt-out Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="opt-in" className="text-sm text-muted-foreground">
              Participate
            </Label>
            <Switch
              id="opt-in"
              checked={isOptedIn}
              onCheckedChange={handleOptInToggle}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall</SelectItem>
              <SelectItem value="flashcards">Flashcards</SelectItem>
              <SelectItem value="quizzes">Quizzes</SelectItem>
              <SelectItem value="pomodoro">Pomodoro</SelectItem>
              <SelectItem value="streak">Streak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No entries yet. {!isOptedIn && 'Enable participation to join the leaderboard!'}
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-muted/30',
                    index < 3 && 'bg-gradient-to-r from-accent/50 to-transparent'
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(entry.user.displayName || entry.user.username)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-semibold">
                      {entry.user.displayName || entry.user.username}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {category === 'overall' && (
                        <>
                          <span>{entry.flashcardsReviewed} cards</span>
                          <span>•</span>
                          <span>{entry.quizzesCompleted} quizzes</span>
                          <span>•</span>
                          <span>{entry.currentStreak} day streak</span>
                        </>
                      )}
                      {category === 'flashcards' && <span>{entry.flashcardsReviewed} reviewed</span>}
                      {category === 'quizzes' && <span>{entry.quizzesCompleted} completed</span>}
                      {category === 'pomodoro' && <span>{entry.pomodoroSessions} sessions</span>}
                      {category === 'streak' && <span>{entry.currentStreak} days</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-xl font-bold">{entry.score}</p>
                    {entry.rankChange !== 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        {getRankChangeIcon(entry.rankChange)}
                        <span>{Math.abs(entry.rankChange)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        {!isOptedIn && (
          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            You've opted out of leaderboards. Your activity is private.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

