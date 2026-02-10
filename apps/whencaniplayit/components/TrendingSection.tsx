'use client';

import type { TrendingGame } from '@/lib/opencritic';
import { EmblaCarouselTrending } from './EmblaCarouselTrending';
import { Flame } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

const TRENDING_ENDPOINT = '/api/opencritic/recently-released';

type FetchState = 'idle' | 'loading' | 'loaded' | 'error';

export function TrendingSection() {
  const [games, setGames] = useState<TrendingGame[]>([]);
  const [state, setState] = useState<FetchState>('idle');

  useEffect(() => {
    let isMounted = true;

    const loadTrending = async () => {
      setState('loading');

      try {
        const response = await fetch(TRENDING_ENDPOINT, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`Failed to fetch trending games: ${response.status}`);
        }

        const data = (await response.json()) as { games?: TrendingGame[] };

        if (!isMounted) return;

        setGames(Array.isArray(data.games) ? data.games : []);
        setState('loaded');
      } catch (error) {
        console.error('Failed to fetch trending games:', error);
        if (!isMounted) return;
        setGames([]);
        setState('error');
      }
    };

    void loadTrending();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = state === 'idle' || state === 'loading';

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80">
          <div>
            <Flame className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading trending games…</p>
          </div>
        </div>
      );
    }

    if (games.length > 0) {
      return <EmblaCarouselTrending games={games} />;
    }

    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80">
        <div>
          <Flame className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No games available</p>
        </div>
      </div>
    );
  }, [games, isLoading]);

  return (
    <aside className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Trending</h2>
      </div>

      <div
        data-testid="trending-carousel-wrapper"
        className="flex-1 overflow-hidden max-w-full min-w-0"
      >
        {content}
      </div>
    </aside>
  );
}
