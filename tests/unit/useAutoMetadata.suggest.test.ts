import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as apiModule from '../../src/services/openstrand.api';
import { useAutoMetadata } from '../../src/features/composer/hooks/useAutoMetadata';

describe('useAutoMetadata.suggest', () => {
  it('returns proposed tags and related strands', async () => {
    const extractConcepts = vi.spyOn(apiModule.openstrandAPI.ai, 'extractConcepts').mockResolvedValue(['AI', 'Charts']);
    const getRelated = vi.spyOn(apiModule.openstrandAPI.strands, 'getRelated').mockResolvedValue([
      { id: 's1', title: 'One', summary: 'A' },
      { id: 's2', title: 'Two', summary: 'B' },
    ] as any);

    const { result } = renderHook(() => useAutoMetadata());
    const { suggest } = result.current;
    const out = await act(async () => await suggest({ strandId: 'x', plainText: 'AI charts', existingTags: ['ai'], maxBacklinks: 1 }));
    expect(out.tags.length).toBeGreaterThan(0);
    expect(out.related.length).toBe(1);

    extractConcepts.mockRestore();
    getRelated.mockRestore();
  });
});


