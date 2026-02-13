'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function BookDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[BookDetail] Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-10 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-500">
            Something went wrong
          </p>
          <h2 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            We couldn&apos;t load this book
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600"
            >
              Try again
            </button>
            <Link
              href="/"
              className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
