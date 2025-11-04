'use client';

import { Heart, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FeedbackSummary } from '@/types';
import { cn } from '@/lib/utils';

type VoteType = 'up' | 'down' | null;

interface FeedbackButtonsProps {
  summary: FeedbackSummary | null;
  disabled?: boolean;
  onVote?: (vote: VoteType) => void;
  onFavoriteChange?: (favorite: boolean) => void;
  size?: 'sm' | 'md';
  disabledReason?: string;
  layout?: 'row' | 'stacked';
}

export function FeedbackButtons({
  summary,
  disabled = false,
  onVote,
  onFavoriteChange,
  size = 'md',
  disabledReason,
  layout = 'row',
}: FeedbackButtonsProps) {
  const likes = summary?.likes ?? 0;
  const dislikes = summary?.dislikes ?? 0;
  const favorites = summary?.favorites ?? 0;
  const userVote = summary?.userVote ?? 0;
  const isFavorite = summary?.userFavorite ?? false;

  const handleVote = (type: 'up' | 'down') => {
    if (disabled || !onVote) return;
    const next: VoteType =
      (type === 'up' && userVote === 1) || (type === 'down' && userVote === -1) ? null : type;
    onVote(next);
  };

  const handleFavorite = () => {
    if (disabled || !onFavoriteChange) return;
    onFavoriteChange(!isFavorite);
  };

  const content = (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border border-border/70 bg-card/60 p-2 text-xs',
        layout === 'stacked' && 'flex-col gap-3',
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            'flex items-center gap-1',
            userVote === 1 && 'text-primary',
            size === 'sm' && 'h-8 px-3',
          )}
          onClick={() => handleVote('up')}
          disabled={disabled}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{likes}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            'flex items-center gap-1',
            userVote === -1 && 'text-destructive',
            size === 'sm' && 'h-8 px-3',
          )}
          onClick={() => handleVote('down')}
          disabled={disabled}
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{dislikes}</span>
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={cn(
          'flex items-center gap-1',
          isFavorite && 'text-primary',
          size === 'sm' && 'h-8 px-3',
        )}
        onClick={handleFavorite}
        disabled={disabled || !onFavoriteChange}
      >
        <Heart className="h-4 w-4" />
        <span>{favorites}</span>
      </Button>
    </div>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
