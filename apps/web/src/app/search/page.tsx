import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { SetupScreen } from '@/components/SetupScreen';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { getCurrentUser } from '@/lib/auth';
import { getSavedSet } from '@/lib/saved';
import { searchListingsSchema } from '@classifly/shared';

export const metadata = { title: 'Search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!isConfigured) return <SetupScreen />;

  const parsed = searchListingsSchema.safeParse(searchParams);
  if (!parsed.success) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold">Invalid search</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {parsed.error.issues[0]?.message ?? 'Try again with valid filters.'}
          </p>
        </main>
      </>
    );
  }

  const { q, vertical, category_id, min_price, max_price, page, page_size } = parsed.data;
  const supabase = createSupabaseServerClient();
  const offset = (page - 1) * page_size;

  // Use the server-side search_listings() RPC defined in our schema.
  const { data: listings, error } = await supabase.rpc('search_listings', {
    q: q ?? undefined,
    vert: vertical ?? undefined,
    cat_id: category_id ?? undefined,
    min_price: min_price ?? undefined,
    max_price: max_price ?? undefined,
    lim: page_size,
    off: offset,
  });

  const rows = (listings ?? []) as any[];

  // Fetch city names + first photo for each (small N, fine).
  const cityIds = Array.from(new Set(rows.map((r) => r.city_id).filter(Boolean)));
  const listingIds = rows.map((r) => r.id);

  const [{ data: cities }, { data: media }] = await Promise.all([
    cityIds.length
      ? supabase.from('cities').select('id, name').in('id', cityIds)
      : Promise.resolve({ data: [] }),
    listingIds.length
      ? supabase
          .from('listing_media')
          .select('listing_id, url, sort_order')
          .in('listing_id', listingIds)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const cityById = new Map((cities ?? []).map((c: any) => [c.id, c.name]));
  const coverByListing = new Map<string, string>();
  for (const m of media ?? []) {
    if (!coverByListing.has((m as any).listing_id)) {
      coverByListing.set((m as any).listing_id, (m as any).url);
    }
  }

  const flat = rows.map((r) => ({
    ...r,
    city_name: cityById.get(r.city_id) ?? null,
    cover_url: coverByListing.get(r.id) ?? null,
  }));

  const currentUser = await getCurrentUser();
  const savedSet = await getSavedSet(supabase, currentUser?.id ?? null, flat.map((l) => l.id));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {q ? `Results for "${q}"` : vertical ? capitalize(vertical) : 'All listings'}
            </h1>
            <p className="text-sm text-neutral-500">
              Page {page} · {flat.length} result{flat.length === 1 ? '' : 's'}
              {error && ` · ${error.message}`}
            </p>
          </div>
          <form action="/search" className="flex gap-2">
            <input
              name="q"
              defaultValue={q ?? ''}
              className="input w-72"
              placeholder="Search listings…"
            />
            {vertical && <input type="hidden" name="vertical" value={vertical} />}
            <button className="btn-primary">Search</button>
          </form>
        </div>

        {flat.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {flat.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={savedSet.has(listing.id)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <div className="text-3xl">🔎</div>
            <h3 className="mt-2 font-bold">No matches</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Try a different search, widen your filters, or browse a different category.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}
