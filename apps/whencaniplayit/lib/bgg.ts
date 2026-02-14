import { XMLParser } from 'fast-xml-parser';

/**
 * Minimal BoardGameGeek (BGG) API helper.
 * - Uses XML API2 endpoints (no auth)
 * - Implements small in-memory caching with TTL
 * - Times out requests after 10s
 */

const BGG_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

type CacheEntry<T> = { kind: 'value'; value: T; expiresAt: number } | { kind: 'promise'; promise: Promise<T>; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

function nowMs() {
  return Date.now();
}

async function getCachedOrCreate<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  if (!ttlMs || ttlMs <= 0) return factory();

  const existing = cache.get(key) as CacheEntry<T> | undefined;
  const now = nowMs();
  if (existing && existing.expiresAt > now) {
    if (existing.kind === 'value') return existing.value as T;
    return (existing.promise as Promise<T>);
  }

  const expiresAt = now + ttlMs;
  const promise = factory()
    .then((v) => {
      cache.set(key, { kind: 'value', value: v, expiresAt });
      return v;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { kind: 'promise', promise, expiresAt });
  return promise;
}

const DEFAULT_TIMEOUT_MS = 10000;

function abortFetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const merged = { ...(init ?? {}), signal: controller.signal } as RequestInit;

  return fetch(input, merged).finally(() => clearTimeout(id));
}

export interface BGGBoardGame {
  id: number;
  name: string;
  yearPublished?: number;
  description?: string;
  thumbnail?: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlayTime?: number;
  maxPlayTime?: number;
  minAge?: number;
  rating?: number;
  numRatings?: number;
  rank?: number;
  categories?: string[];
  mechanics?: string[];
  designers?: string[];
  publishers?: string[];
}

export interface BGGHotGame {
  id: number;
  rank: number;
  name: string;
  thumbnail?: string;
  yearPublished?: number;
}

export interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
}

