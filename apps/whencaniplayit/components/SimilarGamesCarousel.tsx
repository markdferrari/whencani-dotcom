'use client';

import { useEffect, useRef, useState } from 'react';
import EmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import type { IGDBGame } from '@/lib/igdb';

interface SimilarGamesCarouselProps {
  games: Array<{
    id: number;
    name: string;
    coverUrl: string | null;
  }>;
}

export function SimilarGamesCarousel({ games }: SimilarGamesCarouselProps) {
  const [emblaRef, emblaApi] = EmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: true,
    },
    [],
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  const onSelect = () => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <div className="w-full max-w-full">
      <div className="relative">
        <div className="max-w-full overflow-hidden px-4" ref={emblaRef}>
          <div className="flex gap-4">
            {games.map((similar) => (
              <Link
                key={similar.id}
                href={`/game/${similar.id}`}
                className="group mx-auto w-full max-w-full min-w-0 flex-[0_0_min(90vw,320px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:flex-[0_0_calc(33.333%-0.67rem)] sm:max-w-[220px] lg:flex-[0_0_calc(33.333%-0.67rem)]"
              >
                <div className="relative aspect-[3/4]">
                  {similar.coverUrl ? (
                    <Image
                      src={similar.coverUrl}
                      alt={similar.name}
                      fill
                      sizes="(max-width: 640px) calc(50vw - 0.5rem), (max-width: 1024px) calc(33vw - 0.67rem), calc(33vw - 0.67rem)"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      No cover
                    </div>
                  )}
                </div>
                <div className="px-3 py-3 text-sm font-semibold">
                  {similar.name}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation buttons (optional, hidden by default) */}
        {canScrollPrev && (
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 text-white hover:bg-black/70 rounded-r"
            aria-label="Scroll previous"
          >
            ←
          </button>
        )}
        {canScrollNext && (
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 text-white hover:bg-black/70 rounded-l"
            aria-label="Scroll next"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
