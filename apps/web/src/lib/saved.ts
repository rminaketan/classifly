/**
 * Helper to look up which listings (out of a set) the current user has saved.
 * Avoids an N+1 — one query per page render covering all visible cards.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@classifly/db';

export async function getSavedSet(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined,
  listingIds: string[],
): Promise<Set<string>> {
  if (!userId || listingIds.length === 0) return new Set();
  const { data } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId)
    .in('listing_id', listingIds);
  return new Set((data ?? []).map((r: any) => r.listing_id as string));
}
