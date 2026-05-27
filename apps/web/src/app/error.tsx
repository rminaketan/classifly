'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl">⚠️</div>
      <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-1 text-neutral-600">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </main>
  );
}
