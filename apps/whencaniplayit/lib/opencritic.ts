// OpenCritic API helpers for fetching game reviews
import { searchGameByName } from '@/lib/igdb';
import { config } from './config';

const OPENCRITIC_BASE_URL = config.opencritic.baseUrl;

const OPENCRITIC_RATE_LIMIT_PER_SECOND = 4;
const OPENCRITIC_MIN_INTERVAL_MS = Math.ceil(1000 / OPENCRITIC_RATE_LIMIT_PER_SECOND);

type NextFetchRequestInit = RequestInit & {
  next?: { revalidate?: number };
};

const sleep = async (ms: number) => {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

type CacheValueEntry<T> = {
  kind: 'value';
  value: T;
  expiresAt: number;
};
type CachePromiseEntry<T> = {
  kind: 'promise';
  promise: Promise<T>;
  expiresAt: number;
};

type CacheEntry<T> = CacheValueEntry<T> | CachePromiseEntry<T>;

const openCriticCache = new Map<string, CacheEntry<unknown>>();

export function resetOpenCriticCacheForTests() {
  if (process.env.NODE_ENV !== 'test') return;
  openCriticCache.clear();
}

const getCachedOrCreate = async <T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> => {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    return factory();
  }

  const now = Date.now();
  const existing = openCriticCache.get(key);

  if (existing && existing.expiresAt > now) {
    if (existing.kind === 'value') {
      return existing.value as T;
    }
    return (await existing.promise) as T;
  }

  const expiresAt = now + ttlMs;

  const promise = factory()
    .then((value) => {
      openCriticCache.set(key, { kind: 'value', value, expiresAt });
      return value;
    })
    .catch((error: unknown) => {
      openCriticCache.delete(key);
      throw error;
    });

  openCriticCache.set(key, { kind: 'promise', promise, expiresAt });
  return promise;
};

let openCriticRateLimitQueue: Promise<void> = Promise.resolve();
let openCriticNextAllowedAt = 0;

export function resetOpenCriticRateLimiterForTests() {
  if (process.env.NODE_ENV !== 'test') return;
  openCriticRateLimitQueue = Promise.resolve();
  openCriticNextAllowedAt = 0;
}

type IgdbLookupResult = { coverUrl?: string; id?: number } | null;

async function enrichWithIgdbFallbacks<
  T extends { name: string; igdbCoverUrl?: string; igdbId?: number }
>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;

  const hasCredentials = Boolean(
    config.igdb.clientId && config.igdb.clientSecret
  );

  if (!hasCredentials) {
    return items;
  }

  const lookupCache = new Map<string, IgdbLookupResult>();

  const enriched = await Promise.all(
    items.map(async (item) => {
      const trimmedName = item.name?.trim();
      if (!trimmedName) {
        return item;
      }

      const cacheKey = trimmedName.toLowerCase();

      if (!lookupCache.has(cacheKey)) {
        let result: IgdbLookupResult = null;
        try {
          const igdb = await searchGameByName(trimmedName);
          if (igdb) {
            result = {
              coverUrl: igdb.cover?.url,
              id: igdb.id,
            };
          }
        } catch (error) {
          console.error(
            `Failed to enrich OpenCritic entry "${item.name}" with IGDB data`,
            error,
          );
        }

        lookupCache.set(cacheKey, result);
      }

      const cached = lookupCache.get(cacheKey);
      if (!cached) {
        return item;
      }

      return {
        ...item,
        igdbCoverUrl: item.igdbCoverUrl ?? cached.coverUrl,
        igdbId: item.igdbId ?? cached.id,
      };
    }),
  );

  return enriched;
}

const scheduleOpenCriticRequestSlot = async () => {
  const scheduled = openCriticRateLimitQueue.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, openCriticNextAllowedAt - now);
    openCriticNextAllowedAt = Math.max(openCriticNextAllowedAt, now) + OPENCRITIC_MIN_INTERVAL_MS;
    await sleep(waitMs);
  });

  // Prevent queue from getting stuck if a caller throws.
  openCriticRateLimitQueue = scheduled.catch(() => undefined);
  await scheduled;
};

const parseRetryAfterMs = (response: Response): number | null => {
  const raw = response.headers?.get('retry-after');
  if (!raw) return null;

  const asSeconds = Number(raw);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.floor(asSeconds * 1000);
  }

  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) {
    const waitMs = asDate - Date.now();
    return waitMs > 0 ? waitMs : 0;
  }

  return null;
};

const openCriticFetch = async (
  url: string,
  init: NextFetchRequestInit,
  options?: {
    retries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  }
): Promise<Response> => {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 500;
  const maxDelayMs = options?.maxDelayMs ?? 8000;

  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await scheduleOpenCriticRequestSlot();

    const response = await fetch(url, init);

    const isRateLimited = response.status === 429;
    const isTransientFailure = response.status === 503;

    if (!isRateLimited && !isTransientFailure) {
      return response;
    }

    if (attempt === maxAttempts - 1) {
      return response;
    }

    const retryAfterMs = isRateLimited ? parseRetryAfterMs(response) : null;
    const backoffMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const jitterMs = retryAfterMs !== null ? 0 : Math.floor(Math.random() * 100);
    const delayMs = (retryAfterMs ?? backoffMs) + jitterMs;

    // If we get rate-limited or a transient failure, slow down subsequent queued requests too.
    openCriticNextAllowedAt = Math.max(openCriticNextAllowedAt, Date.now() + delayMs);

    await sleep(delayMs);
  }

  // Unreachable, but keeps TypeScript happy.
  throw new Error('OpenCritic request failed after retries');
};

