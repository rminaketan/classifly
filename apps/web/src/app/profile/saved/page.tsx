import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Saved listings' };
export const dynamic = 'force-dynamic';

export default async function SavedListingsPage() {
  if (!isConfigured) return <SetupScreen />;
  const user = await requireUser('/profile/saved');

  const supabase = createSupabaseServerClient();

  // Pull saved rows newest-first with the full listing payload joined.
  const { data: rows } = await supabase
    .from('saved_listings')
    .select(
      `saved_at,
       listing:listings(
         *,
         city:cities(name),
         media:listing_media(url, sort_order)
       )`,
    )
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(100);

  // Flatten + drop entries where the listing has been hard-deleted.
  const listings = (rows ?? [])
    .map((row: any) => row.listing)
    .filter((l: any) => !!l)
    .map((l: any) => ({
      ...l,
      city_name: l.city?.name ?? null,
      cover_url:
        l.media?.slice().sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url ?? null,
    }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="sticky top-20 self-start">
            <ProfileNav />
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold">Saved listings</h1>
              <span className="text-sm text-neutral-500">{listings.length} saved</span>
            </div>

            {listings.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  // We know these are saved (they came from saved_listings).
                  <ListingCard key={listing.id} listing={listing} isSaved={true} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function ProfileNav() {
  return (
    <div className="card p-3">
      <NavItem href="/profile">My listings</NavItem>
      <NavItem href="/profile/saved" active>Saved</NavItem>
      <NavItem href="/chat">Chats</NavItem>
      <NavItem href="/profile/wallet">Wallet</NavItem>
      <NavItem href="/profile/settings">Settings</NavItem>
    </div>
  );
}

function NavItem({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2.5 text-sm font-semibold ${
        active ? 'bg-neutral-100 text-primary' : 'hover:bg-neutral-50'
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
        <Bookmark className="h-7 w-7" />
      </div>
      <h3 className="mt-3 font-bold">Nothing saved yet</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-600">
        Tap the bookmark icon on any listing to save it for later. Saved items live here, even if
        you close your browser.
      </p>
      <Link href="/" className="btn-primary mt-4">
        Browse listings
      </Link>
    </div>
  );
}
