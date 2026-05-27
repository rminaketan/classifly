/**
 * Reviews block on the listing detail page.
 *
 * - Anyone can read.
 * - Authed non-owners who haven't reviewed this listing yet see the form.
 * - The seller sees a Reply button on each review (handled per-row in
 *   ReplyForm).
 */
import Link from 'next/link';
import { Star, MessageCircle } from 'lucide-react';
import { timeAgo } from '@classifly/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ReviewForm } from './ReviewForm';
import { ReplyForm } from './ReplyForm';

interface Props {
  listingId: string;
  sellerId: string;
  currentUserId?: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  body: string | null;
  reply_body: string | null;
  reply_at: string | null;
  created_at: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer: { display_name: string | null } | null;
}

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${dim} ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-200'}`}
        />
      ))}
    </div>
  );
}

export async function ReviewSection({ listingId, sellerId, currentUserId }: Props) {
  const supabase = createSupabaseServerClient();

  const reviewsPromise = supabase
    .from('reviews')
    .select(
      'id, rating, body, reply_body, reply_at, created_at, reviewer_id, reviewee_id, reviewer:profiles!reviews_reviewer_id_fkey(display_name)',
    )
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Proof-of-contact check: only run for an authed non-owner viewer.
  const isOwner = currentUserId === sellerId;
  const convoPromise =
    currentUserId && !isOwner
      ? supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', listingId)
          .eq('buyer_id', currentUserId)
          .eq('seller_id', sellerId)
          .maybeSingle()
      : Promise.resolve({ data: null });

  const [{ data: reviews }, { data: convo }] = await Promise.all([
    reviewsPromise,
    convoPromise,
  ]);

  const rows = (reviews ?? []) as unknown as ReviewRow[];

  const hasReviewed = currentUserId
    ? rows.some((r) => r.reviewer_id === currentUserId)
    : false;
  const eligibleToReview = !!currentUserId && !isOwner && !hasReviewed;
  const hasChatted = !!convo;
  const canReview = eligibleToReview && hasChatted;

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-lg font-bold">Reviews</h2>

      {canReview ? (
        <div className="mb-5 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 text-sm font-semibold">Leave a review</div>
          <ReviewForm listingId={listingId} revieweeId={sellerId} />
        </div>
      ) : (
        eligibleToReview && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">Chat with the seller first</div>
              <p className="mt-0.5 text-xs text-neutral-600">
                Reviews are limited to buyers who have contacted the seller about
                this listing.
              </p>
              <Link
                href={`/chat?listing=${listingId}`}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Open chat →
              </Link>
            </div>
          </div>
        )
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold">
                      {r.reviewer?.display_name ?? 'Anonymous'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {timeAgo(r.created_at)}
                  </div>
                </div>
              </div>
              {r.body && (
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-800">{r.body}</p>
              )}

              {r.reply_body ? (
                <div className="mt-3 rounded-md border-l-2 border-primary bg-primary-50/40 p-2 text-sm text-neutral-700">
                  <div className="text-xs font-semibold text-primary-900">Seller replied · {timeAgo(r.reply_at)}</div>
                  <p className="mt-1 whitespace-pre-line">{r.reply_body}</p>
                </div>
              ) : (
                isOwner && <ReplyForm reviewId={r.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
