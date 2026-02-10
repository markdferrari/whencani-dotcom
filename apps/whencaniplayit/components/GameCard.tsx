'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { IGDBGame } from '@/lib/igdb';
import { formatReleaseDate } from '@/lib/igdb';
import { MagicCard } from './MagicCard';
import { WatchlistToggle } from './WatchlistToggle';

interface GameCardProps {
  game: IGDBGame;
}

export function GameCard({ game }: GameCardProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsDesktop(window.innerWidth >= 768);

    // Listen for resize
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const normalizeIgdbImage = (url?: string, variant = 't_cover_big') =>
    url
      ? `/api/image?url=${encodeURIComponent(
          `https:${url.replace('t_thumb', variant)}`,
        )}`
      : undefined;

  // Use full cover on desktop, thumbnail on mobile
  const coverUrl = normalizeIgdbImage(game.cover?.url, isDesktop ? 't_cover_big' : 't_thumb');

  const releaseDate = game.release_dates?.[0]?.date || game.first_release_date;
  const releaseDateHuman =
    game.release_dates?.[0]?.human ||
    (releaseDate ? formatReleaseDate(releaseDate) : 'TBA');

  const platforms =
    game.release_dates
      ?.map(rd => rd.platform?.name)
      .filter((name, index, self) => name && self.indexOf(name) === index) ||
    game.platforms?.map(p => p.name) ||
    [];

  const selectedImageUrl = coverUrl || '/game-placeholder.svg';

  return (
    <Link href={`/game/${game.id}`}>
      <MagicCard
        gradientSize={250}
        gradientColor="#0ea5e9"
        gradientOpacity={0.15}
        className="relative rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800/70 dark:bg-zinc-900/80"
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative w-24 aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 md:w-40 md:shrink-0">
            <Image
              src={selectedImageUrl}
              alt={`${game.name} - Video game cover art`}
              fill
              unoptimized
              className="object-contain p-2 transition-opacity"
              sizes="(max-width: 767px) 96px, 180px"
            />
          </div>

          <div className="space-y-3 p-4 md:p-6">
            <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
              {releaseDateHuman}
            </div>
            <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {game.name}
            </h3>

            {platforms.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Gamepad2 className="h-4 w-4" />
                <span className="line-clamp-1">{platforms.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-3 top-3">
          <WatchlistToggle gameId={game.id} className="shadow" />
        </div>
      </MagicCard>
    </Link>
  );
}
