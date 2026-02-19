'use client';

import Link from 'next/link';
import { useBookshelfBooks } from '@/hooks/use-bookshelf';
import { GoogleBookCard } from '@/components/HomepageCarousels';

export function BookshelfSection() {
  const { books, isLoading } = useBookshelfBooks();

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className="h-48 animate-pulse rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800/70 dark:bg-zinc-900/60"
            />
          ))}
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
          <p className="mb-3">No books saved yet.</p>
          <Link
            href="/"
            className="text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
          >
            Browse books →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          Bookshelf
        </p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Your saved books
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {books.map((book) => (
          <GoogleBookCard key={book.id} book={book} showBookshelfToggle />
        ))}
      </div>
    </section>
  );
}
