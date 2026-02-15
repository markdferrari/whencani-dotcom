'use client';

import type { IGDBGame, IGDBGenre } from '@/lib/igdb';
import { formatReleaseDate } from '@/lib/igdb';
import { config } from '@/lib/config';
import { getAmazonAffiliateUrl } from '@/lib/amazon';
import { WatchlistToggle } from './WatchlistToggle';
import { useWatchlistIds } from '@/hooks/use-watchlist';
import { MediaCard, ReleaseBadge, isReleasedRecently } from '@whencani/ui';


interface GameCardProps {
  game: IGDBGame;
  genres?: IGDBGenre[];
  size?: 'md' | 'sm';
  /** make the card horizontal on small screens with larger cover on the left */
  mobileLayout?: 'stack' | 'side';
  /** where to render the watchlist toggle (default: title row) */
  watchlistTogglePosition?: 'title' | 'below-genres';
  showAffiliateLink?: boolean;
  /** Make the card full height to fill its container */
  fullHeight?: boolean;
}

export function GameCard({ game, genres, size, mobileLayout = 'stack', watchlistTogglePosition = 'title', showAffiliateLink = false, fullHeight = false }: GameCardProps) {

  const normalizeIgdbImage = (url?: string, variant = 't_cover_big') =>
    url
      ? `/api/image?url=${encodeURIComponent(
          `https:${url.replace('t_thumb', variant)}`,
        )}`
      : undefined;
  const coverUrl = normalizeIgdbImage(game.cover?.url, 't_cover_big');
  const releaseDate = game.release_dates?.[0]?.date || game.first_release_date;
  const releaseDateHuman =
    game.release_dates?.[0]?.human ||
    (releaseDate ? formatReleaseDate(releaseDate) : 'TBA');
  const platforms =
    game.release_dates
      ?.map(rd => rd.platform?.name)
      .filter((name, index, self) => name && self.indexOf(name) === index) ||
    game.platforms?.map(p => p.name) ||
    [];
  const genreNames = game.genres?.map(g => g.name) || [];
  const summary = game.summary
    ? game.summary.length > 110
      ? `${game.summary.slice(0, 110)}…`
      : game.summary
    : 'Release details are coming soon.';

  const watchlistIds = useWatchlistIds();
  const isInWatchlist = watchlistIds.includes(game.id);

  // Convert Unix timestamp to ISO date string for isReleasedRecently
  const releaseDateISO = releaseDate
    ? new Date(releaseDate * 1000).toISOString().split('T')[0]
    : null;

  const isReleased = isReleasedRecently(releaseDateISO, 0);
  const featureEnabled = config.features.watchlistImprovements;
  const showBadge = featureEnabled && isInWatchlist && isReleased;

  const amazonUrl = showAffiliateLink && config.features.amazonAffiliates
    ? getAmazonAffiliateUrl(game.name, game.external_games)
    : null;

  return (
    <MediaCard
      id={game.id}
      href={`/game/${game.id}`}
      title={game.name}
      imageUrl={coverUrl || '/game-placeholder.svg'}
      imageAlt={`${game.name} - Video game cover art`}
      releaseDate={releaseDateHuman}
      summary={summary}
      genres={genreNames}
      size={size}
      mobileLayout={mobileLayout}
      watchlistToggle={<WatchlistToggle gameId={game.id} className="shadow" />}
      badge={showBadge ? <ReleaseBadge /> : undefined}
      actionButton={amazonUrl ? (
        <a
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600 active:bg-sky-700"
          onClick={(e) => e.stopPropagation()}
        >
          Buy now
        </a>
      ) : undefined}
      fullHeight={fullHeight}
    />
  );
}
