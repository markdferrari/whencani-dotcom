'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { useWatchlistMovies } from '@/hooks/use-watchlist';
import { config } from '@/lib/config';
import {
  WatchlistToolbar,
  ReleaseBadge,
  useToast,
  groupByReleaseDate,
  sortItems,
  extractUniqueGenres,
  filterByGenre,
  isReleasedRecently,
  type ReleaseGroup,
} from '@whencani/ui';
import type { TMDBMovie } from '@/lib/tmdb';

interface WatchlistSectionProps {
  overrideIds?: number[];
  isShared?: boolean;
}

const GROUP_LABELS: Record<ReleaseGroup, string> = {
  'released': 'Released',
  'coming-soon': 'Coming Soon (Next 7 Days)',
  'this-month': 'This Month',
  'later': 'Later',
  'tba': 'TBA',
};

const GROUP_ORDER: ReleaseGroup[] = ['coming-soon', 'this-month', 'later', 'tba', 'released'];

export function WatchlistSection({ overrideIds, isShared = false }: WatchlistSectionProps) {
  const { movies, isLoading } = useWatchlistMovies();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const featureEnabled = config.features.watchlistImprovements;

  // Read URL params
  const sortBy = (searchParams.get('sort') || 'date-added') as 'date-added' | 'release-soonest' | 'release-latest' | 'alphabetical';
  const genreFilter = searchParams.get('genre') || '';

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<ReleaseGroup>>(new Set(['released']));

  // Update URL params
  const updateParam = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  // Apply filtering and sorting
  const processedMovies = useMemo(() => {
    if (!featureEnabled) return movies;

    let filtered = filterByGenre(movies, genreFilter);
    let sorted = sortItems(filtered, sortBy, {
      title: (m) => m.title,
      releaseDate: (m) => m.release_date,
    });

    return sorted;
  }, [movies, genreFilter, sortBy, featureEnabled]);

  // Group by release date if applicable
  const groupedMovies = useMemo(() => {
    if (featureEnabled && sortBy === 'release-soonest') {
      return groupByReleaseDate(processedMovies.map(m => ({ ...m, releaseDate: m.release_date })));
    }
    return null;
  }, [processedMovies, sortBy, featureEnabled]);

  // Extract unique genres for filter
  const availableGenres = useMemo(() => {
    if (!featureEnabled) return [];

    // Need to fetch genres for movies
    const movieGenres: string[] = [];
    // For now, return empty array - would need genre lookup
    return extractUniqueGenres(movies.map(m => ({ genres: movieGenres })));
  }, [movies, featureEnabled]);

  // Export handlers
  const handleExport = (type: 'link' | 'text') => {
    if (type === 'link') {
      const ids = processedMovies.map(m => m.id).join(',');
      const url = `${window.location.origin}/watchlist?ids=${ids}`;
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Share this link to show your watchlist.',
        variant: 'default',
      });
    } else {
      const text = processedMovies
        .map(m => `${m.title} - ${m.release_date || 'TBA'}`)
        .join('\n');
      navigator.clipboard.writeText(text);
      toast({
        title: 'List copied!',
        description: 'Your watchlist has been copied as text.',
        variant: 'default',
      });
    }
  };

  // Toggle group collapse
  const toggleGroup = (group: ReleaseGroup) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

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

      {isShared && (
        <div className="mb-4 rounded-xl border border-sky-200/70 bg-sky-50/50 p-3 text-sm text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/30 dark:text-sky-300">
          Viewing shared watchlist (read-only)
        </div>
      )}

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
        <>
          {featureEnabled && !isShared && (
            <WatchlistToolbar
              sortBy={sortBy}
              onSortChange={(value) => updateParam('sort', value)}
              filterGenre={genreFilter}
              onFilterGenreChange={(value) => updateParam('genre', value)}
              availableGenres={availableGenres}
              onExport={handleExport}
              itemCount={processedMovies.length}
            />
          )}

          {groupedMovies ? (
            <div className="space-y-6">
              {GROUP_ORDER.map(group => {
                const items = groupedMovies[group];
                if (!items || items.length === 0) return null;

                const isCollapsed = collapsedGroups.has(group);

                return (
                  <div key={group}>
                    <button
                      onClick={() => toggleGroup(group)}
                      className="sticky top-0 z-10 mb-3 flex w-full items-center justify-between rounded-lg bg-white/95 px-4 py-2 backdrop-blur-sm dark:bg-zinc-950/95 border border-zinc-200/70 dark:border-zinc-800/70 hover:border-sky-500/40 transition"
                    >
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-700 dark:text-zinc-300">
                        {GROUP_LABELS[group]} ({items.length})
                      </h3>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-zinc-500" />
                      )}
                    </button>
                    {!isCollapsed && (
                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                        {items.map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie as TMDBMovie}
                            size="sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {processedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  size="sm"
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
