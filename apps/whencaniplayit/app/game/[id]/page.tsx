import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getGameById, getSimilarGamesById, formatReleaseDate } from '@/lib/igdb';
import { getGameNote } from '@/lib/notes';
import { GameLinks } from '@/components/GameLinks';
import { LatestNews } from '@/components/LatestNews';
import { ReviewSection } from '@/components/ReviewSection';
import { WatchlistToggle } from '@/components/WatchlistToggle';
import { GameRemindMeButton } from '@/components/GameRemindMeButton';
import { RecordView } from '@/components/RecordView';
import { DetailBackLink } from '@whencani/ui/detail-back-link';
import { DetailHeroCard } from '@whencani/ui/detail-hero-card';
import { MediaCarousel } from '@whencani/ui/media-carousel';
import MediaCarouselCombined from '@whencani/ui/media-carousel-combined';
import { ShareButton } from '@whencani/ui';
import { config } from '@/lib/config';
import { getAmazonAffiliateUrl, getPlatformFamilyId } from '@/lib/amazon';

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

  // Get first screenshot as backdrop
  const backdropUrl = screenshots[0] ?? null;

  // Build trailer embed URL
  const trailerEmbedUrl = game.videos?.[0]?.video_id
    ? `https://www.youtube.com/embed/${game.videos[0].video_id}?rel=0&modestbranding=1`
    : null;

  // Developers and publishers for the info cards
  const developers = involvedCompanies.filter((c) => c.role === 'Developer');
  const publishers = involvedCompanies.filter((c) => c.role === 'Publisher');

  // Determine Amazon affiliate link based on platform priority
  const amazonAffiliateUrl = config.features.amazonAffiliates
    ? getAmazonAffiliateUrl(game.name, game.external_games)
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
      />
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl">
        <DetailBackLink href="/" />

        {/* Hero Card — backdrop, small cover left, details right */}
        <DetailHeroCard
          title={game.name}
          backdropUrl={backdropUrl}
          posterUrl={coverUrl}
          posterAlt={`${game.name} video game cover art for ${platforms.length > 0 ? platforms.join(', ') : 'PC'}`}
          posterAspect="3/4"
          posterUnoptimized
          className="mt-6"
          posterFooter={amazonAffiliateUrl ? (
            <a
              href={amazonAffiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 block text-center text-sm font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Get it on Amazon
            </a>
          ) : undefined}
        >
          {/* Category label + Watchlist */}
          <div>
            <div className="flex items-start justify-between gap-4">
            <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {game.name}
            </h1>
              <div className="flex items-center gap-2">
                <ShareButton
                  title={`${game.name} — WhenCanIPlayIt.com`}
                  text={releaseDateHuman === 'TBA' ? `Check out ${game.name} on WhenCanIPlayIt.com` : `${game.name} releases on ${releaseDateHuman}. Check it out!`}
                  url={`https://whencaniplayit.com/game/${id}`}
                />
                <WatchlistToggle gameId={game.id} className="shadow" />
                <GameRemindMeButton
                  itemId={game.id}
                  itemTitle={game.name}
                  releaseDate={releaseDate ? new Date(releaseDate * 1000).toISOString().split('T')[0] : null}
                  className="shadow"
                />
              </div>
            </div>
          </div>

          {/* Release date */}
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-sky-500/30">
              {releaseDateHuman}
            </span>
            {releaseDateBadge !== releaseDateHuman && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:bg-zinc-900/70 dark:text-sky-400">
                {releaseDateBadge}
              </span>
            )}
          </div>

          {/* Platform pills */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {platforms.slice(0, 5).map((platform) => {
                const platformId = getPlatformFamilyId(platform);
                return platformId ? (
                  <Link
                    key={platform}
                    href={`/?platform=${platformId}`}
                    className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 transition hover:bg-sky-500 hover:text-white dark:bg-zinc-900/70 dark:hover:bg-sky-500"
                  >
                    {platform}
                  </Link>
                ) : (
                  <span key={platform} className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:bg-zinc-900/70">
                    {platform}
                  </span>
                );
              })}
            </div>
          )}

          {/* Genre tags */}
          {game.genres && game.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/?genre=${genre.id}`}
                  className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          )}

          {/* Reviews — above description */}
          <ReviewSection
            game={game}
            openCriticIdFromQuery={(() => {
              const raw = resolvedSearchParams?.oc;
              if (!raw) return null;
              const parsed = parseInt(raw, 10);
              return Number.isNaN(parsed) ? null : parsed;
            })()}
          />

          {/* Summary — collapsible, 2-line preview */}
          {game.summary ? (
            <details className="group">
              <summary className="cursor-pointer list-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <span className="line-clamp-2 group-open:line-clamp-none">
                  {game.summary}
                </span>
                <span className="mt-1 block text-xs font-semibold text-sky-600 group-open:hidden dark:text-sky-400">
                  Show more
                </span>
                <span className="mt-1 hidden text-xs font-semibold text-sky-600 group-open:block dark:text-sky-400">
                  Show less
                </span>
              </summary>
            </details>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              Synopsis is not available yet.
            </p>
          )}

          {/* Studio / Publisher info cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Developer
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {developers.length > 0 ? developers.map((d) => d.name).join(', ') : 'TBD'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Publisher
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {publishers.length > 0 ? publishers.map((p) => p.name).join(', ') : 'TBD'}
              </p>
            </div>
          </div>

          {/* Collection badge */}
          {collectionName && (
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Collection
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">{collectionName}</p>
            </div>
          )}

          {/* Latest News */}
          <LatestNews productName={game.name} productType="game" />

        </DetailHeroCard>

        {(trailerEmbedUrl || screenshots.length > 0) && (
          <MediaCarouselCombined
            trailerEmbedUrl={trailerEmbedUrl}
            screenshots={screenshots}
            title={game.name}
            unoptimized
            className="mt-6"
          />
        )}

        {/* Personal Notes */}
        {note && (
          <section className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              📝 My Notes
            </p>
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
          </section>
        )}

        {/* External Links */}
        {game.websites && game.websites.length > 0 && (
          <div className="mt-6">
            <GameLinks websites={game.websites} />
          </div>
        )}

        {/* Similar Games — carousel section matching Cast section style */}
        {similarGames.length > 0 && (
          <MediaCarousel
            label="You might also like"
            slideBasis="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]"
            className="mt-8"
          >
            {similarGames.map((similar) => (
              <Link
                key={similar.id}
                href={`/game/${similar.id}`}
                className="block rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-blue-400 dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  {similar.coverUrl ? (
                    <Image
                      src={similar.coverUrl}
                      alt={`${similar.name} cover`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                      No cover
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {similar.name}
                </p>
              </Link>
            ))}
          </MediaCarousel>
        )}
      </main>
      <RecordView
        item={{
          id: gameId,
          title: game.name,
          imageUrl: coverUrl,
          href: `/game/${gameId}`,
          releaseDate: releaseDateHuman,
        }}
      />
    </div>
  );
}
