import { config } from './config';
import type {
  Book,
  BookEdition,
  BookSeries,
  GoogleBooksSearchResponse,
  OLSearchResponse,
  OLEditionDetail,
  OLWorkDetail,
  OLRatingsResponse,
  OLSubjectResponse,
  OLAuthorResponse,
} from './types';
import type { Region } from './region';

// --- Shared infrastructure ---

const OL_BASE = 'https://openlibrary.org';
const OL_COVERS_BASE = 'https://covers.openlibrary.org';
const USER_AGENT = 'WhenCanIReadIt.com/1.0 (info@whencanireadit.com)';

// In-memory cache for OL responses (24h + jitter)
const OL_CACHE_TTL = 24 * 60 * 60 * 1000;
const OL_CACHE_JITTER = 60 * 60 * 1000;
const olJsonCache = new Map<string, { expires: number; data: unknown }>();

// Author name cache (24h TTL)
const authorCache = new Map<string, { expires: number; name: string }>();

// Concurrency limiter (shared with all OL requests)
const OL_MAX_CONCURRENT = 5;
const OL_STAGGER_MS = 100;
let olActiveRequests = 0;
const olRequestQueue: Array<() => void> = [];

function olAcquireSlot(): Promise<void> {
  if (olActiveRequests < OL_MAX_CONCURRENT) {
    olActiveRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    olRequestQueue.push(resolve);
  });
}

function olReleaseSlot(): void {
  if (olRequestQueue.length > 0) {
    const next = olRequestQueue.shift()!;
    setTimeout(next, OL_STAGGER_MS);
  } else {
    olActiveRequests--;
  }
}

