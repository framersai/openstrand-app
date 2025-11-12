import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComposerPreferences } from '../../src/features/composer/hooks/useComposerPreferences';

describe('useComposerPreferences', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as any);
  });

  it('returns defaults and persists updates', () => {
    const { result } = renderHook(() => useComposerPreferences());
    const [prefs, update] = result.current;
    expect(prefs.autosave).toBe(true);
    act(() => update({ autosave: false, maxBacklinks: 5 }));
    const [next] = result.current;
    expect(next.autosave).toBe(false);
    expect(next.maxBacklinks).toBe(5);
  });
});


