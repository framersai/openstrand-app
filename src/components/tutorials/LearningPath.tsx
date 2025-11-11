'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  Trophy,
  ChevronRight,
  Play,
  Book,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Tutorial item in a learning path
 */
export interface PathTutorial {
  /** Unique identifier */
  id: string;
  /** Tutorial title */
  title: string;
  /** Brief description */
  description: string;
  /** Link to tutorial */
  href: string;
  /** Estimated duration in minutes */
  duration: number;
  /** Whether user has completed this */
  completed?: boolean;
  /** Whether this tutorial is currently available */
  locked?: boolean;
  /** Prerequisites (other tutorial IDs) */
  prerequisites?: string[];
  /** Optional icon */
  icon?: LucideIcon;
}

/**
 * Learning path definition
 */
export interface LearningPathData {
  /** Unique identifier */
  id: string;
  /** Path title */
  title: string;
  /** Path description */
  description: string;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated total duration in minutes */
  totalDuration: number;
  /** Tutorials in this path */
  tutorials: PathTutorial[];
  /** Optional completion badge */
  badge?: {
    title: string;
    icon?: LucideIcon;
  };
}

interface LearningPathProps {
  /** Learning path data */
  path: LearningPathData;
  /** User's completed tutorial IDs */
  completedTutorials?: string[];
  /** Callback when tutorial is started */
  onStartTutorial?: (tutorialId: string) => void;
  /** Callback when tutorial is completed */
  onCompleteTutorial?: (tutorialId: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

/**
 * LearningPath
 * 
 * A structured learning path component that guides users through
 * a sequence of tutorials with progress tracking and prerequisites.
 * 
 * Features:
 * - Visual progress indication
 * - Prerequisites and unlocking logic
 * - Time estimates
 * - Completion tracking
 * - Achievement badges
 * - Accessible (ARIA labels, keyboard navigation)
 * - Dark mode compatible
 * - Responsive design
 * 
 * @example
 * ```tsx
 * const gettingStartedPath: LearningPathData = {
 *   id: 'getting-started',
 *   title: 'Getting Started with OpenStrand',
 *   description: 'Learn the basics in 30 minutes',
 *   difficulty: 'beginner',
 *   totalDuration: 30,
 *   tutorials: [
 *     {
 *       id: 'intro',
 *       title: 'Introduction',
 *       description: 'Overview of OpenStrand',
 *       href: '/tutorials/intro',
 *       duration: 5,
 *     },
 *     // ...more tutorials
 *   ],
 *   badge: {
 *     title: 'OpenStrand Beginner',
 *   },
 * };
 * 
 * <LearningPath
 *   path={gettingStartedPath}
 *   completedTutorials={['intro', 'setup']}
 * />
 * ```
 */
export function LearningPath({
  path,
  completedTutorials = [],
  onStartTutorial: _onStartTutorial,
  onCompleteTutorial,
  className,
  compact = false,
}: LearningPathProps) {
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);

  /**
   * Calculate completion progress
   */
  const completedCount = path.tutorials.filter((t) =>
    completedTutorials.includes(t.id)
  ).length;
  const progress = (completedCount / path.tutorials.length) * 100;
  const isPathCompleted = completedCount === path.tutorials.length;

  /**
   * Check if a tutorial is unlocked based on prerequisites
   */
  const isTutorialUnlocked = (tutorial: PathTutorial): boolean => {
    if (tutorial.locked) return false;
    if (!tutorial.prerequisites || tutorial.prerequisites.length === 0) return true;
    return tutorial.prerequisites.every((prereqId) =>
      completedTutorials.includes(prereqId)
    );
  };

  /**
   * Get difficulty badge variant
   */
  const getDifficultyVariant = () => {
    switch (path.difficulty) {
      case 'beginner':
        return 'default';
      case 'intermediate':
        return 'secondary';
      case 'advanced':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={compact ? 'p-4' : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className={compact ? 'text-lg' : 'text-xl'}>
              {path.title}
            </CardTitle>
            <CardDescription>{path.description}</CardDescription>
          </div>
          <Badge variant={getDifficultyVariant()} className="shrink-0">
            {path.difficulty}
          </Badge>
        </div>

        {/* Progress Overview */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {path.tutorials.length} completed
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Time estimate */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{path.totalDuration} minutes total</span>
            </div>
            {isPathCompleted && path.badge && (
              <div className="flex items-center gap-1.5 text-primary">
                <Trophy className="h-4 w-4" />
                <span className="font-medium">Badge earned!</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className={cn('p-0', compact && 'text-sm')}>
        {/* Tutorial List */}
        <div className="divide-y">
          {path.tutorials.map((tutorial, index) => {
            const isCompleted = completedTutorials.includes(tutorial.id);
            const isUnlocked = isTutorialUnlocked(tutorial);
            const isExpanded = expandedTutorial === tutorial.id;
            const Icon = tutorial.icon || Book;

            return (
              <div
                key={tutorial.id}
                className={cn(
                  'transition-colors',
                  isUnlocked && 'hover:bg-accent/50'
                )}
              >
                <button
                  className={cn(
                    'flex w-full items-start gap-4 p-4 text-left',
                    compact && 'p-3',
                    !isUnlocked && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => setExpandedTutorial(isExpanded ? null : tutorial.id)}
                  disabled={!isUnlocked}
                  aria-label={`${tutorial.title} - ${isCompleted ? 'Completed' : isUnlocked ? 'Available' : 'Locked'}`}
                  aria-expanded={isExpanded}
                >
                  {/* Status Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" aria-label="Completed" />
                    ) : isUnlocked ? (
                      <Circle className="h-6 w-6 text-muted-foreground" aria-label="Available" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" aria-label="Locked" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h4 className={cn(
                          'font-medium',
                          isCompleted && 'text-muted-foreground line-through'
                        )}>
                          {index + 1}. {tutorial.title}
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {tutorial.duration}min
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {tutorial.description}
                    </p>

                    {/* Prerequisites warning */}
                    {!isUnlocked && tutorial.prerequisites && (
                      <p className="text-xs text-muted-foreground italic">
                        Complete previous tutorials to unlock
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {isUnlocked && (
                    <ChevronRight className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  )}
                </button>

                {/* Expanded Actions */}
                {isExpanded && isUnlocked && (
                  <div className="border-t bg-muted/30 p-4 space-y-2">
                    <div className="flex gap-2">
                      <Button asChild className="flex-1" size={compact ? 'sm' : 'default'}>
                        <Link href={tutorial.href}>
                          <Play className="h-4 w-4 mr-2" />
                          {isCompleted ? 'Review Tutorial' : 'Start Tutorial'}
                        </Link>
                      </Button>
                      
                      {!isCompleted && onCompleteTutorial && (
                        <Button
                          variant="outline"
                          size={compact ? 'sm' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTutorial(tutorial.id);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Completion Badge */}
      {isPathCompleted && path.badge && (
        <>
          <Separator />
          <div className="bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {path.badge.icon ? (
                    <path.badge.icon className="h-5 w-5 text-primary" />
                  ) : (
                    <Trophy className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Congratulations!</p>
                  <p className="text-xs text-muted-foreground">
                    You've earned the {path.badge.title} badge
                  </p>
                </div>
              </div>
              <Trophy className="h-8 w-8 text-primary/20" />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * LearningPathGrid
 * 
 * Display multiple learning paths in a grid layout
 */
interface LearningPathGridProps {
  paths: LearningPathData[];
  completedTutorials?: string[];
  onStartTutorial?: (tutorialId: string) => void;
  onCompleteTutorial?: (tutorialId: string) => void;
  className?: string;
}

export function LearningPathGrid({
  paths,
  completedTutorials,
  onStartTutorial,
  onCompleteTutorial,
  className,
}: LearningPathGridProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {paths.map((path) => (
        <LearningPath
          key={path.id}
          path={path}
          completedTutorials={completedTutorials}
          onStartTutorial={onStartTutorial}
          onCompleteTutorial={onCompleteTutorial}
        />
      ))}
    </div>
  );
}

