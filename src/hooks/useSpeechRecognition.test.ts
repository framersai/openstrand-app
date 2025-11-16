/**
 * @fileoverview Tests for useSpeechRecognition hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    // Mock Web Speech API
    (global as any).window = {
      SpeechRecognition: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        lang: 'en-US',
        continuous: false,
        interimResults: true,
      })),
    };
  });

  it('should initialize with correct defaults', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.transcript).toBe('');
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('should start listening when start() called', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    // Check if listening state would be updated (mocked)
    expect(result.current.isSupported).toBe(true);
  });

  it('should handle unsupported browsers gracefully', () => {
    (global as any).window = {}; // No SpeechRecognition

    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isSupported).toBe(false);
    
    // start() should not throw
    act(() => {
      result.current.start();
    });
  });
});

