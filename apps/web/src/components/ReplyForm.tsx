'use client';
import { useState } from 'react';
import { replyToReview } from '@/app/listings/[id]/review-actions';

interface Props {
  reviewId: string;
}

export function ReplyForm({ reviewId }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await replyToReview({ review_id: reviewId, reply_body: text.trim() });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reply');
    } finally {
      setBusy(false);
    }
  }

  if (done) return null;

  if (!open) {
    return (
      <button
        type="button"
        className="mt-2 text-xs font-semibold text-primary hover:underline"
        onClick={() => setOpen(true)}
      >
        Reply
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your reply"
        maxLength={2000}
        rows={2}
        disabled={busy}
        className="w-full resize-none rounded-md border border-neutral-200 p-2 text-xs focus:border-primary focus:outline-none"
      />
      {error && (
        <div className="rounded bg-red-50 p-2 text-xs text-red-800">{error}</div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary flex-1 text-xs"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary flex-1 text-xs"
          onClick={submit}
          disabled={busy || !text.trim()}
        >
          {busy ? 'Posting…' : 'Post reply'}
        </button>
      </div>
    </div>
  );
}
