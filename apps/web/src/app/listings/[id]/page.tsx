import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, BadgeCheck, MessageCircle, Phone, Share2, Flag, ShieldAlert } from 'lucide-react';
import { Header } from '@/components/Header';
import { SetupScreen } from '@/components/SetupScreen';
import { PhotoUploader } from '@/components/PhotoUploader';
import { SaveButton } from '@/components/SaveButton';
import { BoostButton } from '@/components/BoostButton';
import { ReviewSection } from '@/components/ReviewSection';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { cdnImage } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { formatINR, timeAgo } from '@classifly/shared';

// Per-request rendering — needs to reflect the seller's photo edits immediately
// after they upload, so no ISR here.
export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  if (!isConfigured) return <SetupScreen />;

  const [supabase, currentUser] = [createSupabaseServerClient(), await getCurrentUser()];

  const { data: listing } = await supabase
    .from('listings')
    .select(
      `*,
       seller:profiles!listings_seller_id_fkey(id, display_name, kyc_tier, rating_avg, rating_count, listings_count, created_at),
       city:cities(name, state),
       category:categories(name, slug),
       attributes:listing_attributes(attrs),
       media:listing_media(id, url, sort_order)`,
    )
    .eq('id', params.id)
    .single();

  if (!listing) notFound();

  const sortedMedia = (listing.media ?? []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
  const cover = sortedMedia[0]?.url;
  const attrs = (listing.attributes?.attrs ?? {}) as Record<string, string | number>;
  const isOwner = currentUser?.id === listing.seller_id;

  // Is this listing already saved by the current viewer?
  let isSaved = false;
  if (currentUser && !isOwner) {
    const { data: savedRow } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', currentUser.id)
      .eq('listing_id', params.id)
      .maybeSingle();
    isSaved = !!savedRow;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-4 text-sm text-neutral-500">
          <Link href="/" className="hover:underline">Home</Link>
          {' / '}
          <Link href={`/search?vertical=${listing.vertical}`} className="hover:underline">
            {listing.vertical.replace('_', ' ')}
          </Link>
          {listing.category && (
            <>
              {' / '}
              <Link href={`/search?category_id=${listing.category_id}`} className="hover:underline">
                {(listing.category as any).name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {/* Gallery */}
            <div className="card overflow-hidden">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-neutral-500 to-neutral-800">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cdnImage(cover, { w: 1200 })}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm uppercase tracking-wider text-white/80">
                    No photo
                  </div>
                )}
              </div>
              {sortedMedia.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {sortedMedia.map((m: any) => (
                    <img
                      key={m.id}
                      src={cdnImage(m.url, { w: 200 })}
                      alt=""
                      className="h-16 w-20 flex-shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Seller-only photo uploader */}
            {isOwner && (
              <PhotoUploader
                listingId={listing.id}
                existing={sortedMedia.map((m: any) => ({
                  id: m.id,
                  url: m.url,
                  sort_order: m.sort_order,
                }))}
              />
            )}

            {/* Title + price */}
            <div className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                {listing.is_featured && <span className="badge-featured">Featured</span>}
                <span className="badge-verified">
                  <BadgeCheck className="h-3 w-3" /> Verified seller
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold">{listing.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                {listing.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {(listing.city as any).name}, {(listing.city as any).state}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted {timeAgo(listing.posted_at ?? listing.created_at)}
                </span>
                <span>{listing.view_count} views</span>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <div className="text-4xl font-extrabold text-primary">{formatINR(listing.price, { compact: false })}</div>
                {listing.price_type === 'negotiable' && (
                  <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-900">
                    Negotiable
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {!isOwner && <SaveButton listingId={listing.id} initialSaved={isSaved} variant="button" />}
                <button className="btn-secondary">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button className="btn-secondary">
                  <Flag className="h-4 w-4" /> Report
                </button>
              </div>
            </div>

            {/* Attributes */}
            {Object.keys(attrs).length > 0 && (
              <div className="card p-5">
                <h2 className="mb-3 text-lg font-bold">Details</h2>
                <dl className="grid grid-cols-2 gap-y-3 text-sm">
                  {Object.entries(attrs).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-neutral-500">{prettify(k)}</dt>
                      <dd className="font-semibold">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="card p-5">
                <h2 className="mb-3 text-lg font-bold">Description</h2>
                <p className="whitespace-pre-line leading-relaxed text-neutral-700">
                  {listing.description}
                </p>
              </div>
            )}

            <ReviewSection
              listingId={listing.id}
              sellerId={listing.seller_id}
              currentUserId={currentUser?.id}
            />
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="card p-5">
              {listing.seller && (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                    {((listing.seller as any).display_name ?? 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{(listing.seller as any).display_name ?? 'Seller'}</div>
                    <div className="text-xs text-neutral-500">
                      Member since {new Date((listing.seller as any).created_at).getFullYear()}
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="badge-kyc">
                  <BadgeCheck className="h-3 w-3" /> KYC verified
                </span>
                {(listing.seller as any)?.rating_avg && (
                  <span className="badge bg-yellow-100 text-yellow-900">
                    ★ {(listing.seller as any).rating_avg} ({(listing.seller as any).rating_count})
                  </span>
                )}
              </div>
              {isOwner ? (
                <>
                  <div className="mt-4 rounded-md border border-primary-100 bg-primary-50 p-3 text-center text-xs text-primary-900">
                    This is your listing. Buyers' chats appear in your{' '}
                    <Link href="/chat" className="font-semibold underline">
                      inbox
                    </Link>
                    .
                  </div>
                  {listing.status === 'active' &&
                    (listing.is_featured &&
                    listing.featured_until &&
                    new Date(listing.featured_until) > new Date() ? (
                      <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-center text-xs font-semibold text-yellow-900">
                        ⚡ Featured until{' '}
                        {new Date(listing.featured_until).toLocaleDateString()}
                      </div>
                    ) : (
                      <BoostButton listingId={listing.id} />
                    ))}
                </>
              ) : (
                <>
                  <Link href={`/chat?listing=${listing.id}`} className="btn-primary mt-4 w-full">
                    <MessageCircle className="h-4 w-4" /> Chat with seller
                  </Link>
                  <button className="btn-secondary mt-2 w-full" type="button">
                    <Phone className="h-4 w-4" /> Show phone (masked)
                  </button>
                  <p className="mt-2 text-center text-xs text-neutral-500">
                    Your number stays private. Calls are routed through Classifly.
                  </p>
                </>
              )}
            </div>

            <div className="card border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-orange-700" />
                <div className="text-sm">
                  <div className="font-semibold text-orange-900">Safety tips</div>
                  <ul className="mt-1 space-y-1 text-orange-800">
                    <li>• Meet in a public place during daytime</li>
                    <li>• Check papers before payment</li>
                    <li>• Never share OTPs or pay in advance</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function prettify(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
