import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getGameById, getSimilarGamesById, formatReleaseDate } from '@/lib/igdb';
import { getGameNote } from '@/lib/notes';
import { GameLinks } from '@/components/GameLinks';
import { ReviewSection } from '@/components/ReviewSection';
import { ScreenshotGallery } from '@/components/ScreenshotGallery';
import { SimilarGamesCarousel } from '@/components/SimilarGamesCarousel';
import { TrailerEmbed } from '@/components/TrailerEmbed';
import { WatchlistToggle } from '@/components/WatchlistToggle';

const SITE_URL = 'https://whencaniplayit.com';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ oc?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gameId = parseInt(id, 10);

  if (isNaN(gameId)) {
    return {};
  }

  const game = await getGameById(gameId).catch(() => null);

  if (!game) {
    return {};
  }

  const coverImage = game.cover?.url
    ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
    : undefined;

  const description = game.summary
    ? game.summary.substring(0, 160)
    : `Check out ${game.name} release info, reviews, and ratings on ${SITE_URL}`;

  const platforms =
    game.release_dates
      ?.map((rd) => rd.platform?.name)
      .filter((name): name is string => Boolean(name))
      .filter((name, index, self) => self.indexOf(name) === index) ||
    game.platforms?.map((p) => p.name) ||
    [];

  const platformLabel = platforms.length > 0 ? ` (${platforms.join(', ')})` : '';

  return {
    title: `${game.name}${platformLabel} | WhenCanIPlayIt.com`,
    description,
    alternates: {
      canonical: `${SITE_URL}/game/${gameId}`,
    },
    openGraph: {
      title: `${game.name}${platformLabel}`,
      description,
      url: `${SITE_URL}/game/${gameId}`,
      type: 'video.movie',
      images: coverImage ? [{ url: coverImage, width: 264, height: 352, alt: game.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.name}${platformLabel}`,
      description,
      images: coverImage ? [coverImage] : [],
    },
  };
}

const formatReleaseBadge = (unixSeconds: number) => {
  const now = Date.now();
  const target = unixSeconds * 1000;
  const diffMs = target - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays > 0) {
    return `${diffDays} days away`;
  }

  return `${Math.abs(diffDays)} days ago`;
};

export default async function GameDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const gameId = parseInt(id, 10);

  if (isNaN(gameId)) {
    notFound();
  }

  // Fetch game data, similar games, and user notes in parallel
  const [game, similarGamesData, note] = await Promise.all([
    getGameById(gameId),
    getSimilarGamesById(gameId),
    getGameNote(gameId),
  ]);

  if (!game) {
    notFound();
  }

  // Get the cover image URL
  const coverUrl = game.cover?.url
    ? `/api/image?url=${encodeURIComponent(
        `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`,
      )}`
    : null;

  const coverWrapperClasses =
    'mx-auto w-full max-w-[min(90vw,360px)] min-w-0 overflow-hidden rounded-xl sm:max-w-none';

  // Get screenshots
  const screenshots =
    game.screenshots?.map(
      (s) =>
        `/api/image?url=${encodeURIComponent(
          `https:${s.url.replace('t_thumb', 't_screenshot_big')}`,
        )}`,
    ) || [];

  const similarGames = (similarGamesData ?? [])
    .slice(0, 6)
    .map((similar) => ({
      id: similar.id,
      name: similar.name,
      coverUrl: similar.cover?.url
        ? `/api/image?url=${encodeURIComponent(
            `https:${similar.cover.url.replace('t_thumb', 't_cover_big')}`,
          )}`
        : null,
    }));

  // Get release date
  const releaseDate = game.release_dates?.[0]?.date || game.first_release_date;
  const releaseDateHuman = game.release_dates?.[0]?.human || 
    (releaseDate ? formatReleaseDate(releaseDate) : 'TBA');
  const releaseDateBadge = releaseDate
    ? formatReleaseBadge(releaseDate)
    : 'TBA';

  // Get platforms
  const platforms =
    game.release_dates
      ?.map((rd) => rd.platform?.name)
      .filter((name): name is string => Boolean(name))
      .filter((name, index, self) => self.indexOf(name) === index) ||
    game.platforms?.map((p) => p.name) ||
    [];

  const involvedCompanies = (game.involved_companies ?? []).map((entry) => ({
    id: entry.company.id,
    name: entry.company.name,
    role: entry.developer ? 'Developer' : entry.publisher ? 'Publisher' : undefined,
  }));
  const collectionName = game.collection?.name;

  // Build VideoGame structured data
  const gameUrl = `${SITE_URL}/game/${gameId}`;
  const coverImage = game.cover?.url
    ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
    : undefined;

  const videoGameSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: game.summary || '',
    url: gameUrl,
    image: coverImage,
    gamePlatform: platforms.length > 0 ? platforms : undefined,
    ...(game.first_release_date && {
      datePublished: new Date(game.first_release_date * 1000).toISOString().split('T')[0],
    }),
    ...(game.aggregated_rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (game.aggregated_rating / 10).toFixed(1),
        bestRating: '10',
        worstRating: '0',
      },
    }),
    ...(involvedCompanies.filter((c) => c.role === 'Developer').length > 0 && {
      author: involvedCompanies.filter((c) => c.role === 'Developer').map((c) => ({
        '@type': 'Organization',
        name: c.name,
      })),
    }),
    ...(involvedCompanies.filter((c) => c.role === 'Publisher').length > 0 && {
      publisher: involvedCompanies.filter((c) => c.role === 'Publisher').map((c) => ({
        '@type': 'Organization',
        name: c.name,
      })),
    }),
    ...(game.genres && game.genres.length > 0 && {
      genre: game.genres.map((g) => g.name),
    }),
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_45%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
      />
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-6xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to games
        </Link>

        <div className="grid gap-8 lg:grid-cols-3 min-w-0">
          {/* Left Column - Cover & Meta */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start min-w-0">
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div
                  className="mb-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 px-4 py-3 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
                  data-testid="release-date-hero"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    Release date
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {releaseDateHuman}
                  </div>
                  <div className="text-sm opacity-80">{releaseDateBadge}</div>
                </div>

                {coverUrl ? (
                  <div data-testid="game-cover-wrapper" className={coverWrapperClasses}>
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={coverUrl}
                        alt={`${game.name} video game cover art for ${platforms.length > 0 ? platforms.join(', ') : 'PC'}`}
                        fill
                        unoptimized
                        className="object-cover"
                        priority
                        sizes="(max-width: 640px) min(90vw, 360px), 360px"
                      />
                    </div>
                  </div>
                ) : (
                  <div data-testid="game-cover-wrapper" className={coverWrapperClasses}>
                    <div className="flex aspect-[3/4] h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      No cover available
                    </div>
                  </div>
                )}
              </div>

              {/* External Links - Desktop only */}
              <div className="mt-6 hidden lg:block">
                <GameLinks websites={game.websites} />
              </div>
            </div>

            {/* Reviews & Ratings */}
            <div className="mt-6">
              <ReviewSection
                game={game}
                openCriticIdFromQuery={(() => {
                  const raw = resolvedSearchParams?.oc;
                  if (!raw) return null;
                  const parsed = parseInt(raw, 10);
                  return Number.isNaN(parsed) ? null : parsed;
                })()}
              />
            </div>

          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 min-w-0">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {game.name}
                </h1>
                <WatchlistToggle gameId={game.id} />
              </div>
              {game.genres && game.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {game.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-sky-200/70 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-500/60 dark:bg-sky-900/40 dark:text-sky-200"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              {platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Studios & Involved Companies */}
              {(involvedCompanies.length > 0 || collectionName) && (
                <div className="mt-4 space-y-3">
                  {collectionName && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                        Collection
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {collectionName}
                      </p>
                    </div>
                  )}
                  {involvedCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {involvedCompanies.map((company) => (
                        <span
                          key={company.id}
                          className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-200"
                        >
                          {company.name}
                          {company.role && (
                            <span className="ml-1 text-[0.6rem] font-normal uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                              {company.role}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {game.summary && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  About
                </h2>
                <p className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {game.summary}
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-zinc-200/70 pt-8 dark:border-zinc-800/70" />

            {/* Trailer */}
            {game.videos && game.videos.length > 0 && (
              <div className="mt-8">
                <TrailerEmbed videoId={game.videos[0].video_id} title={game.name} />
              </div>
            )}

            {/* Screenshots */}
            {screenshots.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Screenshots
                </h2>
                <div className="mt-4">
                  <ScreenshotGallery screenshots={screenshots} title={game.name} />
                </div>
              </div>
            )}

            {/* Personal Notes */}
            {note && (
              <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  📝 My Notes
                </h2>
                {note.data.hype_level && (
                  <div className="mt-2">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Hype Level: {note.data.hype_level}
                    </span>
                  </div>
                )}
                <div className="prose prose-zinc mt-4 max-w-none dark:prose-invert">
                  {note.content.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h3>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4">{line.replace('- ', '')}</li>;
                    } else if (line.trim()) {
                      return <p key={index} className="mb-2">{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {/* External Links - Mobile only */}
              <div className="lg:hidden">
                <GameLinks websites={game.websites} />
              </div>

              {similarGames.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Similar games
                  </h2>
                  {/* Mobile carousel */}
                  <div className="lg:hidden">
                    <SimilarGamesCarousel games={similarGames} />
                  </div>
                  {/* Desktop grid */}
                  <div className="hidden lg:grid gap-4 lg:grid-cols-3">
                    {similarGames.map((similar) => (
                      <Link
                        key={similar.id}
                        href={`/game/${similar.id}`}
                        className="group mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <div className="relative aspect-[3/4]">
                          {similar.coverUrl ? (
                            <Image
                              src={similar.coverUrl}
                              alt={`${similar.name} - Video game cover art`}
                              fill
                              sizes="(max-width: 768px) 90vw, 180px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-zinc-100 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                              No cover
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-3 text-sm font-semibold">
                          {similar.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
