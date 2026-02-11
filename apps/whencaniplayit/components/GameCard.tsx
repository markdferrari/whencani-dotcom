


import type { IGDBGame, IGDBGenre } from '@/lib/igdb';
import { formatReleaseDate } from '@/lib/igdb';
import { WatchlistToggle } from './WatchlistToggle';
import { MediaCard } from '@whencani/ui';


interface GameCardProps {
  game: IGDBGame;
  genres?: IGDBGenre[];
  size?: 'md' | 'sm';
}

export function GameCard({ game, genres, size }: GameCardProps) {

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
      watchlistToggle={<WatchlistToggle gameId={game.id} className="shadow" />}
    />
  );
}
