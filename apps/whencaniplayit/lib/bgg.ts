import { XMLParser } from 'fast-xml-parser';

/**
 * Minimal BoardGameGeek (BGG) API helper.
 * - Uses XML API2 endpoints (no auth)
 * - Implements small in-memory caching with TTL
 * - Times out requests after 10s
 */

const BGG_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

// ---------------------------------------------------------------------------
// Lightweight types for the parsed XML shapes we care about
// ---------------------------------------------------------------------------

interface BGGXmlAttr {
  '@_value'?: string;
  '@_id'?: string;
  '@_rank'?: string;
  '@_type'?: string;
  '@_name'?: string;
  '#text'?: string;
}

interface BGGXmlLink {
  '@_type': string;
  '@_value': string;
}

interface BGGXmlItem {
  '@_id': string;
  '@_rank'?: string;
  name?: BGGXmlAttr | BGGXmlAttr[];
  yearpublished?: BGGXmlAttr;
  description?: string;
  thumbnail?: string;
  image?: string;
  minplayers?: BGGXmlAttr;
  maxplayers?: BGGXmlAttr;
  playingtime?: BGGXmlAttr;
  minplaytime?: BGGXmlAttr;
  maxplaytime?: BGGXmlAttr;
  minage?: BGGXmlAttr;
  link?: BGGXmlLink | BGGXmlLink[];
  statistics?: {
    ratings?: {
      average?: BGGXmlAttr;
      usersrated?: BGGXmlAttr;
      ranks?: { rank?: BGGXmlAttr | BGGXmlAttr[] };
    };
  };
}

interface BGGXmlRoot {
  items?: { item?: BGGXmlItem | BGGXmlItem[] };
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

type CacheEntry<T> = { kind: 'value'; value: T; expiresAt: number } | { kind: 'promise'; promise: Promise<T>; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function getCachedOrCreate<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  if (!ttlMs || ttlMs <= 0) return factory();

  const existing = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (existing && existing.expiresAt > now) {
    if (existing.kind === 'value') return existing.value;
    return existing.promise;
  }

  const expiresAt = now + ttlMs;
  const promise = factory()
    .then((v) => {
      cache.set(key, { kind: 'value', value: v, expiresAt });
      return v;
    })
    .catch((err: unknown) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { kind: 'promise', promise, expiresAt });
  return promise;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 10_000;

function abortFetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const merged: RequestInit = { ...(init ?? {}), signal: controller.signal };

  return fetch(input, merged).finally(() => clearTimeout(id));
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseIntAttr(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function toArray<T>(value?: T | T[] | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Extract the primary name from a BGG item (handles single or multiple name elements). */
function extractPrimaryName(nameField: BGGXmlAttr | BGGXmlAttr[] | undefined): string {
  if (!nameField) return '';
  const names = toArray(nameField);
  const primary = names.find((n) => n['@_type'] === 'primary') ?? names[0];
  return primary?.['@_value'] ?? primary?.['#text'] ?? '';
}

/**
 * Strip HTML tags and decode common HTML entities from a BGG description.
 * Used for plain-text summaries on cards.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#10;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parse a single BGG "thing" XML item into a BGGBoardGame. */
function parseThingItem(it: BGGXmlItem): BGGBoardGame {
  const links = toArray(it.link);
  const categories = links.filter((l) => l['@_type'] === 'boardgamecategory').map((l) => l['@_value']);
  const mechanics = links.filter((l) => l['@_type'] === 'boardgamemechanic').map((l) => l['@_value']);
  const designers = links.filter((l) => l['@_type'] === 'boardgamedesigner').map((l) => l['@_value']);
  const publishers = links.filter((l) => l['@_type'] === 'boardgamepublisher').map((l) => l['@_value']);

  const stats = it.statistics?.ratings;
  const ratingRaw = stats?.average?.['@_value'] !== undefined ? Number(stats.average['@_value']) : undefined;
  const rating = ratingRaw !== undefined && Number.isFinite(ratingRaw) ? ratingRaw : undefined;
  const numRatings = stats ? parseIntAttr(stats.usersrated?.['@_value']) : undefined;

  let rank: number | undefined;
  const ranks = stats?.ranks?.rank ? toArray(stats.ranks.rank) : [];
  for (const r of ranks) {
    if (r['@_name'] === 'boardgame') {
      rank = parseIntAttr(r['@_value']);
      break;
    }
  }

  return {
    id: parseInt(it['@_id'], 10),
    name: extractPrimaryName(it.name),
    yearPublished: parseIntAttr(it.yearpublished?.['@_value']),
    description: typeof it.description === 'string' ? it.description : undefined,
    thumbnail: it.thumbnail ?? undefined,
    image: it.image ?? undefined,
    minPlayers: parseIntAttr(it.minplayers?.['@_value']),
    maxPlayers: parseIntAttr(it.maxplayers?.['@_value']),
    playingTime: parseIntAttr(it.playingtime?.['@_value']),
    minPlayTime: parseIntAttr(it.minplaytime?.['@_value']),
    maxPlayTime: parseIntAttr(it.maxplaytime?.['@_value']),
    minAge: parseIntAttr(it.minage?.['@_value']),
    rating,
    numRatings,
    rank,
    categories,
    mechanics,
    designers,
    publishers,
  };
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

export async function getHotBoardGames(limit = 20): Promise<BGGHotGame[]> {
  const cacheKey = `bgg:hot:${limit}`;
  const ttlMs = 6 * 60 * 60 * 1000; // 6 hours

  return getCachedOrCreate(cacheKey, ttlMs, async () => {
    try {
      const url = `${BGG_BASE}/hot?type=boardgame`;
      const res = await abortFetchWithTimeout(url, { next: { revalidate: 21600 } });
      if (!res.ok) throw new Error(`BGG hot request failed: ${res.status}`);
      const text = await res.text();
      const parsed = parser.parse(text) as BGGXmlRoot;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];

      return items
        .slice(0, limit)
        .map((it) => ({
          id: parseInt(it['@_id'], 10),
          rank: parseIntAttr(it['@_rank']) ?? 0,
          name: extractPrimaryName(it.name),
          thumbnail: it.thumbnail ?? undefined,
          yearPublished: parseIntAttr(it.yearpublished?.['@_value']),
        }))
        .filter((g) => !!g.id && !!g.name);
    } catch (error) {
      console.error('getHotBoardGames error', error);
      return [];
    }
  });
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
      const parsed = parser.parse(text) as BGGXmlRoot;

      const item = parsed?.items?.item;
      if (!item) return null;
      const it = Array.isArray(item) ? item[0] : item;

      return parseThingItem(it);
    } catch (error) {
      console.error(`getBoardGameById(${id}) error`, error);
      return null;
    }
  });
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
      const parsed = parser.parse(text) as BGGXmlRoot;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];
      return items.map(parseThingItem);
    } catch (error) {
      console.error('getBoardGamesByIds error', error);
      return [];
    }
  });
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
      const parsed = parser.parse(text) as BGGXmlRoot;

      const items = parsed?.items?.item ? toArray(parsed.items.item) : [];
      return items.map((it) => ({
        id: parseInt(it['@_id'], 10),
        name: extractPrimaryName(it.name),
        yearPublished: parseIntAttr(it.yearpublished?.['@_value']),
      }));
    } catch (error) {
      console.error('searchBoardGames error', error);
      return [];
    }
  });
}
