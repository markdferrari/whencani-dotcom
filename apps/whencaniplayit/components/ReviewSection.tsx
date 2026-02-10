import { ExternalLink } from 'lucide-react';
import { getGameReviews, shouldShowReviews } from '@/lib/reviews';
import type { IGDBGame } from '@/lib/igdb';

interface ReviewSectionProps {
  game: IGDBGame;
  openCriticIdFromQuery?: number | null;
}

export async function ReviewSection({ game, openCriticIdFromQuery }: ReviewSectionProps) {
  // Check if game is recent enough to show reviews
  const releaseDate = game.release_dates?.[0]?.date || game.first_release_date;
  
  if (!shouldShowReviews(releaseDate)) {
    return null;
  }

  const reviews = getGameReviews({
    external_games: game.external_games,
    aggregated_rating: game.aggregated_rating,
    aggregated_rating_count: game.aggregated_rating_count,
    name: game.name,
  });

  const openCriticUid = game.external_games?.find((external) => external.category === 162)?.uid;
  const openCriticIdFromExternalGames = (() => {
    if (!openCriticUid) return null;
    const match = openCriticUid.match(/\d+/);
    if (!match) return null;
    const parsed = parseInt(match[0], 10);
    return Number.isNaN(parsed) ? null : parsed;
  })();
  const urlFriendlyGameName = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const openCriticId = openCriticIdFromQuery ?? openCriticIdFromExternalGames;
  const openCriticUrl = reviews.openCriticUrl ?? (openCriticId ? `https://opencritic.com/game/${openCriticId}/${urlFriendlyGameName}` : undefined);

  const hasReviewLinks = !!(reviews.metacriticUrl || openCriticUrl);
  const hasAnyReviewContent = hasReviewLinks;

  if (!hasAnyReviewContent) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Reviews & Ratings
      </h2>

      <div className="mt-4 space-y-4">
        {/* Review Site Links */}
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.metacriticUrl && (
            <a
              href={reviews.metacriticUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-yellow-500 text-sm font-bold text-white">
                  MC
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  Metacritic Reviews
                </span>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
            </a>
          )}

          {openCriticUrl && (
            <a
              href={openCriticUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-red-500 text-sm font-bold text-white">
                  OC
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  OpenCritic Reviews
                </span>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
            </a>
          )}
        </div>

        {/* No reviews message for very recent games */}
        {!hasAnyReviewContent &&
          releaseDate &&
          releaseDate > (Date.now() / 1000) - (7 * 24 * 60 * 60) && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              🎮 This game was recently released. Reviews may not be available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
