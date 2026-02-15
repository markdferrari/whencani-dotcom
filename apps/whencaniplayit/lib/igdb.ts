// IGDB API helpers for fetching PlayStation game data
import { config } from './config';

let cachedToken: { access_token: string; expires_at: number } | null = null;

type IGDBSearchCacheValue = IGDBGame | null;

type IGDBSearchCacheEntry =
  | { kind: 'value'; value: IGDBSearchCacheValue; expiresAt: number }
  | { kind: 'promise'; promise: Promise<IGDBSearchCacheValue>; expiresAt: number };

const igdbSearchCache = new Map<string, IGDBSearchCacheEntry>();
const IGDB_SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function resetIGDBTokenCacheForTests() {
  if (process.env.NODE_ENV !== 'test') return;
  cachedToken = null;
}

export function resetIGDBSearchCacheForTests() {
  if (process.env.NODE_ENV !== 'test') return;
  igdbSearchCache.clear();
}

const getCachedIGDBSearch = async (
  key: string,
  factory: () => Promise<IGDBSearchCacheValue>,
): Promise<IGDBSearchCacheValue> => {
  const now = Date.now();
  const existing = igdbSearchCache.get(key);

  if (existing && existing.expiresAt > now) {
    if (existing.kind === 'value') return existing.value;
    return existing.promise;
  }

  const expiresAt = now + IGDB_SEARCH_CACHE_TTL_MS;
  const promise = factory()
    .then((value) => {
      igdbSearchCache.set(key, { kind: 'value', value, expiresAt });
      return value;
    })
    .catch((error: unknown) => {
      igdbSearchCache.delete(key);
      throw error;
    });

  igdbSearchCache.set(key, { kind: 'promise', promise, expiresAt });
  return promise;
};

export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  game_status?: number;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  platforms?: Array<{ id: number; name: string }>;
  screenshots?: Array<{ url: string }>;
  videos?: Array<{ video_id: string }>;
  similar_games?: Array<{ id: number; name: string; cover?: { url: string } }>;
  genres?: Array<{ id: number; name: string }>;
  release_dates?: Array<{
    human: string;
    date: number;
    date_format?: number;
    status?: number;
    platform: { id: number; name: string; platform_family?: number; platform_type?: number };
  }>;
  websites?: Array<{
    category: number;
    url: string;
  }>;
  external_games?: Array<{
    category: number;
    uid: string;
  }>;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  involved_companies?: Array<{
    company: { id: number; name: string };
    developer?: boolean;
    publisher?: boolean;
  }>;
  collection?: { id: number; name: string };
}

export interface IGDBGenre {
  id: number;
  name: string;
}

export interface IGDBStudio {
  id: number;
  name: string;
}

interface IGDBReleaseDate {
  id: number;
  date: number;
  human?: string;
  date_format?: number;
  status?: number;
  platform?: { id: number; name: string; platform_family?: number; platform_type?: number };
  game?: {
    id: number;
    name: string;
    summary?: string;
    game_status?: number;
    cover?: { url: string };
    first_release_date?: number;
    platforms?: Array<{ id: number; name: string }>;
    screenshots?: Array<{ url: string }>;
    genres?: Array<{ id: number; name: string }>;
  };
}

export type IGDBPlatformFilter =
  | { type: 'family'; id: number }
  | { type: 'platform'; id: number }
  | { type: 'platformType'; id: number }
  | { type: 'all' };

const normalizePlatformFilter = (
  filter: IGDBPlatformFilter | number | undefined,
): IGDBPlatformFilter => {
  if (typeof filter === 'number') {
    return { type: 'family', id: filter };
  }

  if (!filter) {
    return { type: 'family', id: 1 };
  }

  return filter;
};

/**
 * Get Twitch OAuth token for IGDB API access
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  const clientId = config.igdb.clientId;
  const clientSecret = config.igdb.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error('IGDB clientId and clientSecret must be configured');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the token (expires_in is in seconds, convert to milliseconds)
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
  };

  return data.access_token;
}

/**
 * Make a request to the IGDB API
 */
