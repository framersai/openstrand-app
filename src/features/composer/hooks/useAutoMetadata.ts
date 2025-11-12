'use client';

import { useCallback } from 'react';
import { openstrandAPI } from '@/services/openstrand.api';
import type { Strand } from '@/types/openstrand';

export interface AutoMetadataOptions {
  autoTag: boolean;
  autoBacklinks: boolean;
  maxBacklinks?: number;
}

export interface AutoMetadataResult {
  updatedTags?: string[];
  createdRelationships?: number;
}

export interface AutoMetadataSuggestions {
  tags: string[];
  related: Array<{ id: string; title?: string; summary?: string }>;
}

/**
 * useAutoMetadata
 *
 * Coordinates background metadata generation after a strand save:
 * - Auto-tagging via AI concept extraction (aiAPI.extractConcepts)
 * - Auto-backlinks by querying related strands and creating 'related' relationships
 *
 * The operations are safe and idempotent on the backend; failures are swallowed and reported via result stats.
 */
export function useAutoMetadata() {
  const run = useCallback(
    async (params: {
      strandId: string;
      plainText?: string;
      existingTags?: string[];
      options: AutoMetadataOptions;
    }): Promise<AutoMetadataResult> => {
      const { strandId, plainText = '', existingTags = [], options } = params;
      const result: AutoMetadataResult = {};

      // Auto-tag
      if (options.autoTag && plainText.trim().length > 0) {
        try {
          const concepts = await openstrandAPI.ai.extractConcepts(plainText);
          const candidateTags = Array.isArray(concepts)
            ? concepts.map((t) => String(t).toLowerCase())
            : [];
          const merged = Array.from(new Set([...existingTags, ...candidateTags])).slice(0, 16);
          await openstrandAPI.strands.update(strandId, {
            metadata: { tags: merged },
          } as Partial<Strand>);
          result.updatedTags = merged;
        } catch {
          // ignore tagging failures
        }
      }

      // Auto-backlinks
      if (options.autoBacklinks) {
        try {
          const related = await openstrandAPI.strands.getRelated(strandId, Math.max(options.maxBacklinks ?? 3, 1));
          const top = related.filter((r) => r.id !== strandId).slice(0, options.maxBacklinks ?? 3);
          const creations = await Promise.allSettled(
            top.map((r) =>
              openstrandAPI.strands.createRelationship(strandId, {
                targetId: r.id,
                type: 'related',
                weight: 1,
                metadata: { origin: 'auto', reason: 'similarity' },
              }),
            ),
          );
          result.createdRelationships = creations.filter((c) => c.status === 'fulfilled').length;
        } catch {
          // ignore backlink failures
        }
      }

      return result;
    },
    [],
  );

  const suggest = useCallback(
    async (params: {
      strandId: string;
      plainText?: string;
      existingTags?: string[];
      maxBacklinks?: number;
    }): Promise<AutoMetadataSuggestions> => {
      const { strandId, plainText = '', existingTags = [], maxBacklinks = 3 } = params;
      const out: AutoMetadataSuggestions = { tags: [], related: [] };
      try {
        if (plainText.trim().length > 0) {
          const concepts = await openstrandAPI.ai.extractConcepts(plainText);
          const proposed = Array.isArray(concepts)
            ? Array.from(new Set(concepts.map((t) => String(t).toLowerCase())))
            : [];
          out.tags = proposed.filter((t) => !existingTags.includes(t)).slice(0, 16);
        }
      } catch {
        // ignore
      }
      try {
        const related = await openstrandAPI.strands.getRelated(strandId, Math.max(maxBacklinks, 1));
        out.related = related
          .filter((r) => r.id !== strandId)
          .slice(0, maxBacklinks)
          .map((r) => ({ id: r.id, title: r.title, summary: r.summary }));
      } catch {
        // ignore
      }
      return out;
    },
    [],
  );

  return { run, suggest };
}


