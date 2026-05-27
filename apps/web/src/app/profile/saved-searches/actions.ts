'use server';
/**
 * Saved-search CRUD + match-count helpers.
 *
 * Counts use the existing search_listings() RPC and post-filter results by
 * posted_at > last_notified_at — good enough at MVP scale. When user opens
 * the saved-searches list we display "X new" badges; clicking "Run"
 * navigates to /search with the saved filters and bumps last_notified_at
 * via markSavedSearchSeen so the badge resets.
 *
 * All writes go through the user-context client because the saved_searches
 * RLS policy (saved_searches_owner) already enforces user_id = auth.uid().
 */
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createSavedSearchSchema,
  type CreateSavedSearchInput,
  type SavedSearchFilters,
} from '@classifly/shared';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const uuidSchema = z.string().uuid();

export async function createSavedSearch(input: CreateSavedSearchInput) {
  const parsed = createSavedSearchSchema.parse(input);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name: parsed.name,
      query_text: parsed.query_text ?? null,
      filters: parsed.filters,
      last_notified_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to save search');

  revalidatePath('/profile/saved-searches');
  return { ok: true as const, id: data.id };
}

export async function deleteSavedSearch(id: string) {
  const parsedId = uuidSchema.parse(id);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', parsedId);
  if (error) throw new Error(error.message);

  revalidatePath('/profile/saved-searches');
  return { ok: true as const };
}

export async function markSavedSearchSeen(id: string) {
  const parsedId = uuidSchema.parse(id);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_searches')
    .update({ last_notified_at: new Date().toISOString() })
    .eq('id', parsedId);
  if (error) throw new Error(error.message);

  revalidatePath('/profile/saved-searches');
  return { ok: true as const };
}

export interface SavedSearchWithCount {
  id: string;
  name: string | null;
  query_text: string | null;
  filters: SavedSearchFilters;
  last_notified_at: string | null;
  created_at: string;
  newMatches: number;
}

/**
 * Returns every saved search for the user plus an integer count of new
 * listings posted since last_notified_at. Counts come from re-running the
 * same search_listings RPC then filtering in JS — fine for MVP scale.
 */
export async function listSavedSearchesWithCounts(): Promise<SavedSearchWithCount[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = createSupabaseServerClient();
  const { data: searches } = await supabase
    .from('saved_searches')
    .select('id, name, query_text, filters, last_notified_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!searches || searches.length === 0) return [];

  const counts = await Promise.all(
    searches.map(async (s) => {
      const filters = (s.filters ?? {}) as SavedSearchFilters;
      const cutoff = s.last_notified_at ?? s.created_at;

      const { data: rows } = await supabase.rpc('search_listings', {
        q: s.query_text ?? undefined,
        vert: filters.vertical ?? undefined,
        cat_id: filters.category_id ?? undefined,
        min_price: filters.min_price ?? undefined,
        max_price: filters.max_price ?? undefined,
        lim: 60,
        off: 0,
      });

      const newMatches = (rows ?? []).filter(
        (r: { posted_at: string | null }) =>
          r.posted_at && new Date(r.posted_at) > new Date(cutoff),
      ).length;

      return { ...s, filters, newMatches };
    }),
  );

  return counts;
}

