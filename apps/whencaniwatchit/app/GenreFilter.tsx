"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TMDBGenre } from "@/lib/tmdb";

type GenreFilterProps = {
  genres: TMDBGenre[];
  currentGenreId?: number;
};

export function GenreFilter({ genres, currentGenreId }: GenreFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genreValue = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    // Filters apply to the upcoming list. If you're on another view, switch to upcoming.
    params.set("view", "upcoming");
    
    if (genreValue) {
      params.set("genre", genreValue);
    } else {
      params.delete("genre");
    }
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
      Genre
      <select
        defaultValue={currentGenreId?.toString() || ""}
        onChange={handleGenreChange}
        className="mt-1 w-auto min-w-[140px] rounded-xl border border-zinc-200/70 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
      >
        <option value="">All genres</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id.toString()}>
            {genre.name}
          </option>
        ))}
      </select>
    </label>
  );
}
