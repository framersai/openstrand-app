/**
 * Heat Map Drill-Down Panel
 * 
 * Interactive productivity heatmap with detailed day view.
 * Hover over any day → side panel shows:
 * - Sessions completed
 * - Mistakes made
 * - Time spent
 * - Notes/reflections
 * - Trend comparison (vs previous day/week)
 * 
 * @example
 * ```tsx
 * <HeatMapDrillDown
 *   data={streakHistory}
 *   onDayClick={(day) => console.log(day)}
 * />
 * ```
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Brain, 
  ClipboardCheck, 
  Timer,
  Target,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DayActivity {
  date: string;
  active: boolean;
  pomodoroCount: number;
  studyMinutes: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
  mistakes: number;
  activities: string[];
  notes?: string;
}

export interface HeatMapDrillDownProps {
  data: DayActivity[];
  onDayClick?: (day: DayActivity) => void;
}

export function HeatMapDrillDown({ data, onDayClick }: HeatMapDrillDownProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  const getIntensityColor = (minutes: number): string => {
    if (minutes === 0) return 'bg-muted';
    if (minutes < 15) return 'bg-green-200 dark:bg-green-900';
    if (minutes < 30) return 'bg-green-300 dark:bg-green-800';
    if (minutes < 60) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 5) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    return <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  const getPreviousDayData = (currentDate: string): DayActivity | null => {
    const currentIndex = data.findIndex((d) => d.date === currentDate);
    if (currentIndex > 0) {
      return data[currentIndex - 1];
    }
    return null;
  };

  const handleDayClick = (day: DayActivity) => {
    setSelectedDay(day);
    onDayClick?.(day);
  };

  // Group by weeks for calendar layout
  const weeks: DayActivity[][] = [];
  let week: DayActivity[] = [];
  
  data.forEach((day, index) => {
    week.push(day);
    if ((index + 1) % 7 === 0 || index === data.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  return (
    <div className="relative flex gap-4">
      {/* Heatmap */}
      <div className="flex-1 space-y-2">
        <div className="grid gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'h-10 w-10 rounded-sm cursor-pointer transition-all',
                    'hover:ring-2 hover:ring-primary hover:scale-110',
                    getIntensityColor(day.studyMinutes),
                    selectedDay?.date === day.date && 'ring-2 ring-primary scale-110'
                  )}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${day.date}: ${day.studyMinutes} min`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="h-3 w-3 bg-muted rounded-sm" />
          <div className="h-3 w-3 bg-green-200 dark:bg-green-900 rounded-sm" />
          <div className="h-3 w-3 bg-green-300 dark:bg-green-800 rounded-sm" />
          <div className="h-3 w-3 bg-green-400 dark:bg-green-700 rounded-sm" />
          <div className="h-3 w-3 bg-green-500 dark:bg-green-600 rounded-sm" />
          <span>More</span>
        </div>
      </div>

      {/* Drill-Down Panel */}
      {(selectedDay || hoveredDay) && (
        <Card className="w-80 shrink-0 shadow-lg border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                {new Date((selectedDay || hoveredDay)!.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardTitle>
              {selectedDay && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDay(null)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {(selectedDay || hoveredDay)!.active ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Study Time
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedDay || hoveredDay)!.studyMinutes}
                      <span className="text-sm text-muted-foreground ml-1">min</span>
                    </div>
                    {(() => {
                      const prev = getPreviousDayData((selectedDay || hoveredDay)!.date);
                      if (prev) {
                        return (
                          <div className="flex items-center gap-1 text-xs">
                            {getTrendIcon((selectedDay || hoveredDay)!.studyMinutes, prev.studyMinutes)}
                            <span>
                              {Math.abs((selectedDay || hoveredDay)!.studyMinutes - prev.studyMinutes)}min
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      Pomodoros
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedDay || hoveredDay)!.pomodoroCount}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Brain className="h-3 w-3" />
                      Flashcards
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedDay || hoveredDay)!.flashcardsReviewed}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ClipboardCheck className="h-3 w-3" />
                      Quizzes
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedDay || hoveredDay)!.quizzesTaken}
                    </div>
                  </div>
                </div>

                {/* Mistakes */}
                {(selectedDay || hoveredDay)!.mistakes > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">
                        {(selectedDay || hoveredDay)!.mistakes} mistakes to review
                      </span>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {(selectedDay || hoveredDay)!.activities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Activities</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedDay || hoveredDay)!.activities.map((activity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(selectedDay || hoveredDay)!.notes && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm text-foreground p-2 bg-muted rounded">
                      {(selectedDay || hoveredDay)!.notes}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No activity on this day</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

