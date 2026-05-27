'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';

interface Props {
  listingId: string;
  initialSaved: boolean;
  /** "icon" = small circular for card overlay; "button" = labeled for action rows. */
  variant?: 'icon' | 'button';
  /** Optional callback after a successful toggle (e.g. refresh a saved-list). */
  onToggle?: (saved: boolean) => void;
}

export function SaveButton({ listingId, initialSaved, variant = 'icon', onToggle }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic flip
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      try {
        const res = next
          ? await fetch('/api/saved-listings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listingId }),
            })
          : await fetch(`/api/saved-listings?listingId=${encodeURIComponent(listingId)}`, {
              method: 'DELETE',
            });

        if (!res.ok) {
          if (res.status === 401) {
            // Not signed in — bounce to login, preserving where to come back.
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            setSaved(!next);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        onToggle?.(next);
        router.refresh();
      } catch {
        setSaved(!next); // roll back
      }
    });
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
        className="btn-secondary"
      >
        <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-xs transition-colors hover:bg-white"
    >
      <Bookmark
        className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : 'text-neutral-700'}`}
      />
    </button>
  );
}
