'use client';

import Link from 'next/link';
import { MovieCard } from './MovieCard';
import { useWatchlistMovies } from '@/hooks/use-watchlist';

export function WatchlistSection() {
  const { movies, isLoading } = useWatchlistMovies();

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
            Watchlist
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Your favourites in one place
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="h-48 rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800/70 dark:bg-zinc-900/60" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
          <p className="mb-3">No favourites yet.</p>
          <Link href="/" className="text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400">
            Browse upcoming releases →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} size="sm" />
          ))}
        </div>
      )}
    </section>
  );
}
