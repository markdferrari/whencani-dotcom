"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import type { IGDBGame } from "@/lib/igdb";
import { config } from "@/lib/config";
import { MediaCarousel } from "@whencani/ui";
import { GameCard } from "./GameCard";

const ACCENT = {
  navBorderHover: "hover:border-red-500",
  navTextHover: "hover:text-red-500",
};

function PopularLoadingState() {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            Popular
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Hot
        </span>
      </div>
      <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80 mt-5">
        <div>
          <Flame className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading popular games…</p>
        </div>
      </div>
    </div>
  );
}

function PopularEmptyState() {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            Popular
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Hot
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

function PopularSectionStandard({ games }: { games: IGDBGame[] }) {
  return (
    <MediaCarousel
      label="Popular Today"
      slideBasis="flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_30%]"
      showNavigation
      accentClasses={ACCENT}
      headerRight={
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Hot
        </span>
      }
    >
      {games.map((game) => (
        <GameCard key={`${game.id}-carousel`} game={game} size="md" fullHeight />
      ))}
    </MediaCarousel>
  );
}

export function PopularSection() {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  useEffect(() => {
    let isMounted = true;

    const loadPopular = async () => {
      setState("loading");

      try {
        const response = await fetch("/api/popular", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed to fetch popular games: ${response.status}`);
        }

        const data = (await response.json()) as { games?: IGDBGame[] };

        if (!isMounted) return;

        setGames(Array.isArray(data.games) ? data.games : []);
        setState("loaded");
      } catch (error) {
        console.error("Failed to fetch popular games:", error);
        if (!isMounted) return;
        setGames([]);
        setState("error");
      }
    };

    void loadPopular();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = state === "idle" || state === "loading";

  if (isLoading) {
    return <PopularLoadingState />;
  }

  if (games.length === 0) {
    return <PopularEmptyState />;
  }

  if (config.features.standardCarousels) {
    return <PopularSectionStandard games={games} />;
  }

  // Fallback to standard for now - could add legacy version later if needed
  return <PopularSectionStandard games={games} />;
}