'use client';
import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { SavedSearchFilters } from '@classifly/shared';
import { deleteSavedSearch, markSavedSearchSeen } from '@/app/profile/saved-searches/actions';

interface Props {
  id: string;
  name: string;
  queryText: string | null;
  filters: SavedSearchFilters;
  newMatches: number;
  runHref: string;
}

function summary(queryText: string | null, filters: SavedSearchFilters): string {
  const parts: string[] = [];
  if (queryText) parts.push(`"${queryText}"`);
  if (filters.vertical) parts.push(filters.vertical.replace('_', ' '));
  if (filters.min_price != null || filters.max_price != null) {
    const lo = filters.min_price ?? 0;
    const hi = filters.max_price ?? '∞';
    parts.push(`₹${lo} – ₹${hi}`);
  }
  return parts.length ? parts.join(' · ') : 'no filters';
}

export function SavedSearchRow({ id, name, queryText, filters, newMatches, runHref }: Props) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const onRun = () => {
    startTransition(async () => {
      await markSavedSearchSeen(id);
      router.push(runHref);
    });
  };

  const onDelete = () => {
    if (!confirm('Delete this saved search?')) return;
    startTransition(async () => {
      await deleteSavedSearch(id);
      router.refresh();
    });
  };

  return (
    <li className="card flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-bold">{name}</h2>
          {newMatches > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
              {newMatches} new
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-neutral-500">{summary(queryText, filters)}</p>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <button type="button" onClick={onRun} disabled={busy} className="btn-primary text-xs">
          Run
        </button>
        <Link href={runHref} className="btn-secondary text-xs" aria-label="Open without marking seen">
          Open
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="btn-secondary text-xs"
          aria-label="Delete saved search"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
