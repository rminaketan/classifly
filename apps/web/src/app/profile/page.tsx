import Link from 'next/link';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BadgeCheck, Star } from 'lucide-react';
import { timeAgo } from '@classifly/shared';

export const metadata = { title: 'My profile' };

export default async function ProfilePage() {
  if (!isConfigured) return <SetupScreen />;

  const user = await requireUser('/profile');
  const supabase = createSupabaseServerClient();

  const [{ data: profile }, { data: listings }, { data: reviews }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('listings')
      .select(
        `*,
         city:cities(name),
         media:listing_media(url, sort_order)`,
      )
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select(
        'id, rating, body, created_at, listing_id, reviewer:profiles!reviews_reviewer_id_fkey(display_name), listing:listings(title)',
      )
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const flat = (listings ?? []).map((row: any) => ({
    ...row,
    city_name: row.city?.name ?? null,
    cover_url:
      row.media?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url ?? null,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <div className="card p-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                {(profile?.display_name ?? user.phone ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="mt-3 font-bold">{profile?.display_name ?? 'Unnamed'}</div>
              <div className="text-xs text-neutral-500">{user.phone}</div>
              <div className="mt-3 flex justify-center gap-1.5">
                <span className="badge-kyc">
                  <BadgeCheck className="h-3 w-3" /> {profile?.kyc_tier ?? 'tier0'}
                </span>
                {profile?.rating_avg && (
                  <span className="badge bg-yellow-100 text-yellow-900">
                    ★ {profile.rating_avg}
                  </span>
                )}
              </div>
              <Link href="/profile/edit" className="btn-secondary mt-4 w-full">
                Edit profile
              </Link>
            </div>

            <div className="card mt-4 p-2">
              <NavItem href="/profile" active>My listings</NavItem>
              <NavItem href="/profile/saved">Saved</NavItem>
              <NavItem href="/chat">Chats</NavItem>
              <NavItem href="/profile/wallet">Wallet</NavItem>
              <NavItem href="/profile/settings">Settings</NavItem>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold">My listings</h1>
              <Link href="/sell" className="btn-accent">
                + Post another
              </Link>
            </div>
            {flat.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {flat.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <div className="text-3xl">📦</div>
                <h3 className="mt-2 font-bold">No listings yet</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Post your first ad — it's free and takes under a minute.
                </p>
                <Link href="/sell" className="btn-accent mt-4 inline-flex">
                  Post an ad
                </Link>
              </div>
            )}

            {(reviews?.length ?? 0) > 0 && (
              <div className="card mt-6 p-5">
                <h2 className="mb-3 text-lg font-bold">Your reviews</h2>
                <ul className="space-y-3">
                  {(reviews ?? []).map((r: any) => (
                    <li key={r.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-4 w-4 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">
                          {r.reviewer?.display_name ?? 'Anonymous'}
                        </span>
                        <span className="text-xs text-neutral-500">· {timeAgo(r.created_at)}</span>
                      </div>
                      {r.listing && (
                        <Link
                          href={`/listings/${r.listing_id}`}
                          className="mt-1 block text-xs text-neutral-500 hover:underline"
                        >
                          on "{r.listing.title}"
                        </Link>
                      )}
                      {r.body && <p className="mt-1 text-sm text-neutral-800">{r.body}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
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
