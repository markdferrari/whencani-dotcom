'use client';

import { GameCard } from './GameCard';
import { ViewToggle } from './ViewToggle';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { IGDBGame, IGDBGenre } from '@/lib/igdb';
import type { BGGBoardGame } from '@/lib/bgg';
import { BoardGameCard } from './BoardGameCard';

interface GamesSectionProps {
  searchParams: { platform?: string; view?: string; genre?: string; studio?: string; type?: string };
}

export function GamesSection({ searchParams }: GamesSectionProps) {
  const routerSearchParams = useSearchParams();
  const [videoGames, setVideoGames] = useState<IGDBGame[]>([]);
  const [boardGames, setBoardGames] = useState<BGGBoardGame[]>([]);
  const [genres, setGenres] = useState<IGDBGenre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentView = routerSearchParams.get('view') || 'upcoming';
  const currentType = routerSearchParams.get('type') || 'video';

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
        if (currentType === 'board') {
          const response = await fetch(`/api/board-games?view=${encodeURIComponent(view)}`);
          const data = await response.json();

          if (!response.ok) {
            setError(data.error || 'Failed to fetch board games');
            setBoardGames([]);
          } else {
            setError(null);
            setBoardGames(data.games || []);
            // categories from BGG are not compatible with IGDBGenre — keep genres empty
            setGenres([]);
          }
        } else {
          const response = await fetch(`/api/games?${params.toString()}`);
          const data = await response.json();

          if (!response.ok) {
            setError(data.error || 'Failed to fetch games');
            setVideoGames([]);
            setGenres([]);
          } else {
            setError(null);
            setVideoGames(data.games || []);
            setGenres(data.genres || []);
          }
        }
      } catch (err) {
        setError('Failed to fetch games');
        setVideoGames([]);
        setBoardGames([]);
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
        {currentType === 'board' ? (
          boardGames.length > 0 ? (
            boardGames.map((game) => <BoardGameCard key={game.id} game={game} />)
          ) : (
            !error && (
              <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
                {currentView === 'recent' ? 'No recently trending board games found.' : 'No board games found.'}
              </div>
            )
          )
        ) : (
          videoGames.length > 0 ? (
            videoGames.map((game) => <GameCard key={game.id} game={game} genres={genres} />)
          ) : (
            !error && (
              <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
                {currentView === 'recent' ? 'No recently released games found.' : 'No upcoming games found.'}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
