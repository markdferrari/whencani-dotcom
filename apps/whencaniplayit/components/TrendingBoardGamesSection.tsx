'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dice5 } from 'lucide-react';
import { MediaCarousel } from '@whencani/ui';

interface HotGame {
  id: number;
  name: string;
  thumbnail?: string;
  yearPublished?: number;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function TrendingBoardGamesSection() {
  const [games, setGames] = useState<HotGame[]>([]);
  const [state, setState] = useState<LoadState>('idle');

  useEffect(() => {
    let active = true;
    setState('loading');
    void (async () => {
      try {
        const res = await fetch('/api/bgg/hot');
        if (!res.ok) throw new Error('Failed to load hot board games');
        const json: { games?: HotGame[] } = await res.json();
        if (!active) return;
        setGames(json.games ?? []);
        setState('loaded');
      } catch (err) {
        console.error(err);
        if (!active) return;
        setGames([]);
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isLoading = state === 'idle' || state === 'loading';

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-500">Trending Board Games</p>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Dice5 className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading trending board games…</p>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-500">Trending Board Games</p>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Dice5 className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No trending board games available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MediaCarousel
      label="Trending Board Games"
      slideBasis="flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]"
      showNavigation
      accentClasses={{
        navBorderHover: 'hover:border-violet-500',
        navTextHover: 'hover:text-violet-500',
      }}
    >
      {games.map((g) => (
        <a key={g.id} href={`/board-game/${g.id}`} className="group block">
          <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-violet-400 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              {g.thumbnail ? (
                <Image
                  src={`/api/image?url=${encodeURIComponent(g.thumbnail)}`}
                  alt={`${g.name} box art`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">No cover</div>
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-900 group-hover:text-violet-500 dark:text-zinc-50">{g.name}</p>
            {g.yearPublished && <p className="mt-1 text-xs text-zinc-500">{g.yearPublished}</p>}
          </article>
        </a>
      ))}
    </MediaCarousel>
  );
}
