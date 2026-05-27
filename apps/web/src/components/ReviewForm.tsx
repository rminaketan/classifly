'use client';
/**
 * Inline form for leaving a 1-5 star review on a listing. Shown to authed
 * non-owner viewers who haven't already reviewed this listing.
 */
import { useState } from 'react';
import { Star } from 'lucide-react';
import { createReview } from '@/app/listings/[id]/review-actions';

interface Props {
  listingId: string;
  revieweeId: string;
}

export function ReviewForm({ listingId, revieweeId }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating < 1) {
      setError('Please pick a star rating');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await createReview({
        listing_id: listingId,
        reviewee_id: revieweeId,
        rating,
        body: body.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center text-sm font-semibold text-green-900">
        Thanks — your review is live.
      </div>
    );
  }

  const filled = hover || rating;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-1"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            disabled={busy}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                n <= filled ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-neutral-600">
            {rating} / 5
          </span>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional: what was your experience like?"
        maxLength={2000}
        rows={3}
        disabled={busy}
        className="w-full resize-none rounded-md border border-neutral-200 p-2 text-sm focus:border-primary focus:outline-none"
      />
      {error && (
        <div className="rounded bg-red-50 p-2 text-xs text-red-800">{error}</div>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy || rating < 1}
        className="btn-primary w-full"
      >
        {busy ? 'Submitting…' : 'Post review'}
      </button>
    </div>
  );
}
