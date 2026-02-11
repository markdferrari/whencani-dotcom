import { type Metadata, type ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import {
  formatReleaseDate,
  getMovieGenres,
  getNowPlayingMovies,
  getPosterUrl,
  getTrendingTheatrical,
  getTrendingStreaming,
  getUpcomingMovies,
  TMDBGenre,
  TMDBMovie,
} from "@/lib/tmdb";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { GenreFilter } from "./GenreFilter";
import FindShowtimes from "@/components/FindShowtimes/FindShowtimes";
import { buildCanonicalPath } from "@/lib/seo";
import { MovieItemListSchema } from "@/lib/schema";
// import { PlatformFilter } from "./PlatformFilter";

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

    const viewLabel = view === "recent" ? "Now Playing" : "Coming Soon";
    const baseTitle = genreName
      ? `${genreName} Movies ${viewLabel}`
      : `Upcoming Movies & Release Dates`;

    const description = genreName
      ? `Discover upcoming ${genreName.toLowerCase()} movies and release dates. Track releases, find showtimes, and save your favourites.`
      : view === "recent"
        ? "Browse movies currently in theatres and streaming. Find showtimes and watch now."
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
        <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl flex flex-col gap-10">
        <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <h1 className="mt-4 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Track every movie release that matters to you.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            Upcoming releases, streaming dates, and theater showtimes—all in one place.
          </p>
        </section>

        <div className="flex flex-col lg:grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)_140px]">
          <aside className="space-y-6 min-w-0">
            {trendingTheatricalMovies.length > 0 && (
              <div className="space-y-2">
                <TrendingCarousel movies={trendingTheatricalMovies} title="Trending in cinema" />
              </div>
            )}
            {trendingStreamingMovies.length > 0 && (
              <div className="space-y-2">
                <TrendingCarousel movies={trendingStreamingMovies} title="Trending on streaming" />
              </div>
            )}
          </aside>

          <aside className="space-y-6 min-w-0 lg:order-last">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
              <div className="mt-4 grid gap-4">
                <GenreFilter genres={genres} currentGenreId={genreId} />
                {/* <PlatformFilter currentProviderId={providerId} /> */}
              </div>
            </div>

            <FindShowtimes />
          </aside>

          <section className="space-y-6 min-w-0">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {error}
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
                  <div className="flex gap-3">
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
                      Now Playing
                    </Link>
                  </div>
                  <div className="mt-5 space-y-4">
                    {displayedMovies.map((movie) => (
                      <Link key={movie.id} href={`/movie/${movie.id}`} className="group block max-w-2xl mx-auto">
                        <article className="relative grid gap-4 rounded-2xl border border-zinc-100/80 bg-white p-4 shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:grid-cols-[72px_minmax(0,1fr)]">
                          <div className="absolute right-3 top-3">
                            <WatchlistToggle movieId={movie.id} className="shadow" />
                          </div>
                          <div className="relative aspect-[2/3] w-[72px] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                            {getPosterUrl(movie.poster_path, "w154") ? (
                              <Image
                                src={getPosterUrl(movie.poster_path, "w154")!}
                                alt={`${movie.title} poster`}
                                fill
                                className="object-cover"
                                sizes="72px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[0.55rem] uppercase tracking-[0.4em] text-zinc-400">
                                No
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
                              {formatReleaseDate(movie.release_date)}
                            </p>
                            <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-sky-500 dark:text-zinc-50">
                              {movie.title}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {movie.overview || "Awaited release detail is coming soon."}
                            </p>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
    </>
  );
}
