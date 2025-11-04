'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { Visualization } from '@/types';

const TABLE_NAME = 'user_saved_visualizations';

const requireSupabase = () => {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error('Supabase client unavailable');
  }
  return client;
};

export async function fetchSavedVisualizations(userId: string): Promise<Visualization[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('payload')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('[saved-visualizations] fetch error', error);
      return [];
    }

    return (data ?? [])
      .map((record) => record.payload as Visualization | null)
      .filter((payload): payload is Visualization => Boolean(payload));
  } catch (error) {
    console.warn('[saved-visualizations] fetch skipped', error);
    return [];
  }
}

export async function upsertSavedVisualization(userId: string, visualization: Visualization) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        user_id: userId,
        viz_id: visualization.id,
        payload: visualization,
        saved_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,viz_id',
      }
    );
    if (error) {
      console.error('[saved-visualizations] upsert error', error);
    }
  } catch (error) {
    console.warn('[saved-visualizations] upsert skipped', error);
  }
}

export async function removeSavedVisualization(userId: string, visualizationId: string) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId)
      .eq('viz_id', visualizationId);

    if (error) {
      console.error('[saved-visualizations] delete error', error);
    }
  } catch (error) {
    console.warn('[saved-visualizations] delete skipped', error);
  }
}