function parseIntAttr(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function toArray<T>(value?: T | T[] | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function getHotBoardGames(limit = 20): Promise<BGGHotGame[]> {
  const cacheKey = `bgg:hot:${limit}`;
  const ttlMs = 60 * 60 * 1000; // 1 hour

  return getCachedOrCreate(cacheKey, ttlMs, async () => {
    try {
      const url = `${BGG_BASE}/hot?type=boardgame`;
      const res = await abortFetchWithTimeout(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`BGG hot request failed: ${res.status}`);
      const text = await res.text();
      const parsed = parser.parse(text) as any;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];

      const mapped: BGGHotGame[] = items
        .slice(0, limit)
        .map((it: any) => ({
          id: parseInt(it['@_id'], 10),
          rank: parseIntAttr(it['@_rank']) ?? 0,
          name: it.name?.['@_value'] ?? it.name?.['#text'] ?? '',
          thumbnail: it.thumbnail ?? undefined,
          yearPublished: parseIntAttr(it.yearpublished?.['@_value']) ?? undefined,
        }))
        .filter((g) => !!g.id && !!g.name);

      return mapped;
    } catch (error) {
      console.error('getHotBoardGames error', error);
      return [];
    }
  }) as Promise<BGGHotGame[]>;
}

export async function getBoardGameById(id: number): Promise<BGGBoardGame | null> {
  if (!Number.isFinite(id)) return null;
  const cacheKey = `bgg:thing:${id}`;
  const ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  return getCachedOrCreate(cacheKey, ttlMs, async () => {
    try {
      const url = `${BGG_BASE}/thing?id=${id}&stats=1`;
      const res = await abortFetchWithTimeout(url, { next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`BGG thing request failed: ${res.status}`);
      const text = await res.text();
      const parsed = parser.parse(text) as any;

      const item = parsed?.items?.item;
      if (!item) return null;
      // if multiple, take first
      const it = Array.isArray(item) ? item[0] : item;

      const links = toArray(it.link);
      const categories = links.filter((l: any) => l['@_type'] === 'boardgamecategory').map((l: any) => l['@_value']);
      const mechanics = links.filter((l: any) => l['@_type'] === 'boardgamemechanic').map((l: any) => l['@_value']);
      const designers = links.filter((l: any) => l['@_type'] === 'boardgamedesigner').map((l: any) => l['@_value']);
      const publishers = links.filter((l: any) => l['@_type'] === 'boardgamepublisher').map((l: any) => l['@_value']);

      const stats = it.statistics?.ratings;
      const rating = stats ? Number(stats.average?.['@_value']) : undefined;
      const numRatings = stats ? parseIntAttr(stats.usersrated?.['@_value']) : undefined;

      // rank extraction (type="subtype"; prefer rank with name="boardgame")
      let rank: number | undefined = undefined;
      const ranks = stats?.ranks?.rank ? toArray(stats.ranks.rank) : [];
      for (const r of ranks) {
        if (r['@_name'] === 'boardgame') {
          rank = parseIntAttr(r['@_value']);
          break;
        }
      }

      const result: BGGBoardGame = {
        id: parseInt(it['@_id'], 10),
        name: it.name?.['@_value'] ?? it.name?.['#text'] ?? '',
        yearPublished: parseIntAttr(it.yearpublished?.['@_value']) ?? undefined,
        description: it.description ?? undefined,
        thumbnail: it.thumbnail ?? undefined,
        image: it.image ?? undefined,
        minPlayers: parseIntAttr(it.minplayers?.['@_value']) ?? undefined,
        maxPlayers: parseIntAttr(it.maxplayers?.['@_value']) ?? undefined,
        playingTime: parseIntAttr(it.playingtime?.['@_value']) ?? undefined,
        minPlayTime: parseIntAttr(it.minplaytime?.['@_value']) ?? undefined,
        maxPlayTime: parseIntAttr(it.maxplaytime?.['@_value']) ?? undefined,
        minAge: parseIntAttr(it.minage?.['@_value']) ?? undefined,
        rating: rating ?? undefined,
        numRatings: numRatings ?? undefined,
        rank: rank ?? undefined,
        categories,
        mechanics,
        designers,
        publishers,
      };

      return result;
    } catch (error) {
      console.error(`getBoardGameById(${id}) error`, error);
      return null;
    }
  }) as Promise<BGGBoardGame | null>;
}

export async function getBoardGamesByIds(ids: number[]): Promise<BGGBoardGame[]> {
  if (!ids || ids.length === 0) return [];
  const unique = Array.from(new Set(ids.filter((i) => Number.isFinite(i))));
  const cacheKey = `bgg:things:${unique.join(',')}`;
  const ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  return getCachedOrCreate(cacheKey, ttlMs, async () => {
    try {
      const url = `${BGG_BASE}/thing?id=${unique.join(',')}&stats=1`;
      const res = await abortFetchWithTimeout(url, { next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`BGG thing bulk request failed: ${res.status}`);
      const text = await res.text();
      const parsed = parser.parse(text) as any;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];
      const mapped = items.map((it: any) => {
        const links = toArray(it.link);
        const categories = links.filter((l: any) => l['@_type'] === 'boardgamecategory').map((l: any) => l['@_value']);
        const mechanics = links.filter((l: any) => l['@_type'] === 'boardgamemechanic').map((l: any) => l['@_value']);
        const designers = links.filter((l: any) => l['@_type'] === 'boardgamedesigner').map((l: any) => l['@_value']);
        const publishers = links.filter((l: any) => l['@_type'] === 'boardgamepublisher').map((l: any) => l['@_value']);

        const stats = it.statistics?.ratings;
        const rating = stats ? Number(stats.average?.['@_value']) : undefined;
        const numRatings = stats ? parseIntAttr(stats.usersrated?.['@_value']) : undefined;

        let rank: number | undefined = undefined;
        const ranks = stats?.ranks?.rank ? toArray(stats.ranks.rank) : [];
        for (const r of ranks) {
          if (r['@_name'] === 'boardgame') {
            rank = parseIntAttr(r['@_value']);
            break;
          }
        }

        const g: BGGBoardGame = {
          id: parseInt(it['@_id'], 10),
          name: it.name?.['@_value'] ?? it.name?.['#text'] ?? '',
          yearPublished: parseIntAttr(it.yearpublished?.['@_value']) ?? undefined,
          description: it.description ?? undefined,
          thumbnail: it.thumbnail ?? undefined,
          image: it.image ?? undefined,
          minPlayers: parseIntAttr(it.minplayers?.['@_value']) ?? undefined,
          maxPlayers: parseIntAttr(it.maxplayers?.['@_value']) ?? undefined,
          playingTime: parseIntAttr(it.playingtime?.['@_value']) ?? undefined,
          minPlayTime: parseIntAttr(it.minplaytime?.['@_value']) ?? undefined,
          maxPlayTime: parseIntAttr(it.maxplaytime?.['@_value']) ?? undefined,
          minAge: parseIntAttr(it.minage?.['@_value']) ?? undefined,
          rating: rating ?? undefined,
          numRatings: numRatings ?? undefined,
          rank: rank ?? undefined,
          categories,
          mechanics,
          designers,
          publishers,
        };

        return g;
      });

      return mapped;
    } catch (error) {
      console.error('getBoardGamesByIds error', error);
      return [];
    }
  }) as Promise<BGGBoardGame[]>;
}

export async function searchBoardGames(query: string): Promise<BGGSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const cacheKey = `bgg:search:${q.toLowerCase()}`;
  const ttlMs = 5 * 60 * 1000; // 5 minutes

  return getCachedOrCreate(cacheKey, ttlMs, async () => {
    try {
      const url = `${BGG_BASE}/search?query=${encodeURIComponent(q)}&type=boardgame`;
      const res = await abortFetchWithTimeout(url, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error(`BGG search failed: ${res.status}`);
      const text = await res.text();
      const parsed = parser.parse(text) as any;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];
      const mapped: BGGSearchResult[] = items.map((it: any) => ({
        id: parseInt(it['@_id'], 10),
        name: it.name?.['@_value'] ?? it.name?.['#text'] ?? '',
        yearPublished: parseIntAttr(it.yearpublished?.['@_value']) ?? undefined,
      }));

      return mapped;
    } catch (error) {
      console.error('searchBoardGames error', error);
      return [];
    }
  }) as Promise<BGGSearchResult[]>;
}
