import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { FeedbackButtons } from '../feedback-buttons';
import type { FeedbackSummary } from '@/types';

const baseSummary: FeedbackSummary = {
  targetId: 'dataset-1',
  likes: 1,
  dislikes: 0,
  favorites: 0,
  score: 1,
  userVote: 0,
  userFavorite: false,
};

describe('FeedbackButtons', () => {
  it('renders disabled state with tooltip message when disabledReason is provided', async () => {
    render(
      <FeedbackButtons summary={baseSummary} disabled disabledReason="Sign in required" />,
    );

    const thumbsUp = screen.getByRole('button', { name: /1/i });
    expect(thumbsUp).toBeDisabled();
  });

  it('invokes callbacks when voting and toggling favorite', async () => {
    const user = userEvent.setup();
    const handleVote = vi.fn();
    const handleFavorite = vi.fn();

    render(
      <FeedbackButtons
        summary={baseSummary}
        onVote={handleVote}
        onFavoriteChange={handleFavorite}
      />,
    );

    await user.click(screen.getByRole('button', { name: /1/i }));
    expect(handleVote).toHaveBeenCalledWith('up');

    await user.click(screen.getByRole('button', { name: /0/i }));
    expect(handleFavorite).toHaveBeenCalledWith(true);
  });
});