async function igdbRequest<T>(endpoint: string, body: string, options?: { cache?: RequestCache | number }): Promise<T> {
  const token = await getAccessToken();
  const clientId = config.igdb.clientId;

  // Handle cache options: if a number is provided, use it as revalidate time; otherwise use the cache strategy
  const cacheConfig =
    typeof options?.cache === 'number'
      ? { next: { revalidate: options.cache } }
      : options?.cache
        ? { cache: options.cache }
        : { next: { revalidate: 172800 } }; // Default: Cache for 48 hours

  const response = await fetch(`${config.igdb.baseUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
    ...cacheConfig,
  });

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch upcoming games for a specific platform
 */
export async function getUpcomingPSGames(
  platform: IGDBPlatformFilter | number = { type: 'family', id: 1 },
  genreId?: number,
  studioId?: number,
): Promise<IGDBGame[]> {
  const platformFilter = normalizePlatformFilter(platform);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const sixMonthsAhead = currentTimestamp + (60 * 60 * 24 * 180); // 6 months

  const platformWhere =
    platformFilter.type === 'all'
      ? '' // No platform filter, get all
      : platformFilter.type === 'family'
        ? `platform.platform_family = (${platformFilter.id})`
        : platformFilter.type === 'platform'
          ? `platform = (${platformFilter.id})`
          : `platform.platform_type = (${platformFilter.id})`;

  const filters = [
    'date != null',
    `date > ${currentTimestamp}`,
    `date <= ${sixMonthsAhead}`,
  ];

  if (platformWhere) {
    filters.push(platformWhere);
  }

  if (typeof genreId === 'number') {
    filters.push(`game.genres = (${genreId})`);
  }

  if (typeof studioId === 'number' && Number.isFinite(studioId)) {
    filters.push(
      `game.involved_companies.developer = true & game.involved_companies.company = (${studioId})`,
    );
  }

  const query = `
    fields date, human, date_format, status, platform.id, platform.name, platform.platform_family, platform.platform_type,
      game.id, game.name, game.summary, game.cover.url, game.first_release_date,
      game.game_status, game.platforms.name, game.screenshots.url, game.genres.name;
    where ${filters.join(' & ')};
    sort date asc;
    limit 150;
  `;

  const isTbc = (human?: string) => {
    if (!human) return false;
    const normalized = human.toLowerCase();
    return normalized.includes('tbc') || normalized.includes('tbd');
  };

  const releaseDates = await igdbRequest<IGDBReleaseDate[]>('release_dates', query);
  const gamesById = new Map<number, IGDBGame>();

  for (const releaseDate of releaseDates) {
    if (!releaseDate.game || isTbc(releaseDate.human)) continue;
    if (releaseDate.date <= currentTimestamp || releaseDate.date > sixMonthsAhead) continue;

    const existing = gamesById.get(releaseDate.game.id);
    const game: IGDBGame = existing ?? {
      id: releaseDate.game.id,
      name: releaseDate.game.name,
      summary: releaseDate.game.summary,
      game_status: releaseDate.game.game_status,
      cover: releaseDate.game.cover,
      first_release_date: releaseDate.game.first_release_date,
      platforms: releaseDate.game.platforms,
      screenshots: releaseDate.game.screenshots,
      genres: releaseDate.game.genres,
      release_dates: [],
    };

    game.release_dates = game.release_dates ?? [];
    game.release_dates.push({
      human: releaseDate.human ?? '',
      date: releaseDate.date,
      date_format: releaseDate.date_format,
      status: releaseDate.status,
      platform: {
        id: releaseDate.platform?.id ?? 0,
        name: releaseDate.platform?.name ?? '',
        platform_family: releaseDate.platform?.platform_family,
        platform_type: releaseDate.platform?.platform_type,
      },
    });

    gamesById.set(game.id, game);
  }

  const games = Array.from(gamesById.values());
  const getPlatformReleaseDate = (game: IGDBGame) => {
    if (!game.release_dates || game.release_dates.length === 0) return null;

    const dates = game.release_dates
      .filter(
        (rd) =>
          (platformFilter.type === 'all' ||
            (platformFilter.type === 'family'
              ? rd.platform?.platform_family === platformFilter.id
              : platformFilter.type === 'platform'
                ? rd.platform?.id === platformFilter.id
                : rd.platform?.platform_type === platformFilter.id)) &&
          typeof rd.date === 'number' &&
          rd.date > currentTimestamp &&
          rd.date <= sixMonthsAhead &&
          rd.date_format !== 7 &&
          !isTbc(rd.human),
      )
      .map((rd) => rd.date);

    if (dates.length === 0) return null;
    return Math.min(...dates);
  };

  return games
    .map((game) => ({
      ...game,
      release_dates: (game.release_dates ?? []).sort((a, b) => a.date - b.date),
    }))
    .filter((game) => {
      const date = getPlatformReleaseDate(game);
      return typeof date === 'number' && date > currentTimestamp;
    })
    .sort((a, b) => {
      const aDate = getPlatformReleaseDate(a) ?? 0;
      const bDate = getPlatformReleaseDate(b) ?? 0;
      return aDate - bDate;
    })
    .slice(0, 150);
}

/**
 * Fetch recently released games for a specific platform (past 60 days)
 */
export async function getRecentlyReleasedGames(
  platform: IGDBPlatformFilter | number = { type: 'family', id: 1 },
  genreId?: number,
  studioId?: number,
): Promise<IGDBGame[]> {
  const platformFilter = normalizePlatformFilter(platform);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const sixtyDaysAgo = currentTimestamp - (60 * 24 * 60 * 60); // 60 days in seconds

  const platformWhere =
    platformFilter.type === 'all'
      ? '' // No platform filter, get all
      : platformFilter.type === 'family'
        ? `platform.platform_family = (${platformFilter.id})`
        : platformFilter.type === 'platform'
          ? `platform = (${platformFilter.id})`
          : `platform.platform_type = (${platformFilter.id})`;

  const filters = [
    'date != null',
    `date >= ${sixtyDaysAgo}`,
    `date <= ${currentTimestamp}`,
  ];

  if (platformWhere) {
    filters.push(platformWhere);
  }

  if (typeof genreId === 'number') {
    filters.push(`game.genres = (${genreId})`);
  }

  if (typeof studioId === 'number' && Number.isFinite(studioId)) {
    filters.push(
      `game.involved_companies.developer = true & game.involved_companies.company = (${studioId})`,
    );
  }

  const query = `
    fields date, human, date_format, status, platform.id, platform.name, platform.platform_family, platform.platform_type,
      game.id, game.name, game.summary, game.cover.url, game.first_release_date,
      game.game_status, game.platforms.name, game.screenshots.url, game.genres.name;
    where ${filters.join(' & ')};
    sort date desc;
    limit 100;
  `;

  const releaseDates = await igdbRequest<IGDBReleaseDate[]>('release_dates', query);
  const gamesById = new Map<number, IGDBGame>();

  for (const releaseDate of releaseDates) {
    if (!releaseDate.game) continue;
    if (releaseDate.date < sixtyDaysAgo || releaseDate.date > currentTimestamp) continue;

    const existing = gamesById.get(releaseDate.game.id);
    const game: IGDBGame = existing ?? {
      id: releaseDate.game.id,
      name: releaseDate.game.name,
      summary: releaseDate.game.summary,
      game_status: releaseDate.game.game_status,
      cover: releaseDate.game.cover,
      first_release_date: releaseDate.game.first_release_date,
      platforms: releaseDate.game.platforms,
      screenshots: releaseDate.game.screenshots,
      genres: releaseDate.game.genres,
      release_dates: [],
    };

    game.release_dates = game.release_dates ?? [];
    game.release_dates.push({
      human: releaseDate.human ?? '',
      date: releaseDate.date,
      date_format: releaseDate.date_format,
      status: releaseDate.status,
      platform: {
        id: releaseDate.platform?.id ?? 0,
        name: releaseDate.platform?.name ?? '',
        platform_family: releaseDate.platform?.platform_family,
        platform_type: releaseDate.platform?.platform_type,
      },
    });

    gamesById.set(game.id, game);
  }

  const games = Array.from(gamesById.values());
  const getPlatformReleaseDate = (game: IGDBGame) => {
    if (!game.release_dates || game.release_dates.length === 0) return null;

    const dates = game.release_dates
      .filter(
        (rd) =>
          (platformFilter.type === 'all' ||
            (platformFilter.type === 'family'
              ? rd.platform?.platform_family === platformFilter.id
              : platformFilter.type === 'platform'
                ? rd.platform?.id === platformFilter.id
                : rd.platform?.platform_type === platformFilter.id)) &&
          typeof rd.date === 'number' &&
          rd.date >= sixtyDaysAgo &&
          rd.date <= currentTimestamp,
      )
      .map((rd) => rd.date);

    if (dates.length === 0) return null;
    return Math.max(...dates);
  };

  return games
    .map((game) => ({
      ...game,
      release_dates: (game.release_dates ?? []).sort((a, b) => b.date - a.date),
    }))
    .filter((game) => {
      const date = getPlatformReleaseDate(game);
      return typeof date === 'number' && date <= currentTimestamp;
    })
    .sort((a, b) => {
      const aDate = getPlatformReleaseDate(a) ?? 0;
      const bDate = getPlatformReleaseDate(b) ?? 0;
      return bDate - aDate;
    })
    .slice(0, 100);
}

/**
 * Search for games by name
 */
export async function searchGameByName(name: string): Promise<IGDBGame | null> {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return null;

  return getCachedIGDBSearch(`search:${normalizedName}`, async () => {
    const query = `
      search "${name}";
      fields name, cover.url;
      limit 1;
    `;

    const results = await igdbRequest<IGDBGame[]>('games', query);
    if (results.length === 0) return null;

    return results[0];
  });
}

/**
 * Search for games by name, returning multiple results for user-facing search
 */
export async function searchGames(query: string, limit = 10): Promise<IGDBGame[]> {
  const trimmed = query.trim().replace(/"/g, '');
  if (!trimmed) return [];

  const igdbQuery = `
    search "${trimmed}";
    fields name, cover.url, first_release_date, platforms.name, genres.name;
    limit ${limit};
  `;

  return igdbRequest<IGDBGame[]>('games', igdbQuery, { cache: 300 });
}

/**
 * Fetch similar games by ID with short cache duration
 */
export async function getSimilarGamesById(id: number): Promise<IGDBGame['similar_games']> {
  const query = `
    fields similar_games.id, similar_games.name, similar_games.cover.url;
    where id = ${id};
  `;

  const results = await igdbRequest<Array<{ similar_games?: IGDBGame['similar_games'] }>>(
    'games',
    query,
    { cache: 3600 }, // Cache for 1 hour instead of 48 hours
  );
  if (results.length === 0) return [];

  return results[0].similar_games ?? [];
}

/**
 * Fetch a single game by ID
 */
export async function getGameById(id: number): Promise<IGDBGame | null> {
  const query = `
  fields name, summary, cover.url, first_release_date, platforms.name, screenshots.url, videos.video_id, release_dates.human, release_dates.date, release_dates.date_format, release_dates.platform.name, release_dates.platform.id, websites.category, websites.url, external_games.category, external_games.uid, aggregated_rating, aggregated_rating_count, genres.name, involved_companies.company.id, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, collection.id, collection.name;
    where id = ${id};
  `;

  const results = await igdbRequest<IGDBGame[]>('games', query);
  if (results.length === 0) return null;

  const game = results[0];
  if (game.release_dates && game.release_dates.length > 0) {
    const isTbc = (human?: string) => {
      if (!human) return false;
      const normalized = human.toLowerCase();
      return normalized.includes('tbc') || normalized.includes('tbd');
    };

    game.release_dates = game.release_dates
      .filter((releaseDate) =>
        typeof releaseDate.date === 'number' &&
        releaseDate.date_format !== 7 &&
        !isTbc(releaseDate.human),
      )
      .sort((a, b) => b.date - a.date);
  }

  return game;
}

export async function getGamesByIds(ids: number[]): Promise<IGDBGame[]> {
  if (ids.length === 0) {
    return [];
  }

  const normalizedIds = Array.from(new Set(ids.map((id) => Number(id)).filter((value) => Number.isFinite(value))));
  if (normalizedIds.length === 0) {
    return [];
  }

  const query = `
    fields id, name, summary, cover.url, first_release_date, platforms.name, screenshots.url,
      release_dates.human, release_dates.date, release_dates.date_format, release_dates.platform.name, release_dates.platform.id, genres.name,
      external_games.category, external_games.uid;
    where id = (${normalizedIds.join(',')});
    limit ${normalizedIds.length};
  `;

  const results = await igdbRequest<IGDBGame[]>('games', query);
  const isTbc = (human?: string) => {
    if (!human) return false;
    const normalized = human.toLowerCase();
    return normalized.includes('tbc') || normalized.includes('tbd');
  };

  const gamesById = new Map<number, IGDBGame>();

  for (const game of results) {
    const releaseDates = game.release_dates?.filter(
      (releaseDate) =>
        typeof releaseDate.date === 'number' &&
        releaseDate.date_format !== 7 &&
        !isTbc(releaseDate.human),
    );

    if (releaseDates) {
      game.release_dates = releaseDates.sort((a, b) => b.date - a.date);
    }

    gamesById.set(game.id, game);
  }

  return ids
    .map((id) => gamesById.get(id))
    .filter((game): game is IGDBGame => Boolean(game));
}

/**
 * Format a Unix timestamp to a human-readable date
 */
export function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
export async function getGameGenres(): Promise<IGDBGenre[]> {
  const query = `
    fields id, name;
    sort name asc;
    limit 300;
  `;

  return igdbRequest<IGDBGenre[]>('genres', query);
}

export async function getDeveloperStudios(): Promise<IGDBStudio[]> {
  const query = `
    fields company.id, company.name;
    where developer = true & company != null;
    sort company.name asc;
    limit 500;
  `;

  const results = await igdbRequest<Array<{ company?: { id: number; name: string } }>>(
    'involved_companies',
    query,
  );

  const seenStudios = new Map<number, string>();
  for (const entry of results) {
    if (!entry.company?.id || !entry.company?.name) continue;
    seenStudios.set(entry.company.id, entry.company.name);
  }

  return Array.from(seenStudios.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGamesForDateRange(
  startDate: string,
  endDate: string,
  platform?: IGDBPlatformFilter,
  genreId?: number,
): Promise<IGDBGame[]> {
  const platformFilter = normalizePlatformFilter(platform);
  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

  const platformWhere =
    platformFilter.type === 'all'
      ? ''
      : platformFilter.type === 'family'
        ? `platform.platform_family = (${platformFilter.id})`
        : platformFilter.type === 'platform'
          ? `platform = (${platformFilter.id})`
          : `platform.platform_type = (${platformFilter.id})`;

  const filters = [
    `date >= ${startTimestamp}`,
    `date <= ${endTimestamp}`,
  ];

  if (platformWhere) {
    filters.push(platformWhere);
  }

  if (typeof genreId === 'number') {
    filters.push(`game.genres = (${genreId})`);
  }

  const query = `
    fields date, human, date_format, status, platform.id, platform.name, platform.platform_family, platform.platform_type,
      game.id, game.name, game.summary, game.cover.url, game.first_release_date,
      game.game_status, game.platforms.name, game.screenshots.url, game.genres.name;
    where ${filters.join(' & ')};
    sort date asc;
    limit 500;
  `;

  const releaseDates = await igdbRequest<IGDBReleaseDate[]>('release_dates', query);
  const gamesById = new Map<number, IGDBGame>();

  for (const releaseDate of releaseDates) {
    if (!releaseDate.game) continue;

    const existing = gamesById.get(releaseDate.game.id);
    const game: IGDBGame = existing ?? {
      id: releaseDate.game.id,
      name: releaseDate.game.name,
      summary: releaseDate.game.summary,
      game_status: releaseDate.game.game_status,
      cover: releaseDate.game.cover,
      first_release_date: releaseDate.game.first_release_date,
      platforms: releaseDate.game.platforms,
      screenshots: releaseDate.game.screenshots,
      genres: releaseDate.game.genres,
      release_dates: [],
    };

    game.release_dates = game.release_dates ?? [];
    game.release_dates.push({
      human: releaseDate.human ?? '',
      date: releaseDate.date,
      date_format: releaseDate.date_format,
      status: releaseDate.status,
      platform: {
        id: releaseDate.platform?.id ?? 0,
        name: releaseDate.platform?.name ?? '',
        platform_family: releaseDate.platform?.platform_family,
        platform_type: releaseDate.platform?.platform_type,
      },
    });

    gamesById.set(game.id, game);
  }

  return Array.from(gamesById.values());
}

/**
 * Fetch popular games using IGDB popularity API with equal weighting
 * Combines types 2 (Want to Play) and 10 (Most Wishlisted Upcoming) with weights 0.1 and 0.9 respectively
 */
export async function getPopularGames(limit = 50): Promise<IGDBGame[]> {
  // Get popularity data for types 2 and 10 (Want to Play and Most Wishlisted Upcoming)
  const popularityQuery = `
    fields game_id, popularity_type, value;
    where popularity_type = (2,10);
    sort value desc;
    limit 300;
  `;

  interface PopularityEntry {
    game_id: number;
    popularity_type: number;
    value: number;
  }

  //console.log('Fetching popularity data (types 2 and 10)...');
  const popularityData = await igdbRequest<PopularityEntry[]>('popularity_primitives', popularityQuery);
  //console.log('Popularity data received:', popularityData.length, 'entries');
  //console.log('Sample entry:', popularityData[0]);

  // Group by game and calculate weighted score (0.3 for type 2, 0.7 for type 10)
  const gameScores = new Map<number, { type2: number; type10: number; weightedScore: number }>();

  for (const entry of popularityData) {
    if (!entry.game_id || typeof entry.game_id !== 'number') continue;

    const gameId = entry.game_id;
    const existing = gameScores.get(gameId) || { type2: 0, type10: 0, weightedScore: 0 };

    // Add value to the appropriate type
    if (entry.popularity_type === 2) {
      existing.type2 += entry.value;
    } else if (entry.popularity_type === 10) {
      existing.type10 += entry.value;
    }

    // Recalculate weighted score (0.05 for type 2, 0.9 for type 10)
    existing.weightedScore = 0.05 * existing.type2 + 0.9 * existing.type10;

    gameScores.set(gameId, existing);
  }

  console.log('Game scores calculated:', gameScores.size, 'games');

  // Get top game IDs by weighted score
  const topGameIds = Array.from(gameScores.entries())
    .sort((a, b) => b[1].weightedScore - a[1].weightedScore)
    .slice(0, limit)
    .map(([gameId]) => gameId);

  console.log('Top game IDs:', topGameIds);

  if (topGameIds.length === 0) {
    return [];
  }

  // Fetch full game data for these IDs
  const games = await getGamesByIds(topGameIds);
  console.log('Games fetched:', games.length);

  return games;
}
