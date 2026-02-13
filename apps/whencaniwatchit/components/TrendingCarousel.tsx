"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatReleaseDate, getPosterUrl, TMDBMovie } from "@/lib/tmdb";
import { WatchlistToggle } from "./WatchlistToggle";
import { config } from "@/lib/config";
import { MediaCarousel } from "@whencani/ui";

type TrendingCarouselProps = {
  movies: TMDBMovie[];
  title: string;
};

const ACCENT = {
  navBorderHover: "hover:border-sky-500",
  navTextHover: "hover:text-sky-500",
};

function TrendingCard({ movie }: { movie: TMDBMovie }) {
  const posterUrl = getPosterUrl(movie.poster_path, "w300");
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group block"
    >
      <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <div className="absolute right-3 top-3 z-10">
          <WatchlistToggle movieId={movie.id} className="shadow" />
        </div>
        <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={`${movie.title} poster`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
              No poster
            </div>
          )}
        </div>
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-500">
          {formatReleaseDate(movie.release_date, { month: "short" })}
        </p>
        <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-sky-500 dark:text-zinc-50">
          {movie.title}
        </h3>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
          {movie.vote_average.toFixed(1)} / 10
        </p>
      </article>
    </Link>
  );
}

function TrendingCarouselStandard({ movies, title }: TrendingCarouselProps) {
  return (
    <MediaCarousel
      label={title}
      slideBasis="flex-[0_0_100%]"
      showNavigation
      wheelScroll
      accentClasses={ACCENT}
      headerRight={
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          Live
        </span>
      }
    >
      {movies.map((movie) => (
        <TrendingCard key={movie.id} movie={movie} />
      ))}
    </MediaCarousel>
  );
}

function TrendingCarouselLegacy({ movies, title }: TrendingCarouselProps) {
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

  useEffect(() => {
    if (!emblaApi) return;

    const rafId = window.requestAnimationFrame(() => {
      updateScrollButtons();
    });
    emblaApi.on("select", updateScrollButtons);
    emblaApi.on("reInit", updateScrollButtons);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
    };

    const container = emblaApi.rootNode();
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.cancelAnimationFrame(rafId);
      emblaApi.off("select", updateScrollButtons);
      emblaApi.off("reInit", updateScrollButtons);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [emblaApi, updateScrollButtons]);

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            {title}
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          Live
        </span>
      </div>
      <div className="relative mt-5 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
          {movies.map((movie) => {
            const posterUrl = getPosterUrl(movie.poster_path, "w300");
            return (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="group block min-w-0 flex-[0_0_100%]"
              >
                <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
                  <div className="absolute right-3 top-3 z-10">
                    <WatchlistToggle movieId={movie.id} className="shadow" />
                  </div>
                  <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={`${movie.title} poster`}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                        No poster
                      </div>
                    )}
                  </div>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-500">
                    {formatReleaseDate(movie.release_date, { month: "short" })}
                  </p>
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-sky-500 dark:text-zinc-50">
                    {movie.title}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
                    {movie.vote_average.toFixed(1)} / 10
                  </p>
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

export function TrendingCarousel({ movies, title }: TrendingCarouselProps) {
  if (movies.length === 0) {
    return null;
  }

  if (config.features.standardCarousels) {
    return <TrendingCarouselStandard movies={movies} title={title} />;
  }

  return <TrendingCarouselLegacy movies={movies} title={title} />;
}
