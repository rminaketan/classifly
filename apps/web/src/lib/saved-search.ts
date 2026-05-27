import type { SavedSearchFilters } from '@classifly/shared';

/**
 * Build a /search querystring from a saved search's free text + filters.
 * Kept here (separate from the actions.ts module) because actions.ts is
 * a 'use server' file and may only export async server actions.
 */
export function savedSearchToQuery(s: {
  query_text: string | null;
  filters: SavedSearchFilters;
}): string {
  const params = new URLSearchParams();
  if (s.query_text) params.set('q', s.query_text);
  if (s.filters.vertical) params.set('vertical', s.filters.vertical);
  if (s.filters.category_id) params.set('category_id', s.filters.category_id);
  if (s.filters.city_id) params.set('city_id', s.filters.city_id);
  if (s.filters.min_price != null) params.set('min_price', String(s.filters.min_price));
  if (s.filters.max_price != null) params.set('max_price', String(s.filters.max_price));
  return params.toString();
}
