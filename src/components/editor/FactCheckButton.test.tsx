/**
 * Fact-Check Button Tests
 * 
 * @module components/editor/FactCheckButton.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactCheckButton } from './FactCheckButton';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('FactCheckButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
    localStorage.setItem('auth_token', 'test-token');
  });

  it('should render button', () => {
    render(<FactCheckButton content="Test content" />);

    expect(screen.getByRole('button', { name: /fact-check/i })).toBeInTheDocument();
  });

  it('should be disabled when no content', () => {
    render(<FactCheckButton content="" />);

    const button = screen.getByRole('button', { name: /fact-check/i });
    expect(button).toBeDisabled();
  });

  it('should start fact-check on click', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PENDING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: 'job-123',
          status: 'COMPLETED',
          verdict: 'MATCH',
          confidence: 0.95,
        }),
      });

    const user = userEvent.setup();

    render(<FactCheckButton content="The sky is blue" />);

    const button = screen.getByRole('button', { name: /fact-check/i });
    await user.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/checking/i)).toBeInTheDocument();
    });

    // Should show result
    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should poll until job completes', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PENDING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PROCESSING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: 'job-123',
          status: 'COMPLETED',
          verdict: 'MATCH',
          confidence: 0.95,
        }),
      });

    const user = userEvent.setup();

    render(<FactCheckButton content="Test" />);

    await user.click(screen.getByRole('button', { name: /fact-check/i }));

    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should have polled 3 times (start + 2 status checks)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should show error toast on failure', async () => {
    const { toast } = await import('react-hot-toast');

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PENDING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'FAILED', error: 'LLM error' }),
      });

    const user = userEvent.setup();

    render(<FactCheckButton content="Test" />);

    await user.click(screen.getByRole('button', { name: /fact-check/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Fact-check failed');
    });
  });

  it('should call onVerified callback', async () => {
    const mockOnVerified = vi.fn();

    const mockResult = {
      jobId: 'job-123',
      status: 'COMPLETED',
      verdict: 'MATCH',
      confidence: 0.95,
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PENDING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

    const user = userEvent.setup();

    render(
      <FactCheckButton content="Test" onVerified={mockOnVerified} />
    );

    await user.click(screen.getByRole('button', { name: /fact-check/i }));

    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(mockResult);
    }, { timeout: 3000 });
  });

  it('should show verdict badge after completion', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'PENDING' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: 'job-123',
          status: 'COMPLETED',
          verdict: 'MATCH',
          confidence: 0.95,
        }),
      });

    const user = userEvent.setup();

    render(<FactCheckButton content="Test" />);

    await user.click(screen.getByRole('button', { name: /fact-check/i }));

    await waitFor(() => {
      expect(screen.getByText('MATCH')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

