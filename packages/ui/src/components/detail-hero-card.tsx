"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "../utils/cn";

interface DetailHeroCardProps {
  /** Title of the item (movie name, game name) */
  title: string;
  /** URL for the backdrop/banner image at the top of the card */
  backdropUrl: string | null;
  /** URL for the poster/cover image in the left column */
  posterUrl: string | null;
  /** Alt text for the poster image */
  posterAlt?: string;
  /** Aspect ratio for the poster — "2/3" for movie posters, "3/4" for game covers */
  posterAspect?: "2/3" | "3/4";
  /** Whether the poster should use unoptimized loading (e.g. proxied images) */
  posterUnoptimized?: boolean;
  /** Optional extra class(es) applied to the backdrop image (e.g. "blur-sm scale-110") */
  backdropClassName?: string;
  /** Content rendered in the right column next to the poster */
  children: React.ReactNode;
  className?: string;
}

export function DetailHeroCard({
  title,
  backdropUrl,
  posterUrl,
  posterAlt,
  posterAspect = "2/3",
  posterUnoptimized = false,
  backdropClassName,
  children,
  className,
}: DetailHeroCardProps) {
  const aspectClass = posterAspect === "3/4" ? "aspect-[3/4]" : "aspect-[2/3]";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70",
        className,
      )}
    >
      {/* Backdrop */}
      <div className="relative h-56 bg-zinc-100 dark:bg-zinc-900 sm:h-72">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={`${title} backdrop`}
            fill
            className={cn("object-cover", backdropClassName)}
            priority
            unoptimized={posterUnoptimized}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
            No backdrop
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent dark:from-zinc-950/95 dark:via-zinc-950/50" />
      </div>

      {/* Poster + Details grid */}
      <div className="grid gap-6 p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-10 sm:p-10">
        {/* Poster */}
        <div className="mx-auto w-full max-w-[220px]">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl bg-zinc-100 shadow-lg dark:bg-zinc-900",
              aspectClass,
            )}
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={posterAlt ?? `${title} poster`}
                fill
                className="object-cover"
                sizes="220px"
                unoptimized={posterUnoptimized}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
                No cover
              </div>
            )}
          </div>
        </div>

        {/* Details slot */}
        <div className="min-w-0 space-y-4">{children}</div>
      </div>
    </section>
  );
}
