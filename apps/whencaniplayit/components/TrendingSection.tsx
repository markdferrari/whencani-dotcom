"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import type { TrendingGame } from "@/lib/opencritic";

const buildPlatformLabel = (game: TrendingGame) => game.platforms?.[0]?.name;

export function TrendingSection() {
  const [games, setGames] = useState<TrendingGame[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
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
    let isMounted = true;

    const loadTrending = async () => {
      setState("loading");

      try {
        const response = await fetch("/api/opencritic/recently-released", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed to fetch trending games: ${response.status}`);
        }

        const data = (await response.json()) as { games?: TrendingGame[] };

        if (!isMounted) return;

        setGames(Array.isArray(data.games) ? data.games : []);
        setState("loaded");
      } catch (error) {
        console.error("Failed to fetch trending games:", error);
        if (!isMounted) return;
        setGames([]);
        setState("error");
      }
    };

    void loadTrending();

    return () => {
      isMounted = false;
    };
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

  const isLoading = state === "idle" || state === "loading";

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Trending
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
            Live
          </span>
        </div>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Flame className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading trending games…</p>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Trending
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
            Live
          </span>
        </div>
        <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
          <div>
            <Flame className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No games available</p>
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
            Trending
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
          Live
        </span>
      </div>
      <div className="relative mt-5 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {games.map((game) => {
              const slug = game.name.toLowerCase().replace(/\s+/g, "-");
              const openCriticUrl = `https://opencritic.com/game/${game.id}/${slug}`;
              const href = game.igdbId ? `/game/${game.igdbId}?oc=${game.id}` : openCriticUrl;
              const isExternal = href.startsWith("http");
              const rawImageUrl =
                game.igdbCoverUrl ||
                game.images.box?.sm ||
                game.images.box?.og ||
                game.images.banner?.sm ||
                game.images.banner?.og;
              const platformLabel = buildPlatformLabel(game);
              const roundedScore = game.topCriticScore ? Math.round(game.topCriticScore) : undefined;

              return (
                <Link
                  key={`${game.id}-carousel`}
                  href={href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group block min-w-0 flex-[0_0_100%]"
                >
                  <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-orange-400 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
                    <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                      {rawImageUrl ? (
                        <Image
                          src={rawImageUrl}
                          alt={`${game.name} cover`}
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
                      {game.tier && (
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                          game.tier === 'Mighty' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200' :
                          game.tier === 'Strong' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' :
                          game.tier === 'Fair' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200' :
                          game.tier === 'Weak' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200' :
                          'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200'
                        }`}>
                          {game.tier}
                        </span>
                      )}
                      {platformLabel && (
                        <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                          {platformLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 group-hover:text-orange-500 dark:text-zinc-50">
                      {game.name}
                    </p>
                    {game.releaseDate && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(game.releaseDate).toLocaleDateString("en-US", {
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
          className="hidden lg:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-orange-500 hover:text-orange-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
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
          className="hidden lg:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-orange-500 hover:text-orange-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
