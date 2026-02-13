'use client';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import type { OpenCriticReview } from '@/lib/opencritic';

const LATEST_REVIEWS_ENDPOINT = '/api/opencritic/reviewed-this-week';

export function LatestReviewsSection() {
  const [reviews, setReviews] = useState<OpenCriticReview[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const loadReviews = async () => {
    setState('loading');

    try {
      const response = await fetch(LATEST_REVIEWS_ENDPOINT, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch latest reviews: ${response.status}`);
      }

      const data = (await response.json()) as { reviews?: OpenCriticReview[] };
      const nextReviews = Array.isArray(data.reviews) ? data.reviews : [];

      setReviews(nextReviews);
      setState('loaded');
    } catch (error) {
      console.error('Failed to fetch latest reviews:', error);
      setReviews([]);
      setState('error');
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollButtons();
    emblaApi.on("select", updateScrollButtons);
    emblaApi.on("reInit", updateScrollButtons);
    return () => {
      emblaApi.off("select", updateScrollButtons);
      emblaApi.off("reInit", updateScrollButtons);
    };
  }, [emblaApi, updateScrollButtons]);

  const isLoading = state === 'idle' || state === 'loading';

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Latest Reviews
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
            Live
          </span>
        </div>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Trophy className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading latest reviews…</p>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Latest Reviews
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
            Live
          </span>
        </div>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Trophy className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No reviews available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            Latest Reviews
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          Live
        </span>
      </div>
      <div className="relative mt-5 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {reviews.map((review) => {
              const slug = review.name.toLowerCase().replace(/\s+/g, "-");
              const openCriticUrl = `https://opencritic.com/game/${review.id}/${slug}`;
              const href = review.igdbId ? `/game/${review.igdbId}?oc=${review.id}` : openCriticUrl;
              const isExternal = href.startsWith("http");
              const rawImageUrl =
                review.igdbCoverUrl ||
                review.images.box?.sm ||
                review.images.box?.og ||
                review.images.banner?.sm ||
                review.images.banner?.og;
              const roundedScore = review.topCriticScore ? Math.round(review.topCriticScore) : undefined;

              return (
                <Link
                  key={`${review.id}-carousel`}
                  href={href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group block min-w-0 flex-[0_0_100%]"
                >
                  <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-sky-400 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
                    <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                      {rawImageUrl ? (
                        <Image
                          src={rawImageUrl}
                          alt={`${review.name} cover`}
                          fill
                          className="object-cover"
                          sizes="100vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {review.tier && (
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                          review.tier === 'Mighty' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200' :
                          review.tier === 'Strong' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' :
                          review.tier === 'Fair' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200' :
                          review.tier === 'Weak' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200' :
                          'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200'
                        }`}>
                          {review.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 group-hover:text-sky-500 dark:text-zinc-50">
                      {review.name}
                    </p>
                    {review.releaseDate && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(review.releaseDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    {roundedScore !== undefined && (
                      <p className="text-xs font-semibold text-zinc-500 mt-1">
                        {roundedScore}/100
                      </p>
                    )}
                  </article>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop hover controls (mobile swipe stays unchanged) */}
        <button
          type="button"
          aria-label="Scroll left"
          disabled={!canScrollPrev}
          onClick={() => {
            if (!emblaApi) return;
            const idx = emblaApi.selectedScrollSnap();
            emblaApi.scrollTo(Math.max(0, idx - 1));
          }}
          className="hidden lg:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Scroll right"
          disabled={!canScrollNext}
          onClick={() => {
            if (!emblaApi) return;
            const idx = emblaApi.selectedScrollSnap();
            emblaApi.scrollTo(idx + 1);
          }}
          className="hidden lg:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
