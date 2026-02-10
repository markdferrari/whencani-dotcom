'use client';

import EmblaCarousel from 'embla-carousel-react';
import { useEffect, useState } from 'react';
import type { OpenCriticReview } from '@/lib/opencritic';
import { CarouselCard } from './CarouselCard';

interface EmblaCarouselReviewsProps {
  reviews: OpenCriticReview[];
}

export function EmblaCarouselReviews({ reviews }: EmblaCarouselReviewsProps) {
  const [emblaRef, emblaApi] = EmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: true,
      loop: false,
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
    <div className="w-full">
      <div className="relative">
        <div className="max-w-full overflow-hidden px-4" ref={emblaRef}>
          <div className="flex gap-3">
            {reviews.map((review) => {
              const slug = review.name.toLowerCase().replace(/\s+/g, '-');
              const openCriticUrl = `https://opencritic.com/game/${review.id}/${slug}`;
              const href = review.igdbId ? `/game/${review.igdbId}?oc=${review.id}` : openCriticUrl;
              const isExternal = href.startsWith('http');
              const rawImageUrl =
                review.igdbCoverUrl ||
                review.images.box?.sm ||
                review.images.box?.og ||
                review.images.banner?.sm ||
                review.images.banner?.og;
              const roundedScore = review.topCriticScore ? Math.round(review.topCriticScore) : undefined;

              return (
                <div
                  key={`${review.id}-carousel`}
                  className="min-w-0 flex-[0_0_min(90vw,320px)] sm:flex-[0_0_calc(50%-0.75rem)] lg:flex-[0_0_calc(100%-0.75rem)] w-full max-w-full"
                >
                  <CarouselCard
                    href={href}
                    isExternal={isExternal}
                    imageUrl={rawImageUrl ?? undefined}
                    name={review.name}
                    tier={review.tier}
                    releaseDate={review.releaseDate}
                    score={roundedScore}
                    percentRecommended={review.percentRecommended}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons (optional) */}
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
