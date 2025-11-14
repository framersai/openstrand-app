/**
 * GitHub Stats Component
 * Displays repository stars and forks in a minimal, themed style
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, GitFork } from '@/components/icons';

interface GitHubStatsProps {
  className?: string;
  variant?: 'compact' | 'default';
  showLabels?: boolean;
}

interface GitHubData {
  stars: number;
  forks: number;
}

const GITHUB_REPO = 'framersai/openstrand';
const CACHE_KEY = 'openstrand-github-stats';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const OFFLINE_MODE = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
  : false;

export function GitHubStats({ 
  className,
  variant = 'default',
  showLabels = false 
}: GitHubStatsProps) {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (OFFLINE_MODE) {
      setData({ stars: 0, forks: 0 });
      setLoading(false);
      return;
    }

    const fetchGitHubStats = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Fetch from GitHub API
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
        if (!response.ok) {
          // Do not show fake numbers; fall back to zeros or cached
          throw new Error(`Failed to fetch (${response.status})`);
        }

        const repo = await response.json();
        const newData = {
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0
        };

        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newData,
          timestamp: Date.now()
        }));

        setData(newData);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[github] stats unavailable:', error);
        }
        // Fallback to cached data if available
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
        } else {
          setData({ stars: 0, forks: 0 });
        }
      } finally {
        setLoading(false);
      }
    };

    // Defer the fetch to an idle callback to avoid competing with critical work
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const win: any = typeof window !== 'undefined' ? window : undefined;
    const requestIdle = win?.requestIdleCallback
      ? (cb: () => void) => (idleId = win.requestIdleCallback(cb))
      : (cb: () => void) => (timeoutId = window.setTimeout(cb, 0));
    const cancelIdle = () => {
      if (idleId != null && win?.cancelIdleCallback) {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    };

    requestIdle(fetchGitHubStats);
    return () => cancelIdle();
  }, []);

  if (loading || !data) {
    return (
      <div className={cn(
        'github-stats animate-pulse',
        variant === 'compact' ? 'flex gap-3' : 'flex flex-col gap-1',
        className
      )}>
        <div className="h-5 w-12 rounded bg-muted" />
        <div className="h-5 w-12 rounded bg-muted" />
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (variant === 'compact') {
    return (
      <a
        href={`https://github.com/${GITHUB_REPO}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'github-stats-compact inline-flex items-center gap-3 rounded-full',
          'px-3 py-1 text-xs font-medium transition-all',
          'border border-border/60 bg-background/60 hover:bg-primary/5',
          'hover:border-primary/40 hover:shadow-sm',
          className
        )}
      >
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>{formatNumber(data.stars)}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          <span>{formatNumber(data.forks)}</span>
        </span>
      </a>
    );
  }

  return (
    <div className={cn(
      'github-stats flex items-center gap-4',
      className
    )}>
      <a
        href={`https://github.com/${GITHUB_REPO}/stargazers`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group flex items-center gap-2 rounded-lg',
          'px-3 py-2 text-sm transition-all',
          'border border-border/60 bg-background/80',
          'hover:border-primary/40 hover:bg-primary/5'
        )}
      >
        <Star className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
        <span className="font-semibold">{formatNumber(data.stars)}</span>
        {showLabels && <span className="text-muted-foreground">stars</span>}
      </a>
      
      <a
        href={`https://github.com/${GITHUB_REPO}/network/members`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group flex items-center gap-2 rounded-lg',
          'px-3 py-2 text-sm transition-all',
          'border border-border/60 bg-background/80',
          'hover:border-primary/40 hover:bg-primary/5'
        )}
      >
        <GitFork className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
        <span className="font-semibold">{formatNumber(data.forks)}</span>
        {showLabels && <span className="text-muted-foreground">forks</span>}
      </a>
    </div>
  );
}



