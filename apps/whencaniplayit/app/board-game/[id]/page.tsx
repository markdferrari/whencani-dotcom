import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DetailBackLink } from '@whencani/ui/detail-back-link';
import { DetailHeroCard } from '@whencani/ui/detail-hero-card';
import { ShareButton , LatestNews } from '@whencani/ui';
import { RecordView } from '@/components/RecordView';
import { BoardGameWatchlistToggle } from '@/components/BoardGameWatchlistToggle';
import { getBoardGameById, stripHtml } from '@/lib/bgg';
import { getAmazonBoardGameUrl } from '@/lib/amazon';
import { config } from '@/lib/config';

const SITE_URL = 'https://whencaniplayit.com';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gameId = parseInt(id, 10);
  if (isNaN(gameId)) return {};

  const game = await getBoardGameById(gameId).catch(() => null);
  if (!game) return {};

  const image = game.image || game.thumbnail;
  const plainDescription = game.description ? stripHtml(game.description).substring(0, 160) : `${game.name} — board game details on WhenCanIPlayIt.com`;

  return {
    title: `${game.name} | WhenCanIPlayIt.com`,
    description: plainDescription,
    alternates: { canonical: `${SITE_URL}/board-game/${gameId}` },
    openGraph: {
      title: game.name,
      description: plainDescription,
      url: `${SITE_URL}/board-game/${gameId}`,
      images: image ? [{ url: image, alt: game.name }] : [],
    },
  };
}

export default async function BoardGamePage({ params }: PageProps) {
  const { id } = await params;
  const gameId = parseInt(id, 10);
  if (isNaN(gameId)) notFound();

  const game = await getBoardGameById(gameId);
  if (!game) notFound();

  const backdropUrl = game.image ?? null;
  const posterUrl = game.image ?? game.thumbnail ?? null;
  const releaseDate = game.yearPublished ? String(game.yearPublished) : 'TBA';
  const amazonUrl = config.features.amazonAffiliates ? getAmazonBoardGameUrl(game.name) : null;
  const plainDescription = game.description ? stripHtml(game.description) : null;
  const roundedRating = game.rating ? Math.round(game.rating * 10) / 10 : null;

  const designers = game.designers ?? [];
  const publishers = game.publishers ?? [];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.name,
    description: plainDescription ?? '',
    image: posterUrl ? [posterUrl] : undefined,
    url: `${SITE_URL}/board-game/${gameId}`,
    sku: String(game.id),
    category: game.categories,
    ...(game.rating && game.numRatings && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating.toFixed(1),
        bestRating: '10',
        worstRating: '0',
        ratingCount: game.numRatings,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.06),_transparent_45%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl">
        <DetailBackLink href="/" />

        <DetailHeroCard
          title={game.name}
          backdropUrl={backdropUrl}
          posterUrl={posterUrl}
          posterAlt={`${game.name} box art`}
          posterAspect="3/4"
          posterUnoptimized
          className="mt-6"
          posterFooter={amazonUrl ? (
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 block text-center text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Search on Amazon
            </a>
          ) : undefined}
        >
          <div className="flex items-start justify-between gap-4">
            <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">{game.name}</h1>
            <div className="flex items-center gap-2">
              <ShareButton title={`${game.name} — WhenCanIPlayIt.com`} text={`Check out ${game.name} on WhenCanIPlayIt.com`} url={`https://whencaniplayit.com/board-game/${game.id}`} />
              <BoardGameWatchlistToggle gameId={game.id} className="shadow" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="rounded-full bg-violet-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-violet-500/30">{releaseDate}</span>
            {game.minPlayers != null && game.maxPlayers != null && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-300">{game.minPlayers === game.maxPlayers ? `${game.minPlayers} player` : `${game.minPlayers}\u2013${game.maxPlayers} players`}</span>
            )}
            {game.playingTime != null && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-300">{`${game.playingTime} min`}</span>
            )}
            {game.minAge != null && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-300">{`Age ${game.minAge}+`}</span>
            )}
          </div>

          {/* BGG Rating */}
          {roundedRating != null && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{roundedRating}</span>
              <span className="text-sm text-zinc-500">/10</span>
              {game.numRatings != null && (
                <span className="text-xs text-zinc-400">({game.numRatings.toLocaleString()} ratings)</span>
              )}
            </div>
          )}

          {game.categories && game.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {game.categories.slice(0, 6).map((c) => (
                <span key={c} className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 transition hover:border-violet-500 hover:text-violet-600 dark:border-zinc-800/70 dark:text-zinc-300 dark:hover:border-violet-400 dark:hover:text-violet-400">{c}</span>
              ))}
            </div>
          )}

          {/* Description — plain text, sanitised */}
          {plainDescription ? (
            <details className="group mt-6">
              <summary className="cursor-pointer list-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <span className="line-clamp-2 group-open:line-clamp-none">
                  {plainDescription}
                </span>
                <span className="mt-1 block text-xs font-semibold text-violet-600 group-open:hidden dark:text-violet-400">
                  Show more
                </span>
                <span className="mt-1 hidden text-xs font-semibold text-violet-600 group-open:block dark:text-violet-400">
                  Show less
                </span>
              </summary>
            </details>
          ) : (
            <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">No description available.</p>
          )}

          {/* Designer / Publisher info cards */}
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Designer
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {designers.length > 0 ? designers.join(', ') : 'Unknown'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Publisher
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                {publishers.length > 0 ? publishers.join(', ') : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Mechanics */}
          {game.mechanics && game.mechanics.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500 mb-2">Mechanics</p>
              <div className="flex flex-wrap gap-2">
                {game.mechanics.slice(0, 8).map((m) => (
                  <span key={m} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">{m}</span>
                ))}
              </div>
            </div>
          )}

          <LatestNews productName={game.name} productType="boardgame" />

        </DetailHeroCard>

        <RecordView item={{ id: game.id, title: game.name, imageUrl: posterUrl ?? null, href: `/board-game/${game.id}`, releaseDate }} />
      </main>
    </div>
  );
}
