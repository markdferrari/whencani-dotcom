'use client';

import { useEffect, useState } from 'react';
import { MediaCarousel } from '@whencani/ui';
import { getHighResImageUrl } from '@/lib/utils';

interface HotGame {
  id: number;
  name: string;
  thumbnail?: string;
  yearPublished?: number;
}

export function TrendingBoardGamesSection() {
  const [games, setGames] = useState<HotGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/bgg/hot');
        if (!res.ok) throw new Error('Failed to load hot board games');
        const json = await res.json();
        if (!active) return;
        setGames(json.games || []);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setGames([]);
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!games || games.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-500">Trending Board Games</p>
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">No trending board games available.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-500">Trending Board Games</p>
      <div className="mt-3">
        <MediaCarousel label="Trending board games" className="mt-2" slideBasis="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]">
          {games.map((g) => (
            <a key={g.id} href={`/board-game/${g.id}`} className="block rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-violet-400/60 dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <div className="relative mb-3 aspect-[1/1] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                {g.thumbnail ? (
                  // BGG thumbnails are direct URLs
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.thumbnail} alt={`${g.name} box art`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">No cover</div>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{g.name}</p>
              {g.yearPublished && <p className="mt-1 text-xs text-zinc-500">{g.yearPublished}</p>}
            </a>
          ))}
        </MediaCarousel>
      </div>
    </div>
  );
}
