"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export interface MediaCardProps {
  id: string | number;
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  releaseDate?: string;
  summary?: string;
  genres?: string[];
  rating?: number;
  ratingCount?: number;
  watchlistToggle?: ReactNode;
  badge?: ReactNode;
  size?: "md" | "sm";
}

export function MediaCard({
  id,
  href,
  title,
  imageUrl,
  imageAlt,
  releaseDate,
  summary,
  genres,
  rating,
  ratingCount,
  watchlistToggle,
  badge,
  size = "md",
}: MediaCardProps) {
  const imageHeight = size === "md" ? 120 : 88;
  const imageWidth = size === "md" ? 84 : 64;

  return (
    <article className="flex items-start gap-4 rounded-2xl border border-zinc-100/80 bg-white p-4 text-left shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="relative flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900" style={{ width: imageWidth, height: imageHeight }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || `${title} cover`}
            width={imageWidth}
            height={imageHeight}
            className="h-full w-full object-cover"
            priority={false}
            unoptimized={imageUrl.startsWith('/api/image')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
            No image
          </div>
        )}
        {badge && (
          <div className="absolute top-2 right-2 z-10">
            {badge}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {releaseDate && (
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">{releaseDate}</p>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 whitespace-normal break-words">
              <Link href={href} className="hover:text-sky-500">
                {title}
              </Link>
            </h3>
          </div>
          <div className="ml-2 flex-shrink-0">{watchlistToggle}</div>
        </div>

        {summary && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 hidden md:block">{summary}</p>
        )}

        {genres && genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {genres.map((genre) => (
              <span key={genre} className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* platforms removed: show genres above instead */}
      </div>

      {(rating !== undefined || ratingCount !== undefined) && (
        // hide rating/votes on small screens to avoid truncating titles
        <div className="hidden sm:flex ml-4 flex-shrink-0 flex-col items-end text-right text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {rating !== undefined && <div>{rating.toFixed(1)} / 10</div>}
          {ratingCount !== undefined && (
            <div className="text-[0.65rem] text-zinc-400 dark:text-zinc-500">{ratingCount} votes</div>
          )}
        </div>
      )}
    </article>
  );
}
