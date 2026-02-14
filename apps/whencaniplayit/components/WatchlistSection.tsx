'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GameCard } from './GameCard';
import { useWatchlistGames } from '@/hooks/use-watchlist';
import { useBoardGameWatchlistGames } from '@/hooks/use-board-game-watchlist';
import { BoardGameCard } from './BoardGameCard';
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
import type { IGDBGame } from '@/lib/igdb';

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

// Helper to convert Unix timestamp to ISO date string
function timestampToDate(timestamp?: number): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

// Helper to extract unique platforms
function extractUniquePlatforms(games: IGDBGame[]): Array<{ id: string; name: string }> {
  const platformMap = new Map<number, string>();

  for (const game of games) {
    if (game.platforms) {
      for (const platform of game.platforms) {
        platformMap.set(platform.id, platform.name);
      }
    }
  }

  return Array.from(platformMap.entries())
    .map(([id, name]) => ({ id: String(id), name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Helper to filter by platform
function filterByPlatform(games: IGDBGame[], platformId?: string): IGDBGame[] {
  if (!platformId) return games;

  const id = parseInt(platformId);
  return games.filter(game => game.platforms?.some(p => p.id === id));
}

// Helper to filter by genre for IGDBGame
function filterGamesByGenre(games: IGDBGame[], genreName?: string): IGDBGame[] {
  if (!genreName) return games;

  return games.filter(game =>
    game.genres?.some(g => g.name === genreName)
  );
}

export function WatchlistSection({ overrideIds, isShared = false }: WatchlistSectionProps) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'game';
  const isBoardType = typeParam === 'board' && config.features.boardGames;

  const { games: igdbGames, isLoading: igdbLoading } = useWatchlistGames();
  const { games: boardGames, isLoading: boardLoading } = useBoardGameWatchlistGames();

  const isLoading = isBoardType ? boardLoading : igdbLoading;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const featureEnabled = config.features.watchlistImprovements; 

  // Read URL params
  const sortBy = (searchParams.get('sort') || 'date-added') as 'date-added' | 'release-soonest' | 'release-latest' | 'alphabetical';
  const genreFilter = searchParams.get('genre') || '';
  const platformFilter = searchParams.get('platform') || '';

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

  // Apply filtering and sorting (IGDB games only)
  const processedGames = useMemo((): IGDBGame[] => {
    if (isBoardType) return [];
    if (!featureEnabled) return igdbGames;

    // Filter by platform and genre (both work with IGDBGame type)
    let filtered = filterByPlatform(igdbGames, platformFilter);
    filtered = filterGamesByGenre(filtered, genreFilter);

    // Sort (need to provide genre names as strings for sorting)
    const gamesForSorting = filtered.map(game => ({
      ...game,
      genreNames: game.genres?.map(g => g.name) || [],
    }));

    const sorted = sortItems(gamesForSorting, sortBy, {
      title: (g) => g.name,
      releaseDate: (g) => timestampToDate(g.first_release_date),
    });

    // Map back to IGDBGame type (remove the temporary genreNames property)
    return sorted.map(({ genreNames, ...game }) => game as IGDBGame);
  }, [igdbGames, genreFilter, platformFilter, sortBy, featureEnabled, isBoardType]);

  // Group by release date if applicable (IGDB only)
  const groupedGames = useMemo<Record<ReleaseGroup, (IGDBGame & { releaseDate?: string | null })[]> | null>(() => {
    if (isBoardType) return null;
    if (featureEnabled && sortBy === 'release-soonest') {
      return groupByReleaseDate(
        processedGames.map((g: IGDBGame) => ({
          ...g,
          releaseDate: timestampToDate(g.first_release_date),
        }))
      );
    }
    return null;
  }, [processedGames, sortBy, featureEnabled, isBoardType]);

  // Extract unique genres and platforms for filters (IGDB only)
  const availableGenres = useMemo(() => {
    if (!featureEnabled) return [];

    const genreMap = new Map<number, string>();
    for (const game of igdbGames) {
      if (game.genres) {
        for (const genre of game.genres) {
          genreMap.set(genre.id, genre.name);
        }
      }
    }

    return Array.from(genreMap.entries())
      .map(([id, name]) => ({ id: String(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [igdbGames, featureEnabled]);

  const availablePlatforms = useMemo(() => {
    if (!featureEnabled) return [];
    return extractUniquePlatforms(igdbGames);
  }, [igdbGames, featureEnabled]);

  // Export handlers
  const handleExport = (type: 'link' | 'text') => {
    if (type === 'link') {
      const ids = processedGames.map((g: IGDBGame) => g.id).join(',');
      const url = `${window.location.origin}/watchlist?ids=${ids}`;
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied to clipboard',
        variant: 'success',
      });
    } else {
      const text = processedGames
        .map((g: IGDBGame) => {
          const releaseDate = timestampToDate(g.first_release_date) || 'TBA';
          return `${g.name} - ${releaseDate}`;
        })
        .join('\n');
      navigator.clipboard.writeText(text);
      toast({
        title: 'Watchlist copied as text',
        variant: 'success',
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
          {config.features.boardGames && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => updateParam('type', '')}
                className={`rounded-full px-3 py-1 text-sm font-medium ${!isBoardType ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 dark:bg-zinc-950/50'}`}
              >
                Games
              </button>
              <button
                onClick={() => updateParam('type', 'board')}
                className={`rounded-full px-3 py-1 text-sm font-medium ${isBoardType ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 dark:bg-zinc-950/50'}`}
              >
                Board games
              </button>
            </div>
          )}
        </div>
      </div>

      {isShared && (
        <div className="mb-4 rounded-xl border border-sky-200/70 bg-sky-50/50 p-3 text-sm text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/30 dark:text-sky-300">
          Viewing shared watchlist (read-only)
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((slot) => (
            <div key={slot} className="h-24 rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800/70 dark:bg-zinc-900/60" />
          ))}
        </div>
      ) : (isBoardType ? boardGames : igdbGames).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
          <p className="mb-3">No favourites yet.</p>
          <Link href="/" className="text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400">
            Browse upcoming releases →
          </Link>
        </div>
      ) : (
        <>
          {featureEnabled && !isShared && !isBoardType && (
            <WatchlistToolbar
              sortBy={sortBy}
              onSortChange={(value) => updateParam('sort', value)}
              filterGenre={genreFilter}
              onFilterGenreChange={(value) => updateParam('genre', value)}
              filterPlatform={platformFilter}
              onFilterPlatformChange={(value) => updateParam('platform', value)}
              availableGenres={availableGenres}
              availablePlatforms={availablePlatforms}
              onExport={handleExport}
              itemCount={processedGames.length}
            />
          )}

          {groupedGames ? (
            <div className="space-y-6">
              {GROUP_ORDER.map(group => {
                const items = groupedGames[group];
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
                      <div className="space-y-4">
                        {items.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game as IGDBGame}
                            showAffiliateLink
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : isBoardType ? (
            <div className="mt-6 space-y-4">
              {boardGames.map((game) => (
                <BoardGameCard
                  key={game.id}
                  game={game}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {processedGames.map((game: IGDBGame) => (
                <GameCard
                  key={game.id}
                  game={game}
                  showAffiliateLink
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
