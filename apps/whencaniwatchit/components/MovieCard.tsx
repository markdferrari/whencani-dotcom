'use client';

import { getPosterUrl, TMDBMovie, TMDBGenre } from "@/lib/tmdb";
import { formatReleaseDate } from "@/lib/tmdb";
import { WatchlistToggle } from "./WatchlistToggle";
import { MediaCard } from "@whencani/ui";

type MovieCardProps = {
  movie: TMDBMovie;
  genres?: TMDBGenre[];
  size?: "md" | "sm";
};

export function MovieCard({ movie, genres = [], size = "md" }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path, size === "md" ? "w342" : "w300");
  const summary = movie.overview
    ? movie.overview.length > 110
      ? `${movie.overview.slice(0, 110)}…`
      : movie.overview
    : "Release details are coming soon.";
  const genreNames = genres && movie.genre_ids ? genres.filter(g => movie.genre_ids?.includes(g.id)).map(g => g.name) : [];

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
      rating={movie.vote_average}
      ratingCount={movie.vote_count}
      watchlistToggle={<WatchlistToggle movieId={movie.id} />}
      size={size}
    />
  );
}
