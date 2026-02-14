'use client';

import { MediaCard } from '@whencani/ui';
import { getAmazonBoardGameUrl } from '@/lib/amazon';
import { BoardGameWatchlistToggle } from './BoardGameWatchlistToggle';
import type { BGGBoardGame } from '@/lib/bgg';

interface BoardGameCardProps {
  game: BGGBoardGame;
  size?: 'md' | 'sm';
  showAffiliateLink?: boolean;
}

export function BoardGameCard({ game, size, showAffiliateLink = false }: BoardGameCardProps) {
  const imageUrl = game.image || game.thumbnail || '/game-placeholder.svg';
  const title = game.name;
  const releaseDate = game.yearPublished ? String(game.yearPublished) : 'TBA';
  const summary = game.description
    ? game.description.length > 140
      ? `${game.description.slice(0, 140)}…`
      : game.description
    : 'No description available.';
  const genres = game.categories || [];
  const extraInfo = [] as string[];
  if (typeof game.minPlayers === 'number' && typeof game.maxPlayers === 'number') {
    extraInfo.push(`${game.minPlayers}-${game.maxPlayers} players`);
  }
  if (game.playingTime) extraInfo.push(`${game.playingTime} mins`);

  const amazonUrl = showAffiliateLink ? getAmazonBoardGameUrl(game.name) : null;

  return (
    <MediaCard
      id={game.id}
      href={`/board-game/${game.id}`}
      title={title}
      imageUrl={imageUrl}
      imageAlt={`${title} - Board game box art`}
      releaseDate={releaseDate}
      summary={summary}
      genres={genres}
      watchlistToggle={<BoardGameWatchlistToggle gameId={game.id} className="shadow" />}
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
    />
  );
}
