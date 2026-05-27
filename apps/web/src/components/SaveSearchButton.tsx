'use client';
/**
 * "Save this search" CTA on /search. Reads the active query + filters from
 * props (which the page derives from URL searchParams) and POSTs them via
 * the createSavedSearch server action.
 */
import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { SavedSearchFilters } from '@classifly/shared';
import { createSavedSearch } from '@/app/profile/saved-searches/actions';

interface Props {
  queryText: string | null;
  filters: SavedSearchFilters;
}

function defaultName(queryText: string | null, filters: SavedSearchFilters): string {
  if (queryText) return queryText.slice(0, 80);
  if (filters.vertical) return `${filters.vertical} listings`;
  return 'My search';
}

export function SaveSearchButton({ queryText, filters }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName(queryText, filters));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createSavedSearch({
        name: name.trim(),
        query_text: queryText ?? undefined,
        filters,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save search');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-900">
        ✓ Saved
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary"
      >
        <Bookmark className="h-4 w-4" /> Save this search
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary-200 bg-primary-50/60 p-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
        maxLength={80}
        className="input flex-1 text-sm"
        placeholder="Name this search"
      />
      <button type="button" onClick={() => setOpen(false)} disabled={busy} className="btn-secondary text-xs">
        Cancel
      </button>
      <button type="button" onClick={submit} disabled={busy} className="btn-primary text-xs">
        {busy ? 'Saving…' : 'Save'}
      </button>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