async function fetchOL<T = unknown>(url: string): Promise<T> {
  const cached = olJsonCache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  await olAcquireSlot();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Open Library API error: ${res.status} ${res.statusText} for ${url}`);
    }
    const json = (await res.json()) as T;
    const jitter = Math.floor(Math.random() * OL_CACHE_JITTER);
    olJsonCache.set(url, { expires: Date.now() + OL_CACHE_TTL + jitter, data: json as unknown });
    return json;
  } finally {
    olReleaseSlot();
  }
}

// --- Helper utilities ---

function extractDescription(desc: string | { type: string; value: string } | undefined): string | null {
  if (!desc) return null;
  if (typeof desc === 'string') return desc;
  return desc.value ?? null;
}

function olCoverUrl(coverId: number | undefined, isbn: string | null, size: 'S' | 'M' | 'L'): string | null {
  if (coverId) return `${OL_COVERS_BASE}/b/id/${coverId}-${size}.jpg`;
  if (isbn) return `${OL_COVERS_BASE}/b/isbn/${isbn}-${size}.jpg`;
  return null;
}

function extractLanguageCode(languages: Array<{ key: string }> | undefined): string | null {
  if (!languages?.length) return null;
  // Key is like "/languages/eng" — extract the code
  const code = languages[0].key.replace('/languages/', '');
  // Map common OL codes to ISO 639-1
  const map: Record<string, string> = { eng: 'en', fre: 'fr', ger: 'de', spa: 'es', ita: 'it', por: 'pt', jpn: 'ja', chi: 'zh' };
  return map[code] ?? code;
}

function pickIsbn13(isbns: string[] | undefined): string | null {
  if (!isbns?.length) return null;
  return isbns.find((i) => i.length === 13) ?? isbns[0] ?? null;
}

function pickIsbn10(isbns: string[] | undefined): string | null {
  if (!isbns?.length) return null;
  return isbns.find((i) => i.length === 10) ?? null;
}

async function resolveAuthorName(authorKey: string): Promise<string> {
  const cached = authorCache.get(authorKey);
  if (cached && cached.expires > Date.now()) return cached.name;

  try {
    const data = await fetchOL<OLAuthorResponse>(`${OL_BASE}${authorKey}.json`);
    const jitter = Math.floor(Math.random() * OL_CACHE_JITTER);
    authorCache.set(authorKey, { name: data.name, expires: Date.now() + OL_CACHE_TTL + jitter });
    return data.name;
  } catch {
    // Return key as fallback
    return authorKey.replace('/authors/', '');
  }
}

async function resolveAuthorNames(authorKeys: Array<{ key: string }> | undefined): Promise<string[]> {
  if (!authorKeys?.length) return [];
  const names = await Promise.all(authorKeys.map((a) => resolveAuthorName(a.key)));
  return names;
}

// --- Cover image utilities (kept from original) ---

type CoverSize = 'S' | 'M' | 'L';

export function getOpenLibraryCoverUrl(isbn: string, size: CoverSize = 'L'): string {
  return `${OL_COVERS_BASE}/b/isbn/${isbn}-${size}.jpg`;
}

export async function getOpenLibraryCover(isbn: string): Promise<string | null> {
  const url = getOpenLibraryCoverUrl(isbn, 'L');

  try {
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) < 1000) return null;

    return url;
  } catch {
    return null;
  }
}

// --- Book provider functions ---

export async function searchBooks(query: string, maxResults = 10, _country?: string): Promise<Book[]> {
  const url = `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}&fields=key,title,subtitle,author_name,author_key,first_publish_year,isbn,cover_i,subject,publisher,number_of_pages_median,language&language=eng`;

  try {
    const data = await fetchOL<OLSearchResponse>(url);
    return (data.docs ?? []).map((doc): Book => {
      const isbn13 = doc.isbn?.find((i) => i.length === 13) ?? null;
      const isbn10 = doc.isbn?.find((i) => i.length === 10) ?? null;
      const coverId = doc.cover_i;

      return {
        id: isbn13 ?? isbn10 ?? doc.key.replace('/works/', ''),
        title: doc.title,
        subtitle: doc.subtitle ?? null,
        authors: doc.author_name ?? [],
        publisher: doc.publisher?.[0] ?? null,
        publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
        description: null, // Search doesn't return descriptions
        pageCount: doc.number_of_pages_median ?? null,
        categories: (doc.subject ?? []).slice(0, 4),
        isbn10,
        isbn13,
        coverUrl: olCoverUrl(coverId, isbn13 ?? isbn10, 'M'),
        coverUrlLarge: olCoverUrl(coverId, isbn13 ?? isbn10, 'L'),
        language: doc.language?.[0] ?? null,
        previewLink: `${OL_BASE}${doc.key}`,
        infoLink: `${OL_BASE}${doc.key}`,
        averageRating: null,
        ratingsCount: null,
        maturityRating: null,
        saleInfo: null,
        source: 'openlibrary',
      };
    });
  } catch (err) {
    console.error('[OL searchBooks] Failed:', err);
    return [];
  }
}

export async function getBookByISBN(isbn: string, _country?: string): Promise<Book | null> {
  try {
    // Step 1: Fetch edition data by ISBN
    const edition = await fetchOL<OLEditionDetail>(`${OL_BASE}/isbn/${isbn}.json`);

    const workKey = edition.works?.[0]?.key;
    let workData: OLWorkDetail | null = null;
    let ratings: OLRatingsResponse | null = null;

    if (workKey) {
      // Step 2: Fetch work data (description, subjects) and ratings in parallel
      const [work, rate] = await Promise.allSettled([
        fetchOL<OLWorkDetail>(`${OL_BASE}${workKey}.json`),
        fetchOL<OLRatingsResponse>(`${OL_BASE}${workKey}/ratings.json`),
      ]);
      workData = work.status === 'fulfilled' ? work.value : null;
      ratings = rate.status === 'fulfilled' ? rate.value : null;
    }

    // Step 3: Resolve author names
    const authors = await resolveAuthorNames(edition.authors);

    const isbn13 = pickIsbn13(edition.isbn_13);
    const isbn10 = pickIsbn10(edition.isbn_10);
    const coverId = edition.covers?.[0];
    const description = extractDescription(edition.description) ?? extractDescription(workData?.description);
    const subjects = workData?.subjects ?? edition.subjects ?? [];

    return {
      id: isbn13 ?? isbn10 ?? isbn,
      title: edition.title,
      subtitle: edition.subtitle ?? null,
      authors,
      publisher: edition.publishers?.[0] ?? null,
      publishedDate: edition.publish_date ?? null,
      description,
      pageCount: edition.number_of_pages ?? null,
      categories: subjects.slice(0, 4),
      isbn10,
      isbn13,
      coverUrl: olCoverUrl(coverId, isbn13 ?? isbn10, 'M'),
      coverUrlLarge: olCoverUrl(coverId, isbn13 ?? isbn10, 'L'),
      language: extractLanguageCode(edition.languages),
      previewLink: workKey ? `${OL_BASE}${workKey}` : null,
      infoLink: workKey ? `${OL_BASE}${workKey}` : null,
      averageRating: ratings?.summary?.average ?? null,
      ratingsCount: ratings?.summary?.count ?? null,
      maturityRating: null,
      saleInfo: null,
      source: 'openlibrary',
    };
  } catch (err) {
    console.error(`[OL getBookByISBN] Failed for ISBN "${isbn}":`, err);
    return null;
  }
}

export async function getBookByOLKey(key: string, _country?: string): Promise<Book | null> {
  try {
    // Normalize key — could be "OL12345W" or "/works/OL12345W"
    const workPath = key.startsWith('/works/') ? key : `/works/${key}`;

    const [workData, ratings] = await Promise.allSettled([
      fetchOL<OLWorkDetail>(`${OL_BASE}${workPath}.json`),
      fetchOL<OLRatingsResponse>(`${OL_BASE}${workPath}/ratings.json`),
    ]);

    const work = workData.status === 'fulfilled' ? workData.value : null;
    if (!work) return null;

    const rate = ratings.status === 'fulfilled' ? ratings.value : null;

    // Resolve authors from work
    const authorKeys = work.authors?.map((a) => ({ key: a.author.key }));
    const authors = await resolveAuthorNames(authorKeys);

    const coverId = work.covers?.[0];
    const description = extractDescription(work.description);
    const olKey = work.key?.replace('/works/', '') ?? key;

    return {
      id: olKey,
      title: work.title,
      subtitle: null,
      authors,
      publisher: null,
      publishedDate: null,
      description,
      pageCount: null,
      categories: (work.subjects ?? []).slice(0, 4),
      isbn10: null,
      isbn13: null,
      coverUrl: olCoverUrl(coverId, null, 'M'),
      coverUrlLarge: olCoverUrl(coverId, null, 'L'),
      language: null,
      previewLink: `${OL_BASE}${workPath}`,
      infoLink: `${OL_BASE}${workPath}`,
      averageRating: rate?.summary?.average ?? null,
      ratingsCount: rate?.summary?.count ?? null,
      maturityRating: null,
      saleInfo: null,
      source: 'openlibrary',
    };
  } catch (err) {
    console.error(`[OL getBookByOLKey] Failed for key "${key}":`, err);
    return null;
  }
}

export async function getNewBooks(maxResults = 12, _country?: string): Promise<Book[]> {
  try {
    const currentYear = new Date().getFullYear();
    // Search for books first published this year, sorted by edition count (proxy for popularity)
    const url = `${OL_BASE}/search.json?q=first_publish_year:${currentYear}&sort=editions&limit=${maxResults * 4}&fields=key,title,subtitle,author_name,isbn,cover_i,first_publish_year,subject,publisher,number_of_pages_median,language`;
    const data = await fetchOL<OLSearchResponse>(url);

    const books = (data.docs ?? [])
      .filter((doc) => {
        // Must have a cover
        if (!doc.cover_i) return false;
        // Must have at least one author
        if (!doc.author_name || doc.author_name.length === 0) return false;
        // Prefer English books (accept if no language info available)
        const langs = doc.language ?? [];
        if (langs.length > 0 && !langs.includes('eng')) return false;
        return true;
      })
      .map((doc): Book => {
        const isbns = doc.isbn ?? [];
        const isbn13 = pickIsbn13(isbns);
        const isbn10 = pickIsbn10(isbns);
        const id = isbn13 ?? isbn10 ?? doc.key.replace('/works/', '');

        return {
          id,
          title: doc.title,
          subtitle: doc.subtitle ?? null,
          authors: doc.author_name ?? [],
          publisher: doc.publisher?.[0] ?? null,
          publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
          description: null,
          pageCount: doc.number_of_pages_median ?? null,
          categories: (doc.subject ?? []).slice(0, 4),
          isbn10,
          isbn13,
          coverUrl: olCoverUrl(doc.cover_i, isbn13 ?? isbn10, 'M'),
          coverUrlLarge: olCoverUrl(doc.cover_i, isbn13 ?? isbn10, 'L'),
          language: doc.language?.[0] ?? null,
          previewLink: `${OL_BASE}${doc.key}`,
          infoLink: `${OL_BASE}${doc.key}`,
          averageRating: null,
          ratingsCount: null,
          maturityRating: null,
          saleInfo: null,
          source: 'openlibrary',
        };
      });

    return books.slice(0, maxResults);
  } catch (err) {
    console.error('[OL getNewBooks] Failed:', err);
    return [];
  }
}

export async function getComingSoonBooks(maxResults = 10, _country?: string): Promise<Book[]> {
  try {
    const currentYear = new Date().getFullYear();
    const url = `${OL_BASE}/search.json?q=first_publish_year:${currentYear}&sort=new&limit=${maxResults * 2}&fields=key,title,subtitle,author_name,isbn,cover_i,subject,first_publish_year,language`;

    const data = await fetchOL<OLSearchResponse>(url);
    const todayStr = new Date().toISOString().slice(0, 10);

    const books = (data.docs ?? [])
      .filter((doc) => doc.cover_i && doc.author_name?.length)
      .map((doc): Book => {
        const isbn13 = doc.isbn?.find((i) => i.length === 13) ?? null;
        const isbn10 = doc.isbn?.find((i) => i.length === 10) ?? null;
        return {
          id: isbn13 ?? isbn10 ?? doc.key.replace('/works/', ''),
          title: doc.title,
          subtitle: doc.subtitle ?? null,
          authors: doc.author_name ?? [],
          publisher: doc.publisher?.[0] ?? null,
          publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
          description: null,
          pageCount: doc.number_of_pages_median ?? null,
          categories: (doc.subject ?? []).slice(0, 4),
          isbn10,
          isbn13,
          coverUrl: olCoverUrl(doc.cover_i, isbn13 ?? isbn10, 'M'),
          coverUrlLarge: olCoverUrl(doc.cover_i, isbn13 ?? isbn10, 'L'),
          language: doc.language?.[0] ?? null,
          previewLink: `${OL_BASE}${doc.key}`,
          infoLink: `${OL_BASE}${doc.key}`,
          averageRating: null,
          ratingsCount: null,
          maturityRating: null,
          saleInfo: null,
          source: 'openlibrary',
        };
      });

    return books.slice(0, maxResults);
  } catch (err) {
    console.error('[OL getComingSoonBooks] Failed:', err);
    return [];
  }
}

export async function getBooksBySubject(subject: string, maxResults = 10): Promise<Book[]> {
  try {
    const slug = subject.toLowerCase().replace(/\s+/g, '_');
    const data = await fetchOL<OLSubjectResponse>(`${OL_BASE}/subjects/${slug}.json?limit=${maxResults * 2}`);

    return (data.works ?? [])
      .filter((w) => w.cover_id || w.cover_edition_key)
      .slice(0, maxResults)
      .map((w): Book => {
        const isbn = w.availability?.isbn ?? null;
        return {
          id: isbn ?? w.key.replace('/works/', ''),
          title: w.title,
          subtitle: null,
          authors: w.authors?.map((a) => a.name) ?? [],
          publisher: null,
          publishedDate: w.first_publish_year ? String(w.first_publish_year) : null,
          description: null,
          pageCount: null,
          categories: (w.subject ?? []).slice(0, 4),
          isbn10: null,
          isbn13: isbn,
          coverUrl: olCoverUrl(w.cover_id, isbn, 'M'),
          coverUrlLarge: olCoverUrl(w.cover_id, isbn, 'L'),
          language: null,
          previewLink: `${OL_BASE}${w.key}`,
          infoLink: `${OL_BASE}${w.key}`,
          averageRating: null,
          ratingsCount: null,
          maturityRating: null,
          saleInfo: null,
          source: 'openlibrary',
        };
      });
  } catch (err) {
    console.error(`[OL getBooksBySubject] Failed for "${subject}":`, err);
    return [];
  }
}

export async function getSimilarBooks(bookId: string, _country?: string): Promise<Book[]> {
  try {
    // First resolve the book to get its categories
    const book = isISBN(bookId)
      ? await getBookByISBN(bookId)
      : await getBookByOLKey(bookId);

    if (!book) return [];

    const subject = book.categories[0];
    if (!subject) {
      // Fall back to author search if no categories
      if (book.authors.length > 0) {
        const results = await searchBooks(book.authors[0], 8);
        return results.filter((b) => b.id !== bookId);
      }
      return [];
    }

    const results = await getBooksBySubject(subject, 8);
    return results.filter((b) => b.id !== bookId && b.id !== book.id);
  } catch (err) {
    console.error(`[OL getSimilarBooks] Failed for "${bookId}":`, err);
    return [];
  }
}

// --- Smart book resolver ---

function isISBN(str: string): boolean {
  const cleaned = str.replace(/-/g, '');
  return /^(?:\d{10}|\d{13}|\d{9}[\dXx])$/.test(cleaned);
}

function isOLKey(str: string): boolean {
  return /^OL\d+[AMW]$/.test(str);
}

/**
 * Resolve a book by any ID format:
 * - ISBN → Open Library ISBN lookup
 * - OL key → Open Library work lookup
 * - Other (legacy Google Books volume ID) → Google Books fallback
 */
export async function resolveBook(id: string, country?: string): Promise<Book | null> {
  if (isISBN(id)) {
    return getBookByISBN(id, country);
  }
  if (isOLKey(id)) {
    return getBookByOLKey(id, country);
  }
  // Legacy Google Books volume ID — use Google Books directly
  const { getBookById } = await import('./google-books');
  return getBookById(id, country);
}

// --- Editions and series ---

async function resolveWorkKey(bookId: string): Promise<string | null> {
  try {
    if (isOLKey(bookId)) return `/works/${bookId}`;
    if (isISBN(bookId)) {
      const edition = await fetchOL<OLEditionDetail>(`${OL_BASE}/isbn/${bookId}.json`);
      return edition.works?.[0]?.key ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getWorkEditions(bookId: string): Promise<BookEdition[]> {
  try {
    const workKey = await resolveWorkKey(bookId);
    if (!workKey) return [];

    const workPath = workKey.replace(/^\//, '');
    const data = await fetchOL<OLEditionsListResponse>(`${OL_BASE}/${workPath}/editions.json?limit=100`);
    const entries = data.entries ?? [];

    // Current book's ISBN to exclude
    const currentIsbn = isISBN(bookId) ? bookId.replace(/-/g, '') : null;
    const seen = new Set<string>();

    return entries
      .filter((e) => {
        const isbn = e.isbn_13?.[0] ?? e.isbn_10?.[0];
        if (!isbn) return false;
        // Exclude current book
        if (currentIsbn && isbn.replace(/-/g, '') === currentIsbn) return false;
        // Deduplicate
        if (seen.has(isbn)) return false;
        seen.add(isbn);
        return true;
      })
      .map((e): BookEdition => {
        const isbn13 = e.isbn_13?.[0] ?? null;
        const isbn10 = e.isbn_10?.[0] ?? null;
        return {
          isbn13,
          isbn10,
          title: e.title ?? null,
          publishDate: e.publish_date ?? null,
          publishers: e.publishers ?? [],
          language: extractLanguageCode(e.languages),
          coverUrl: olCoverUrl(e.covers?.[0], isbn13 ?? isbn10, 'S'),
          format: e.physical_format ?? null,
        };
      });
  } catch (err) {
    console.error('[OL getWorkEditions] Failed:', err);
    return [];
  }
}

export async function getBookSeries(bookId: string): Promise<BookSeries | null> {
  try {
    const workKey = await resolveWorkKey(bookId);
    if (!workKey) return null;

    const work = await fetchOL<OLWorkDetail>(`${OL_BASE}${workKey}.json`);
    const subjects = work.subjects ?? [];

    const seriesSubject = subjects.find((s) => s.toLowerCase().startsWith('series:'));
    if (!seriesSubject) return null;

    const seriesName = seriesSubject.substring(7).replace(/_/g, ' ').trim();
    const slug = seriesSubject.substring(7).toLowerCase().replace(/\s+/g, '_');

    const data = await fetchOL<OLSubjectResponse>(`${OL_BASE}/subjects/series:${slug}.json?limit=20`);
    const currentWorkKey = workKey;

    const books = (data.works ?? [])
      .filter((w) => w.key !== currentWorkKey && (w.cover_id || w.cover_edition_key))
      .map((w) => {
        const isbn = w.availability?.isbn ?? null;
        return {
          id: isbn ?? w.key.replace('/works/', ''),
          title: w.title,
          authors: w.authors?.map((a) => a.name) ?? [],
          coverUrl: olCoverUrl(w.cover_id, isbn, 'M'),
        };
      });

    if (books.length === 0) return null;
    return { seriesName, books };
  } catch (err) {
    console.error('[OL getBookSeries] Failed:', err);
    return null;
  }
}

// --- Regional ISBN resolution (kept from original) ---

interface OLFullEdition {
  isbn_13?: string[];
  isbn_10?: string[];
  publish_country?: string;
  title?: string;
  publishers?: string[];
  publish_date?: string;
  languages?: Array<{ key: string }>;
  covers?: number[];
  physical_format?: string;
}

interface OLEditionsListResponse {
  entries?: OLFullEdition[];
}

export interface RegionalIsbnResult {
  isbn13: string | null;
  isbn10: string | null;
}

const MARC_COUNTRY_CODES: Record<Region, string[]> = {
  GB: ['xxk', 'enk', 'stk', 'wlk'],
  US: ['xxu', 'nyu', 'miu'],
};

export async function resolveRegionalIsbn(
  isbn: string,
  region: Region,
  bookInfo?: { title: string; authors: string[] },
): Promise<RegionalIsbnResult> {
  const fallback: RegionalIsbnResult = { isbn13: null, isbn10: null };

  if (region === 'US') return fallback;

  const olResult = await resolveViaOpenLibrary(isbn, region);
  if (olResult.isbn13 || olResult.isbn10) return olResult;

  if (bookInfo && bookInfo.title && bookInfo.authors.length > 0) {
    const gbResult = await resolveViaGoogleBooks(isbn, region, bookInfo.title, bookInfo.authors);
    if (gbResult.isbn13 || gbResult.isbn10) return gbResult;
  }

  return fallback;
}

async function resolveViaOpenLibrary(
  isbn: string,
  region: Region,
): Promise<RegionalIsbnResult> {
  const fallback: RegionalIsbnResult = { isbn13: null, isbn10: null };

  try {
    const edition = await fetchOL<{ works?: Array<{ key: string }> }>(`${OL_BASE}/isbn/${isbn}.json`);
    const workKey = edition.works?.[0]?.key;
    if (!workKey) return fallback;

    const workPath = workKey.replace(/^\//, '');
    const editionsData = await fetchOL<OLEditionsListResponse>(`${OL_BASE}/${workPath}/editions.json?limit=100`);
    const entries = editionsData.entries ?? [];
    const targetCodes = MARC_COUNTRY_CODES[region];

    const match = entries.find(
      (e) =>
        e.publish_country !== undefined &&
        targetCodes.includes(e.publish_country.trim()) &&
        (e.isbn_13?.length ?? 0) > 0,
    );

    if (!match) return fallback;

    return {
      isbn13: match.isbn_13?.[0] ?? null,
      isbn10: match.isbn_10?.[0] ?? null,
    };
  } catch {
    return fallback;
  }
}

async function resolveViaGoogleBooks(
  originalIsbn: string,
  region: Region,
  title: string,
  authors: string[],
): Promise<RegionalIsbnResult> {
  const fallback: RegionalIsbnResult = { isbn13: null, isbn10: null };

  try {
    const authorQuery = authors[0] ?? '';
    const query = `${title} ${authorQuery}`;

    const url = new URL(`${config.googleBooks.baseUrl}/volumes`);
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('printType', 'books');
    if (config.googleBooks.apiKey) {
      url.searchParams.set('key', config.googleBooks.apiKey);
    }

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return fallback;

    const data = (await res.json()) as GoogleBooksSearchResponse;
    const items = data.items ?? [];

    for (const item of items) {
      const identifiers = item.volumeInfo.industryIdentifiers ?? [];
      const isbn13 = identifiers.find((i) => i.type === 'ISBN_13')?.identifier ?? null;
      const isbn10 = identifiers.find((i) => i.type === 'ISBN_10')?.identifier ?? null;

      if (
        isbn13 &&
        isbn13 !== originalIsbn &&
        item.volumeInfo.title?.toLowerCase() === title.toLowerCase()
      ) {
        return { isbn13, isbn10 };
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}
