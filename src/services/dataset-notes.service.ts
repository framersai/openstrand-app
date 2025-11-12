'use client';

/**
 * @module services/dataset-notes.service
 * @description Helpers for saving dataset insights as strands and wiring them into the knowledge graph.
 */

import { openstrandAPI } from './openstrand.api';
import type { Strand, Weave } from '@/types/openstrand';
import { StrandType, type NoteType } from '@/types/openstrand';

const DEFAULT_NOTE_TYPE: NoteType = 'main';

const NOTE_RELATIONSHIP_TYPE = 'references';

type SaveDatasetNoteArgs = {
  datasetId?: string | null;
  datasetName?: string | null;
  content: Record<string, any>;
  plainText: string;
  noteType?: NoteType;
};

export interface DatasetNoteSummary {
  id: string;
  title: string;
  summary?: string;
  modified?: string;
  plainText?: string;
  noteType?: string;
  authorId?: string;
}

const buildNoteTitle = (datasetName?: string | null): string => {
  const timestamp = new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (datasetName && datasetName.trim().length > 0) {
    return `${datasetName} — Insight (${timestamp})`;
  }

  return `Dataset Insight (${timestamp})`;
};

const buildNoteSummary = (plainText: string): string => {
  if (!plainText) {
    return '';
  }
  const condensed = plainText.replace(/\s+/g, ' ').trim();
  return condensed.length > 240 ? `${condensed.slice(0, 237)}…` : condensed;
};

/**
 * Persist a dataset note by creating a note strand and linking it back to the dataset strand.
 */
export async function saveDatasetNote({
  datasetId,
  datasetName,
  content,
  plainText,
  noteType = DEFAULT_NOTE_TYPE,
}: SaveDatasetNoteArgs): Promise<Strand> {
  const title = buildNoteTitle(datasetName);
  const summary = buildNoteSummary(plainText);

  const createPayload: Partial<Strand> & { noteType: NoteType } = {
    type: StrandType.NOTE,
    title,
    summary,
    content: {
      data: content,
      metadata: {
        format: 'tiptap',
        plainText,
        origin: 'dashboard-dataset-inspector',
        createdAt: new Date().toISOString(),
      },
    },
    contentType: 'application/vnd.tiptap+json',
    visibility: 'private',
    noteType,
  };

  const noteStrand = await openstrandAPI.strands.create(createPayload);

  if (datasetId) {
    try {
      await openstrandAPI.strands.createRelationship(noteStrand.id, {
        targetId: datasetId,
        type: NOTE_RELATIONSHIP_TYPE,
        metadata: {
          origin: 'dashboard-dataset-inspector',
          datasetName,
        },
      });
    } catch (error) {
      console.warn('Failed to link dataset note to dataset strand', error);
    }
  }

  return noteStrand;
}

/**
 * Load the most relevant notes connected to a dataset.
 */
export async function listDatasetNotes(
  datasetId: string,
  limit = 5
): Promise<DatasetNoteSummary[]> {
  if (!datasetId) {
    return [];
  }

  let graph: Weave | null = null;
  try {
    graph = await openstrandAPI.weave.getSubgraph([datasetId], 1);
  } catch (error) {
    console.warn('Failed to load dataset subgraph', error);
    return [];
  }

  if (!graph?.nodes?.length) {
    return [];
  }

  const relatedNoteIds = (graph.nodes ?? [])
    .filter((node) => {
      const strandType =
        node.metadata?.strandType ?? node.metadata?.type ?? (node as any).type;
      const nodeId = node.strandId ?? node.id;
      return strandType === 'note' && nodeId && nodeId !== datasetId;
    })
    .map((node) => node.strandId ?? node.id)
    .slice(0, limit * 2); // fetch a few extra in case some fetches fail

  if (relatedNoteIds.length === 0) {
    return [];
  }

  const noteDetails = await Promise.all(
    relatedNoteIds.map(async (id) => {
      try {
        return await openstrandAPI.strands.get(id);
      } catch (error) {
        console.warn(`Failed to fetch note strand ${id}`, error);
        return null;
      }
    })
  );

  return noteDetails
    .filter((note): note is Strand => Boolean(note) && ((note as any).type ?? (note as any).strandType) === StrandType.NOTE)
    .sort((a, b) => {
      const score = (strand: Strand) =>
        new Date(strand.modified ?? strand.created ?? 0).getTime();
      return score(b) - score(a);
    })
    .slice(0, limit)
    .map((note) => {
      const metadata = note.content?.metadata ?? {};
      const plain =
        typeof metadata === 'object' && metadata !== null && 'plainText' in metadata
          ? (metadata.plainText as string | undefined)
          : undefined;
      return {
        id: note?.id ?? '',
        title: note?.title ?? 'Untitled note',
        summary: note?.summary ?? (plain ? plain.slice(0, 180) : undefined),
        modified: note?.modified ?? note?.created ?? new Date().toISOString(),
        plainText: plain,
        noteType: note?.noteType,
        authorId: note?.createdBy ?? note?.owner_id,
      };
    });
}
