import Link from 'next/link';
import { ShoppingBag, Briefcase, Wrench, Home as HomeIcon, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { SetupScreen } from '@/components/SetupScreen';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { getCurrentUser } from '@/lib/auth';
import { getSavedSet } from '@/lib/saved';

// Per-request so the bookmark state reflects the viewer accurately.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (!isConfigured) return <SetupScreen />;

  const [supabase, currentUser] = [createSupabaseServerClient(), await getCurrentUser()];

  // Fetch latest 12 active listings + their cities + their first media.
  const { data: listings } = await supabase
    .from('listings')
    .select(
      `*,
       city:cities(name),
       media:listing_media(url, sort_order)`,
    )
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(12);

  // Flatten to what ListingCard expects.
  const flattened = (listings ?? []).map((row: any) => ({
    ...row,
    city_name: row.city?.name ?? null,
    cover_url: row.media?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url ?? null,
  }));

  // One round-trip to find which of these are already saved by the viewer.
  const savedSet = await getSavedSet(
    supabase,
    currentUser?.id ?? null,
    flattened.map((l) => l.id),
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Vertical splits */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <VerticalCard href="/search?vertical=goods" Icon={ShoppingBag} title="Buy & Sell" subtitle="Goods & rentals" />
          <VerticalCard href="/search?vertical=jobs" Icon={Briefcase} title="Jobs" subtitle="नौकरियां · Apply with voice CV" />
          <VerticalCard href="/search?vertical=services" Icon={Wrench} title="Services" subtitle="Verified pros, same-day quotes" />
          <VerticalCard href="/search?vertical=real_estate" Icon={HomeIcon} title="Real Estate" subtitle="Rent, buy, PG, commercial" />
        </section>

        {/* Near you */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">Near you in Bengaluru</h2>
          {flattened.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {flattened.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedSet.has(listing.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyFeed />
          )}
        </section>

        {/* Trust panel */}
        <section className="mt-10 flex items-center gap-4 rounded-xl border border-orange-200 bg-gradient-to-br from-primary-50 to-accent-50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold">Buy and sell safely on Classifly</div>
            <p className="text-sm text-neutral-600">
              Phone numbers stay private. KYC-verified sellers get a badge. Pay only when you meet —
              or use escrow for high-value deals.
            </p>
          </div>
          <Link href="/safety" className="btn-secondary">
            Safety tips
          </Link>
        </section>
      </main>
    </>
  );
}

function VerticalCard({
  href,
  Icon,
  title,
  subtitle,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="card p-5 transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-bold">{title}</div>
      <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
    </Link>
  );
}

function EmptyFeed() {
  return (
    <div className="card flex flex-col items-center justify-center p-10 text-center">
      <div className="text-3xl">📦</div>
      <h3 className="mt-2 font-bold">No listings yet in your area</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-600">
        Be the first to post! Either run <code>pnpm db:reset</code> to load the dev seed (cities,
        categories) and sign up via the OTP flow, then post a test ad.
      </p>
      <Link href="/sell" className="btn-accent mt-4">
        Post the first ad
      </Link>
    </div>
  );
}
