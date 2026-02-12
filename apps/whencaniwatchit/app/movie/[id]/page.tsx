import { type Metadata, type ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import {
  formatReleaseDate,
  getBackdropUrl,
  getMovieCredits,
  getMovieDetails,
  getMovieImages,
  getMovieVideos,
  getPersonExternalIds,
  getPosterUrl,
  getProfileUrl,
} from "@/lib/tmdb";
import FindShowtimes from "@/components/FindShowtimes/FindShowtimes";
import { buildMovieCanonical } from "@/lib/seo";
import { MovieSchema, BreadcrumbListSchema } from "@/lib/schema";
import { DetailBackLink } from "@whencani/ui/detail-back-link";
import { DetailHeroCard } from "@whencani/ui/detail-hero-card";
import { MediaCarousel } from "@whencani/ui/media-carousel";
import MediaCarouselCombined from "@whencani/ui/media-carousel-combined";

type MoviePageProps = {
  params: Promise<{ id: string }>;
};

const formatRuntime = (runtime: number | null) => {
  if (!runtime) {
    return null;
  }
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
};

export async function generateMetadata(
  { params }: MoviePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { id } = await params;
    const movie = await getMovieDetails(id);

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    const title = `${movie.title}${releaseYear ? ` (${releaseYear})` : ""} — Release Date & Where to Watch`;
    const description =
      movie.overview || "Discover release dates, trailers, cast, and where to watch this movie.";

    const backdropUrl = getBackdropUrl(movie.backdrop_path, "w1280");
    const posterUrl = getPosterUrl(movie.poster_path, "w342");
    const imageUrl = backdropUrl || posterUrl;

    const canonical = buildMovieCanonical("https://whencaniwatchit.com", id);

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "video.movie",
        images: imageUrl ? [{ url: imageUrl, alt: `${movie.title} poster` }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: "Movie Details",
      description: "View movie details, release dates, and where to watch.",
    };
  }
}
export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;

  const [movie, credits, videos, images] = await Promise.all([
    getMovieDetails(id),
    getMovieCredits(id),
    getMovieVideos(id),
    getMovieImages(id),
  ]);

  const posterUrl = getPosterUrl(movie.poster_path, "w342");
  const backdropUrl = getBackdropUrl(movie.backdrop_path, "w1280");
  const topCastRaw = credits.cast
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 10);

  const externalIds = await Promise.all(
    topCastRaw.map(async (member) => {
      try {
        return await getPersonExternalIds(member.id);
      } catch {
        return null;
      }
    }),
  );

  const topCast = topCastRaw.map((member, index) => {
    const imdbId = externalIds[index]?.imdb_id ?? null;
    return {
      id: member.id,
      name: member.name,
      character: member.character,
      department: member.known_for_department ?? null,
      profileUrl: getProfileUrl(member.profile_path),
      imdbUrl: imdbId ? `https://www.imdb.com/name/${imdbId}/` : null,
    };
  });

  const youtubeVideos = videos.results.filter((video) =>
    video.site?.toLowerCase?.() === "youtube",
  );
  const trailerVideo =
    youtubeVideos.find((video) => video.type?.toLowerCase?.().includes("trailer") && video.official) ??
    youtubeVideos[0];
  const trailerEmbedUrl = trailerVideo
    ? `https://www.youtube.com/embed/${trailerVideo.key}?rel=0&modestbranding=1`
    : null;

  // Get backdrop images for screenshots, sorted by vote average, limit to 5
  const screenshotUrls = images.backdrops
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 5)
    .map((img) => getBackdropUrl(img.file_path, "w1280"))
    .filter((url): url is string => url !== null);

  const director = credits.crew.find((member) => member.job === "Director")?.name;
  const producers = credits.crew
    .filter((member) => member.job === "Producer")
    .slice(0, 3)
    .map((member) => member.name);

  // Generate structured data schemas
  const movieSchemaJson = MovieSchema("https://whencaniwatchit.com", {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    release_date: movie.release_date,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    director,
    cast: topCast.slice(0, 5).map((actor) => ({ name: actor.name })),
  });

  const breadcrumbSchemaJson = BreadcrumbListSchema("https://whencaniwatchit.com", movie.title);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: movieSchemaJson }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchemaJson }}
        suppressHydrationWarning
      />
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl">
        <DetailBackLink href="/" />

        {/* Hero Card */}
        <DetailHeroCard
          title={movie.title}
          backdropUrl={backdropUrl}
          posterUrl={posterUrl}
          posterAlt={`${movie.title} poster`}
          className="mt-6"
        >
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {movie.title}
              </h1>
              <WatchlistToggle movieId={Number(id)} className="shadow" />
            </div>            
            {movie.tagline && (
              <p className="mt-2 text-sm italic text-zinc-600 dark:text-zinc-300">
                {movie.tagline}
              </p>
            )}
          </div>

          {/* Release date */}
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-sky-500/30">
              {formatReleaseDate(movie.release_date)}
            </span>
          </div>

          {/* Other metadata */}
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            <span className="rounded-full bg-zinc-50 px-3 py-1 dark:bg-zinc-900/70">
              {movie.vote_average.toFixed(1)} / 10
            </span>
            {formatRuntime(movie.runtime) && (
              <span className="rounded-full bg-zinc-50 px-3 py-1 dark:bg-zinc-900/70">
                {formatRuntime(movie.runtime)}
              </span>
            )}
            {director && (
              <span className="rounded-full bg-zinc-50 px-3 py-1 dark:bg-zinc-900/70">
                Dir. {director}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/?view=upcoming&genre=${genre.id}`}
                className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400"
              >
                {genre.name}
              </Link>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {movie.overview || "Synopsis is not available yet."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Studio
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {movie.production_companies?.[0]?.name ?? "TBD"}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Producers
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {producers.length > 0 ? producers.join(", ") : "TBD"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-300">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Reviews (placeholder)
            </p>
            <p className="mt-2">
              This is where OpenCritic-style badges and reviews will plug in later.
            </p>
          </div>
        </DetailHeroCard>

        {/* Trailer / Media carousel */}
        {(trailerEmbedUrl || screenshotUrls.length > 0) && (
          <MediaCarouselCombined
            trailerEmbedUrl={trailerEmbedUrl}
            screenshots={screenshotUrls}
            title={movie.title}
            unoptimized
            className="mt-6"
          />
        )}

        {/* Find Showtimes */}
        <section className="mt-6 rounded-3xl shadow-sm sm:p-10">
          <FindShowtimes />
        </section>

        {/* Cast */}
        <MediaCarousel label="Cast" subtitle="Top billed" className="mt-8">
          {topCast.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                {member.profileUrl ? (
                  member.imdbUrl ? (
                    <a
                      href={member.imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      aria-label={`View ${member.name} on IMDb`}
                    >
                      <Image
                        src={member.profileUrl}
                        alt={member.name}
                        fill
                        className="object-cover transition duration-200 hover:scale-[1.02]"
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                      />
                    </a>
                  ) : (
                    <Image
                      src={member.profileUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                    No photo
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {member.name}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {member.character}
              </p>
              {member.department && (
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">
                  {member.department}
                </p>
              )}
            </div>
          ))}
        </MediaCarousel>
      </main>
    </div>
    </>
  );
}
