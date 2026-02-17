import { MovieCard } from "./MovieCard";
import { TMDBMovie } from "@/lib/tmdb";

type NowPlayingGridProps = {
  movies: TMDBMovie[];
};

export function NowPlayingGrid({ movies }: NowPlayingGridProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Now In Cinemas</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} size="sm" />
        ))}
      </div>
    </div>
  );
}
