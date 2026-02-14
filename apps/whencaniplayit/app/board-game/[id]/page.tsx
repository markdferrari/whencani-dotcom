import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DetailBackLink } from '@whencani/ui/detail-back-link';
import { DetailHeroCard } from '@whencani/ui/detail-hero-card';
import { ShareButton } from '@whencani/ui';
import { RecordView } from '@/components/RecordView';
import { BoardGameWatchlistToggle } from '@/components/BoardGameWatchlistToggle';
import { getBoardGameById } from '@/lib/bgg';
import { getAmazonBoardGameUrl } from '@/lib/amazon';

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
  const description = game.description ? game.description.substring(0, 160) : `${game.name} — board game details on WhenCanIPlayIt.com`;

  return {
    title: `${game.name} | WhenCanIPlayIt.com`,
    description,
    alternates: { canonical: `${SITE_URL}/board-game/${gameId}` },
    openGraph: {
      title: game.name,
      description,
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
  const amazonUrl = getAmazonBoardGameUrl(game.name);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.name,
    description: game.description ?? '',
    image: posterUrl ? [posterUrl] : undefined,
    url: `${SITE_URL}/board-game/${gameId}`,
    sku: String(game.id),
    category: game.categories,
  } as unknown;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.06),_transparent_45%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <DetailBackLink href="/" />

        <DetailHeroCard
          title={game.name}
          backdropUrl={backdropUrl}
          posterUrl={posterUrl}
          posterAlt={`${game.name} box art`}
          posterAspect="1/1"
          posterUnoptimized
          className="mt-6"
          posterFooter={
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 block text-center text-sm font-medium text-violet-600 hover:text-violet-500"
              onClick={(e) => e.stopPropagation()}
            >
              Search on Amazon
            </a>
          }
        >
          <div className="flex items-start justify-between gap-4">
            <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">{game.name}</h1>
            <div className="flex items-center gap-2">
              <ShareButton title={`${game.name} — WhenCanIPlayIt.com`} text={`Check out ${game.name} on WhenCanIPlayIt.com`} url={`https://whencaniplayit.com/board-game/${game.id}`} />
              <BoardGameWatchlistToggle gameId={game.id} className="shadow" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-violet-700">{releaseDate}</span>
            {game.minPlayers && game.maxPlayers && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600 dark:bg-zinc-900/70">{`${game.minPlayers}-${game.maxPlayers} players`}</span>
            )}
            {game.playingTime && (
              <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600 dark:bg-zinc-900/70">{`${game.playingTime} mins`}</span>
            )}
          </div>

          {game.categories && game.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {game.categories.slice(0, 6).map((c) => (
                <span key={c} className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800/70">{c}</span>
              ))}
            </div>
          )}

          {game.description ? (
            <div className="mt-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              <div dangerouslySetInnerHTML={{ __html: game.description }} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">No description available.</p>
          )}
        </DetailHeroCard>

        <RecordView item={{ id: game.id, title: game.name, imageUrl: posterUrl ?? undefined, href: `/board-game/${game.id}`, releaseDate }} />
      </main>
    </div>
  );
}
