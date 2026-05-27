import Link from 'next/link';
import { Header } from '@/components/Header';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { savedSearchToQuery } from '@/lib/saved-search';
import { listSavedSearchesWithCounts } from './actions';
import { SavedSearchRow } from '@/components/SavedSearchRow';
import { Bookmark } from 'lucide-react';

export const metadata = { title: 'My saved searches' };
export const dynamic = 'force-dynamic';

export default async function SavedSearchesPage() {
  if (!isConfigured) return <SetupScreen />;
  await requireUser('/profile/saved-searches');

  const searches = await listSavedSearchesWithCounts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">My saved searches</h1>
          <Link href="/search" className="btn-secondary">
            Browse listings
          </Link>
        </div>

        {searches.length === 0 ? (
          <div className="card p-10 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-2 font-bold">No saved searches yet</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Run a search you care about, then hit "Save this search" to get
              notified as new listings come in.
            </p>
            <Link href="/search" className="btn-primary mt-4 inline-flex">
              Search now
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {searches.map((s) => (
              <SavedSearchRow
                key={s.id}
                id={s.id}
                name={s.name ?? 'Unnamed search'}
                queryText={s.query_text}
                filters={s.filters}
                newMatches={s.newMatches}
                runHref={`/search?${savedSearchToQuery(s)}`}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
