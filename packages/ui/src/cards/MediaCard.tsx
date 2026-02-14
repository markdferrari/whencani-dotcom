"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";

export interface MediaCardProps {
  id: string | number;
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  releaseDate?: string;
  summary?: string;
  authors?: string[];
  genres?: string[];
  rating?: number;
  ratingCount?: number;
  watchlistToggle?: ReactNode;
  /** where to render the watchlist toggle (default is the title row) */
  watchlistTogglePosition?: 'title' | 'below-genres';
  badge?: ReactNode;
  actionButton?: ReactNode;
  size?: "md" | "sm";
  /**
   * Controls the layout on small screens. Defaults to `stack` (image above text).
   * Use `side` to render image on the left and content on the right for small viewports.
   */
  mobileLayout?: 'stack' | 'side';
  showSummary?: boolean;
}

export function MediaCard({
  id,
  href,
  title,
  imageUrl,
  imageAlt,
  releaseDate,
  summary,
  authors,
  genres,
  rating,
  ratingCount,
  watchlistToggle,
  watchlistTogglePosition = 'title',
  badge,
  actionButton,
  size = "md",
  mobileLayout = 'stack',
  showSummary = true,
}: MediaCardProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const imageHeight = size === "md" ? 120 : 88;
  const imageWidth = size === "md" ? 84 : 64;

  // root layout changes to a horizontal row at small screens when mobileLayout === 'side'
  const rootFlexClass = mobileLayout === 'side'
    ? 'flex-row items-start'
    : 'flex-col md:flex-row md:items-start';

  // visual container sizes are responsive; keep the intrinsic image width/height for Next/Image
  const imageContainerClass = mobileLayout === 'side'
    ? (size === 'md'
        ? 'w-[96px] h-[136px] md:w-[84px] md:h-[120px]'
        : 'w-[72px] h-[100px] md:w-[64px] md:h-[88px]'
      )
    : (size === 'md' ? 'w-[84px] h-[120px]' : 'w-[64px] h-[88px]');

  return (
    <article className={`flex ${rootFlexClass} gap-4 rounded-2xl border border-zinc-100/80 bg-white p-4 text-left md:text-left shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70`}>
      <div className={`relative flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 ${imageContainerClass} ${mobileLayout === 'side' ? 'mx-0' : 'mx-auto md:mx-0'}`}>
        {imageUrl ? (
          <Link href={href}>
            <Image
              src={imageUrl}
              alt={imageAlt || `${title} cover`}
              width={imageWidth}
              height={imageHeight}
              className="h-full w-full object-cover cursor-pointer"
              priority={false}
              unoptimized={imageUrl.startsWith('/api/image')}
            />
          </Link>
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

      <div className="min-w-0 flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="min-w-0">
            {releaseDate && (
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">{releaseDate}</p>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 whitespace-normal break-words">
              <Link href={href} className="hover:text-sky-500">
                {title}
              </Link>
            </h3>
            {authors && authors.length > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                by {authors.join(', ')}
              </p>
            )}
          </div>

          {watchlistToggle && (
            watchlistTogglePosition === 'title' ? (
              <div className="ml-2 flex-shrink-0">{watchlistToggle}</div>
            ) : (
              // when `below-genres` is requested we still render the toggle in the
              // title row for large screens only (hidden on small screens)
              <div className="ml-2 flex-shrink-0 hidden md:block">{watchlistToggle}</div>
            )
          )}
        </div>

        {summary && showSummary && (
          <div className="mt-2 hidden md:block">
            <p className={`text-sm text-zinc-600 dark:text-zinc-300 ${!isSummaryExpanded ? 'line-clamp-2' : ''}`}>
              {summary}
            </p>
            {summary.length > 100 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSummaryExpanded(!isSummaryExpanded);
                }}
                className="mt-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium"
              >
                {isSummaryExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
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

        {watchlistToggle && watchlistTogglePosition === 'below-genres' && (
          // show below-genres only on small screens; hide on md+
          <div className="mt-3 md:hidden">
            {watchlistToggle}
          </div>
        )}

        {actionButton && (
          <div className="mt-3">
            {actionButton}
          </div>
        )}
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
