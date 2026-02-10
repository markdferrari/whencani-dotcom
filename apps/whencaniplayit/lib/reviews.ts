// Review data utilities

export interface ReviewLink {
  name: string;
  url: string;
  score?: number;
}

export interface GameReviews {
  metacriticUrl?: string;
  metacriticScore?: number;
  openCriticUrl?: string;
  igdbRating?: number;
  igdbRatingCount?: number;
  hasReviews: boolean;
}

// External game categories from IGDB
const EXTERNAL_CATEGORIES = {
  STEAM: 1,
  GOG: 5,
  YOUTUBE: 10,
  MICROSOFT: 11,
  APPLE: 13,
  TWITCH: 14,
  ANDROID: 15,
  EPIC: 26,
  METACRITIC: 115,
  OPENCRITIC: 162, // OpenCritic category in IGDB
};

/**
 * Parse external games data to find review site links
 */
export function parseExternalGames(external_games?: Array<{ category: number; uid: string }>): ReviewLink[] {
  if (!external_games || external_games.length === 0) {
    return [];
  }

  const reviewLinks: ReviewLink[] = [];

  external_games.forEach((external) => {
    // Metacritic
    if (external.category === 115) {
      reviewLinks.push({
        name: 'Metacritic',
        url: `https://www.metacritic.com${external.uid.startsWith('/') ? '' : '/'}${external.uid}`,
      });
    }
    
    // OpenCritic
    if (external.category === 162) {
      reviewLinks.push({
        name: 'OpenCritic',
        url: `https://opencritic.com/game/${external.uid}`,
      });
    }
  });

  return reviewLinks;
}

/**
 * Extract review data from game information
 */
export function getGameReviews(game: {
  external_games?: Array<{ category: number; uid: string }>;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  name: string;
}): GameReviews {
  const externalLinks = parseExternalGames(game.external_games);
  const metacriticLink = externalLinks.find(link => link.name === 'Metacritic');
  const openCriticLink = externalLinks.find(link => link.name === 'OpenCritic');

  return {
    metacriticUrl: metacriticLink?.url,
    openCriticUrl: openCriticLink?.url,
    igdbRating: game.aggregated_rating,
    igdbRatingCount: game.aggregated_rating_count,
    hasReviews: !!(metacriticLink || openCriticLink || game.aggregated_rating),
  };
}

/**
 * Check if a game is recent enough to show reviews (within 180 days)
 */
export function shouldShowReviews(releaseDate?: number): boolean {
  if (!releaseDate) return false;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = currentTimestamp - (180 * 24 * 60 * 60);

  return releaseDate >= sixMonthsAgo && releaseDate <= currentTimestamp;
}

/**
 * Format IGDB rating for display (0-100 scale)
 */
export function formatRating(rating?: number): string {
  if (!rating) return 'N/A';
  return Math.round(rating).toString();
}
