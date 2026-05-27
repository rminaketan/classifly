import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { formatINR, timeAgo } from '@classifly/shared';
import type { Listing } from '@classifly/db';
import { cdnImage } from '@/lib/r2';
import { SaveButton } from './SaveButton';

interface Props {
  listing: Listing & {
    city_name?: string | null;
    cover_url?: string | null;
  };
  isSaved?: boolean;
}

export function ListingCard({ listing, isSaved = false }: Props) {
  const cover = listing.cover_url ? cdnImage(listing.cover_url, { w: 600 }) : null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card relative overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-400 to-neutral-700">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-white/80">
            No photo
          </div>
        )}
        <SaveButton listingId={listing.id} initialSaved={isSaved} />
        {listing.is_featured && (
          <span className="badge-featured absolute left-2 top-2">Featured</span>
        )}
      </div>
      <div className="p-3">
        <div className="text-lg font-bold text-primary">{formatINR(listing.price)}</div>
        <div className="line-clamp-1 text-sm font-semibold">{listing.title}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" />
            {listing.city_name ?? 'India'}
            <span className="mx-1">·</span>
            {timeAgo(listing.posted_at ?? listing.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
