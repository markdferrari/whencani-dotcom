'use client';

import Image from "next/image";
import Link from "next/link";
import { formatReleaseDate, getPosterUrl, TMDBMovie } from "@/lib/tmdb";
import { WatchlistToggle } from "./WatchlistToggle";

type MovieCardProps = {
  movie: TMDBMovie;
  size?: "md" | "sm";
};

export function MovieCard({ movie, size = "md" }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path, size === "md" ? "w342" : "w300");
  const imageHeight = size === "md" ? 320 : 280;
  const imageWidth = size === "md" ? 220 : 180;
  const summary = movie.overview
    ? movie.overview.length > 110
      ? `${movie.overview.slice(0, 110)}…`
      : movie.overview
    : "Release details are coming soon.";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-zinc-100/80 bg-white p-4 text-left shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/movie/${movie.id}`} className="group flex-1">
          <div
            className="relative mx-auto w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            style={{ height: `${imageHeight}px` }}
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={`${movie.title} poster`}
                width={imageWidth}
                height={imageHeight}
                className="h-full w-full object-cover"
                priority={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
                No poster
              </div>
            )}
          </div>
        </Link>
        <WatchlistToggle movieId={movie.id} />
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          {formatReleaseDate(movie.release_date)}
        </p>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Link href={`/movie/${movie.id}`} className="hover:text-sky-500">
            {movie.title}
          </Link>
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{summary}</p>
      </div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
        <span>{movie.vote_average.toFixed(1)} / 10</span>
        <span className="text-[0.65rem] text-zinc-400 dark:text-zinc-500">
          {movie.vote_count} votes
        </span>
      </div>
    </article>
  );
}
