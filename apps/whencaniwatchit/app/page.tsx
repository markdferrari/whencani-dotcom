import { type Metadata, type ResolvingMetadata } from "next";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import {
  getMovieGenres,
  getNowPlayingMovies,
  getTrendingTheatrical,
  getTrendingStreaming,
  getNowStreamingRecent,
  getNowStreamingTVRecent,
  getUpcomingMovies,
  TMDBGenre,
  TMDBMovie,
} from "@/lib/tmdb";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { GenreFilter } from "./GenreFilter";
import FindShowtimes from "@/components/FindShowtimes/FindShowtimes";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { buildCanonicalPath } from "@/lib/seo";
import { MovieItemListSchema } from "@/lib/schema";

interface PageProps {
  searchParams: Promise<{ view?: string; genre?: string; provider?: string }>;
}

export async function generateMetadata(
  { searchParams }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await searchParams;
  const view = params.view || "upcoming";
  const genreId = params.genre ? parseInt(params.genre, 10) : undefined;

  try {
    const genres = await getMovieGenres();
    const genreName = genreId
      ? genres.find((g) => g.id === genreId)?.name
      : undefined;

    const viewLabel = view === "recent" ? "Now Playing" : view === "streaming" ? "Now Streaming" : view === "tv" ? "TV Shows Now Streaming" : "Coming Soon";
    const baseTitle = genreName
      ? `${genreName} Movies ${viewLabel}`
      : `Upcoming Movies & Release Dates`;

    const description = genreName
      ? `Discover upcoming ${genreName.toLowerCase()} movies and release dates. Track releases, find showtimes, and save your favourites.`
      : view === "recent"
        ? "Browse movies currently in theatres and streaming. Find showtimes and watch now."
        : view === "streaming"
          ? "Browse recently released movies available on streaming platforms. Find where to watch and save favourites."
          : view === "tv"
            ? "Browse recently released TV shows available on streaming platforms. Find where to watch and save favourites."
            : "Track upcoming movie releases and streaming dates. Browse by genre and find showtimes.";

    const canonical = buildCanonicalPath("https://whencaniwatchit.com", {
      view: view !== "upcoming" ? view : undefined,
      genre: params.genre,
      provider: params.provider,
    });

    return {
      title: baseTitle,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title: baseTitle,
        description,
        url: canonical,
        type: "website",
      },
    };
  } catch (error) {
    // Fallback to defaults
    return {
      title: "Upcoming Movies & Release Dates",
      description:
        "Track new and upcoming movie releases with TMDB data. Browse by genre and save your favourite films.",
    };
  }
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view || "upcoming";
  const genreParam = params.genre ? parseInt(params.genre, 10) : undefined;
  const genreId = typeof genreParam === "number" && !Number.isNaN(genreParam) ? genreParam : undefined;
  const providerParam = params.provider ? parseInt(params.provider, 10) : undefined;
  const providerId = typeof providerParam === "number" && !Number.isNaN(providerParam) ? providerParam : undefined;
  
  let trendingTheatricalMovies: TMDBMovie[] = [];
  let trendingStreamingMovies: TMDBMovie[] = [];
  let displayedMovies: TMDBMovie[] = [];
  let genres: TMDBGenre[] = [];
  let error: string | null = null;

  try {
    [trendingTheatricalMovies, trendingStreamingMovies, genres] = await Promise.all([
      getTrendingTheatrical(8),
      getTrendingStreaming(8),
      getMovieGenres(),
    ]);

    if (view === "recent") {
      displayedMovies = await getNowPlayingMovies(9);
    } else if (view === "streaming") {
      displayedMovies = await getNowStreamingRecent(12, genreId, providerId);
    } else if (view === "tv") {
      displayedMovies = await getNowStreamingTVRecent(12, genreId, providerId);
    } else {
      displayedMovies = await getUpcomingMovies(12, genreId, providerId);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load TMDB data";
  }

  // Generate ItemList schema for structured data
  const schemaJson = displayedMovies.length > 0 ? MovieItemListSchema("https://whencaniwatchit.com", displayedMovies) : null;

  return (
    <>
      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
          suppressHydrationWarning
        />
      )}
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
        <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 max-w-7xl flex flex-col gap-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_260px] gap-6 lg:gap-8 items-start">
          <section className="rounded-3xl border border-zinc-200/70 bg-white/90 px-5 py-4 sm:p-10 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
            <h1 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Track every release that matters to you.
            </h1>
            <p className="mt-2 sm:mt-4 text-sm sm:text-lg text-zinc-600 dark:text-zinc-300">
              Upcoming releases, streaming dates, and theater showtimes—all in one place.
            </p>
          </section>
          <aside className="hidden lg:block min-w-0 w-full">
            <RecentlyViewedSection />
          </aside>
        </div>

        {trendingTheatricalMovies.length > 0 && (
          <TrendingCarousel movies={trendingTheatricalMovies} title="Trending in cinema" />
        )}
        {trendingStreamingMovies.length > 0 && (
          <TrendingCarousel movies={trendingStreamingMovies} title="Trending on streaming" />
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap sm:flex-nowrap gap-3">
                <Link
                  href="/?view=upcoming"
                  scroll={false}
                  className={`rounded-full px-6 py-2 text-sm font-semibold shadow-lg transition ${
                    view === "upcoming"
                      ? "bg-sky-500 text-white shadow-sky-500/40"
                      : "border border-zinc-200 text-zinc-600 hover:border-sky-500 dark:border-zinc-800/60 dark:text-zinc-300"
                  }`}
                >
                  Coming Soon
                </Link>
                <Link
                  href="/?view=recent"
                  scroll={false}
                  className={`rounded-full px-6 py-2 text-sm font-semibold shadow-lg transition ${
                    view === "recent"
                      ? "bg-sky-500 text-white shadow-sky-500/40"
                      : "border border-zinc-200 text-zinc-600 hover:border-sky-500 dark:border-zinc-800/60 dark:text-zinc-300"
                  }`}
                >
                  Now In Cinemas
                </Link>
                <Link
                  href="/?view=tv"
                  scroll={false}
                  className={`rounded-full px-6 py-2 text-sm font-semibold shadow-lg transition ${
                    view === "tv"
                      ? "bg-sky-500 text-white shadow-sky-500/40"
                      : "border border-zinc-200 text-zinc-600 hover:border-sky-500 dark:border-zinc-800/60 dark:text-zinc-300"
                  }`}
                >
                  Now Streaming (TV)
                </Link>
                <Link
                  href="/?view=streaming"
                  scroll={false}
                  className={`rounded-full px-6 py-2 text-sm font-semibold shadow-lg transition ${
                    view === "streaming"
                      ? "bg-sky-500 text-white shadow-sky-500/40"
                      : "border border-zinc-200 text-zinc-600 hover:border-sky-500 dark:border-zinc-800/60 dark:text-zinc-300"
                  }`}
                >
                  Now Streaming (Movies)
                </Link>
              </div>
              <GenreFilter genres={genres} currentGenreId={genreId} />
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  genres={genres}
                  hideRating={view === "upcoming" || view === "tv"}
                  hrefBase={view === "tv" ? "/show" : "/movie"}
                />
              ))}
            </div>

            <div className="mt-6">
              <FindShowtimes />
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
