'use client';

import { GameCard } from './GameCard';
import { ViewToggle } from './ViewToggle';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { IGDBGame, IGDBGenre } from '@/lib/igdb';

interface GamesSectionProps {
  searchParams: { platform?: string; view?: string; genre?: string; studio?: string };
}

export function GamesSection({ searchParams }: GamesSectionProps) {
  const routerSearchParams = useSearchParams();
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [genres, setGenres] = useState<IGDBGenre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentView = routerSearchParams.get('view') || 'upcoming';

  const fetchGames = () => {
    startTransition(async () => {
      const params = new URLSearchParams();
      const platform = routerSearchParams.get('platform') || 'all';
      const genre = routerSearchParams.get('genre');
      const studio = routerSearchParams.get('studio');
      const view = routerSearchParams.get('view') || 'upcoming';

      params.set('platform', platform);
      params.set('view', view);
      if (genre) params.set('genre', genre);
      if (studio) params.set('studio', studio);

      try {
        const response = await fetch(`/api/games?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch games');
          setGames([]);
          setGenres([]);
        } else {
          setError(null);
          setGames(data.games || []);
          setGenres(data.genres || []);
        }
      } catch (err) {
        setError('Failed to fetch games');
        setGames([]);
      }
    });
  };

  useEffect(() => {
    fetchGames();
  }, [routerSearchParams]);

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 max-w-full overflow-hidden min-w-0">
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle />
      </div>

      <div className={`mt-5 space-y-4 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {games.length > 0 ? (
          games.map((game) => <GameCard key={game.id} game={game} genres={genres} />)
        ) : (
          !error && (
            <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
              {currentView === 'recent' ? 'No recently released games found.' : 'No upcoming games found.'}
            </div>
          )
        )}
      </div>
    </div>
  );
}