export interface OpenCriticGameDetails {
  id: number;
  name: string;
  tier?: string;
  topCriticScore?: number;
  numReviews?: number;
  percentRecommended?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export async function getOpenCriticGameDetails(
  openCriticId: number
): Promise<OpenCriticGameDetails | null> {
  const rapidApiKey = config.opencritic.rapidApiKey;

  if (!rapidApiKey) {
    throw new Error('OpenCritic rapidApiKey is required in config');
  }

  const cacheKey = `opencritic:game:${openCriticId}`;
  const cacheTtlMs = 60 * 60 * 1000;

  const data = await getCachedOrCreate<unknown>(cacheKey, cacheTtlMs, async () => {
    const response = await openCriticFetch(`${OPENCRITIC_BASE_URL}/game/${openCriticId}`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      // Avoid caching failures so a transient 429/5xx can recover quickly.
      throw new Error(`OpenCritic game details request failed: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  }).catch(() => null);

  if (!isRecord(data)) {
    return null;
  }

  const id = typeof data.id === 'number' ? data.id : openCriticId;
  const name = typeof data.name === 'string' ? data.name : '';
  const tier = typeof data.tier === 'string' ? data.tier : undefined;
  const topCriticScore =
    typeof data.topCriticScore === 'number' ? data.topCriticScore : undefined;
  const numReviews = typeof data.numReviews === 'number' ? data.numReviews : undefined;
  const percentRecommended =
    typeof data.percentRecommended === 'number' ? data.percentRecommended : undefined;

  if (!name) {
    return null;
  }

  return {
    id,
    name,
    tier,
    topCriticScore,
    numReviews,
    percentRecommended,
  };
}

export interface OpenCriticReview {
  id: number;
  name: string;
  images: {
    box?: { sm?: string; og?: string };
    banner?: { sm?: string; og?: string };
  };
  tier?: string;
  topCriticScore?: number;
  numReviews: number;
  percentRecommended?: number;
  releaseDate?: string;
  igdbCoverUrl?: string; // Added for fallback to IGDB images
  igdbId?: number; // Added for internal linking to /game/[id]
}

export interface TrendingGame {
  id: number;
  name: string;
  images: {
    box?: { sm?: string; og?: string };
    banner?: { sm?: string; og?: string };
  };
  platforms?: Array<{ id: number; name: string }>;
  releaseDate?: string;
  topCriticScore?: number;
  numReviews?: number;
  percentRecommended?: number;
  tier?: string;
  igdbCoverUrl?: string; // Added for fallback to IGDB images
  igdbId?: number; // Added for internal linking to /game/[id]
}

/**
 * Fetches games that have been reviewed this week from OpenCritic
 * @param limit Optional maximum number of games to return (default: all)
 * @returns Array of reviewed games
 */
export async function getReviewedThisWeek(
  limit?: number
): Promise<OpenCriticReview[]> {
  const rapidApiKey = config.opencritic.rapidApiKey;

  if (!rapidApiKey) {
    throw new Error('OpenCritic rapidApiKey is required in config');
  }

  const cacheKey = 'opencritic:reviewed-this-week';
  const cacheTtlMs = 24 * 60 * 60 * 1000;

  const cachedData = await getCachedOrCreate<OpenCriticReview[]>(
    cacheKey,
    cacheTtlMs,
    async () => {
      const response = await openCriticFetch(
        `${OPENCRITIC_BASE_URL}/game/reviewed-this-week`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
          },
          next: { revalidate: 60 * 60 * 24 * 7 },
        }
      );

      if (!response.ok) {
        throw new Error(
          `OpenCritic API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenCriticReview[] = await response.json();
      return enrichWithIgdbFallbacks(data);
    }
  );

  if (limit && limit > 0) return cachedData.slice(0, limit);
  return cachedData;
}

/**
 * Fetches recently released games from OpenCritic
 * @param limit Optional maximum number of games to return (capped at 6)
 * @returns Array of recently released games
 */
export async function getRecentlyReleased(
  limit?: number
): Promise<TrendingGame[]> {
  const rapidApiKey = config.opencritic.rapidApiKey;

  if (!rapidApiKey) {
    throw new Error('OpenCritic rapidApiKey is required in config');
  }

  const cacheKey = 'opencritic:recently-released';
  const cacheTtlMs = 24 * 60 * 60 * 1000;

  const cachedData = await getCachedOrCreate<TrendingGame[]>(
    cacheKey,
    cacheTtlMs,
    async () => {
      const response = await openCriticFetch(
        `${OPENCRITIC_BASE_URL}/game/recently-released`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
          },
          next: { revalidate: 60 * 60 * 24 * 7 },
        }
      );

      if (!response.ok) {
        throw new Error(
          `OpenCritic API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: TrendingGame[] = await response.json();
      return enrichWithIgdbFallbacks(data);
    }
  );

  const maxLimit = 6;
  const resolvedLimit = limit && limit > 0 ? Math.min(limit, maxLimit) : maxLimit;
  return cachedData.slice(0, resolvedLimit);
}
