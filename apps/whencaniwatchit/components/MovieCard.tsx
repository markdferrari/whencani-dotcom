'use client';

import { getPosterUrl, TMDBMovie, TMDBGenre } from "@/lib/tmdb";
import { formatReleaseDate } from "@/lib/tmdb";
import { config } from "@/lib/config";
import { WatchlistToggle } from "./WatchlistToggle";
import { useWatchlistIds } from "@/hooks/use-watchlist";
import { MediaCard, ReleaseBadge, isReleasedRecently } from "@whencani/ui";

type MovieCardProps = {
  movie: TMDBMovie;
  genres?: TMDBGenre[];
  size?: "md" | "sm";
  hideRating?: boolean;
  /** make the card horizontal on small screens with larger poster on the left */
  mobileLayout?: 'stack' | 'side';
  /** where to render the watchlist toggle (default: title row) */
  watchlistTogglePosition?: 'title' | 'below-genres';
};

export function MovieCard({ movie, genres = [], size = "md", hideRating = false, mobileLayout = 'stack', watchlistTogglePosition = 'title' }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path, size === "md" ? "w342" : "w300");
  const summary = movie.overview
    ? movie.overview.length > 110
      ? `${movie.overview.slice(0, 110)}…`
      : movie.overview
    : "Release details are coming soon.";
  const genreNames = genres && movie.genre_ids ? genres.filter(g => movie.genre_ids?.includes(g.id)).map(g => g.name) : [];

  const watchlistIds = useWatchlistIds();
  const isInWatchlist = watchlistIds.includes(movie.id);
  const isReleased = isReleasedRecently(movie.release_date, 0);
  const featureEnabled = config.features.watchlistImprovements;
  const showBadge = featureEnabled && isInWatchlist && isReleased;

  return (
    <MediaCard
      id={movie.id}
      href={`/movie/${movie.id}`}
      title={movie.title}
      imageUrl={posterUrl || undefined}
      imageAlt={`${movie.title} poster`}
      releaseDate={formatReleaseDate(movie.release_date)}
      summary={summary}
      genres={genreNames}
      rating={hideRating ? undefined : movie.vote_average}
      ratingCount={hideRating ? undefined : movie.vote_count}
      size={size}
      mobileLayout={mobileLayout}
      watchlistToggle={<WatchlistToggle movieId={movie.id} />}
      watchlistTogglePosition={watchlistTogglePosition}
      badge={showBadge ? <ReleaseBadge /> : undefined}
    />
  );
}
