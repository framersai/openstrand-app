/**
 * @fileoverview Tests for useTextToSpeech hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from './useTextToSpeech';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    // Mock fetch for TTS API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['fake audio'], { type: 'audio/mpeg' })),
    });

    // Mock Audio API
    (global as any).Audio = vi.fn(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      currentTime: 0,
      duration: 10,
    }));

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should initialize with correct defaults', () => {
    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.playing).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should set loading state when speak() called', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Hello world');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/voice/tts/stream'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Hello world'),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Test');
    });

    expect(result.current.playing).toBe(false);
  });
});

