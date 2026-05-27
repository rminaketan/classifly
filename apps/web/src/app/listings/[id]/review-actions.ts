'use server';
/**
 * Server actions for buyer reviews on a listing.
 *
 *   createReview   - leave a 1-5 star review on someone else's listing.
 *                    Caller must be authenticated and NOT the listing's
 *                    seller. The DB UNIQUE constraint (reviewer, reviewee,
 *                    listing) prevents double-reviews; the trigger
 *                    profiles_rating_tg keeps the seller's rating_avg /
 *                    rating_count in sync.
 *
 *   replyToReview  - the reviewee writes a single reply. The RLS UPDATE
 *                    policy lets either party update; we additionally
 *                    require reviewee_id === current user in code so a
 *                    reviewer can't edit body via this entrypoint.
 */
import { revalidatePath } from 'next/cache';
import {
  createReviewSchema,
  replyToReviewSchema,
  type CreateReviewInput,
  type ReplyToReviewInput,
} from '@classifly/shared';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createReview(input: CreateReviewInput) {
  const parsed = createReviewSchema.parse(input);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === parsed.reviewee_id) {
    throw new Error("You can't review yourself");
  }

  const supabase = createSupabaseServerClient();

  // Confirm the listing exists and the reviewee really is its seller.
  const { data: listing, error: listErr } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', parsed.listing_id)
    .single();
  if (listErr || !listing) throw new Error('Listing not found');
  if (listing.seller_id !== parsed.reviewee_id) {
    throw new Error('Reviewee does not match listing seller');
  }

  // Proof-of-contact gate: the reviewer must have an open conversation
  // with the seller about THIS listing. Cheap to enforce here because we
  // have the (listing_id, buyer_id, seller_id) unique tuple to look up.
  const { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', parsed.listing_id)
    .eq('buyer_id', user.id)
    .eq('seller_id', parsed.reviewee_id)
    .maybeSingle();
  if (!convo) {
    throw new Error('Chat with the seller about this listing before reviewing');
  }

  const { error } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    reviewee_id: parsed.reviewee_id,
    listing_id: parsed.listing_id,
    rating: parsed.rating,
    body: parsed.body ?? null,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error("You've already reviewed this listing");
    }
    throw new Error(error.message);
  }

  revalidatePath(`/listings/${parsed.listing_id}`);
  revalidatePath('/profile');
  return { ok: true as const };
}

export async function replyToReview(input: ReplyToReviewInput) {
  const parsed = replyToReviewSchema.parse(input);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();

  const { data: review, error: readErr } = await supabase
    .from('reviews')
    .select('id, reviewee_id, listing_id')
    .eq('id', parsed.review_id)
    .single();
  if (readErr || !review) throw new Error('Review not found');
  if (review.reviewee_id !== user.id) {
    throw new Error('Only the reviewed seller can reply');
  }

  const { error } = await supabase
    .from('reviews')
    .update({ reply_body: parsed.reply_body, reply_at: new Date().toISOString() })
    .eq('id', parsed.review_id);
  if (error) throw new Error(error.message);

  if (review.listing_id) revalidatePath(`/listings/${review.listing_id}`);
  revalidatePath('/profile');
  return { ok: true as const };
}
