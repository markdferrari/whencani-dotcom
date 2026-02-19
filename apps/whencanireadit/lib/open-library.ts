import { config } from './config';
import type { GoogleBooksSearchResponse } from './types';
import type { Region } from './region';

type CoverSize = 'S' | 'M' | 'L';

export function getOpenLibraryCoverUrl(isbn: string, size: CoverSize = 'L'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

export async function getOpenLibraryCover(isbn: string): Promise<string | null> {
  const url = getOpenLibraryCoverUrl(isbn, 'L');

  try {
    // Check if cover exists (Open Library returns a 1x1 pixel for missing covers)
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    // A 1x1 placeholder is typically under 1KB
    if (contentLength && parseInt(contentLength, 10) < 1000) return null;

    return url;
  } catch {
    return null;
  }
}

// --- Regional ISBN resolution via Open Library Works + Editions API ---

interface OLEditionResponse {
  works?: Array<{ key: string }>;
}

interface OLEdition {
  isbn_13?: string[];
  isbn_10?: string[];
  publish_country?: string;
}

interface OLEditionsResponse {
  entries?: OLEdition[];
}

export interface RegionalIsbnResult {
  isbn13: string | null;
  isbn10: string | null;
}

// MARC country codes that correspond to each region
const MARC_COUNTRY_CODES: Record<Region, string[]> = {
  GB: ['xxk', 'enk', 'stk', 'wlk'],
  US: ['xxu', 'nyu', 'miu'],
};

/**
 * Resolve an ISBN to the correct regional edition.
 *
 * Strategy:
 * 1. Try Open Library Works + Editions API (has explicit publish_country)
 * 2. Fall back to Google Books search by title+author to find alternate editions
 *
 * Pass `title` and `authors` to enable the Google Books fallback.
 */
export async function resolveRegionalIsbn(
  isbn: string,
  region: Region,
  bookInfo?: { title: string; authors: string[] },
): Promise<RegionalIsbnResult> {
  const fallback: RegionalIsbnResult = { isbn13: null, isbn10: null };

  // Step 1: Try Open Library
  const olResult = await resolveViaOpenLibrary(isbn, region);
  if (olResult.isbn13 || olResult.isbn10) return olResult;

  // Step 2: Fall back to Google Books if we have title+author info
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
    // Step 1: resolve ISBN to a Work key
    const editionRes = await fetch(
      `https://openlibrary.org/isbn/${isbn}.json`,
      { next: { revalidate: 86400 } },
    );
    if (!editionRes.ok) return fallback;

    const edition = (await editionRes.json()) as OLEditionResponse;
    const workKey = edition.works?.[0]?.key;
    if (!workKey) return fallback;

    // workKey is e.g. "/works/OL45883W" — strip leading slash
    const workPath = workKey.replace(/^\//, '');

    // Step 2: fetch all editions for the work
    const editionsRes = await fetch(
      `https://openlibrary.org/${workPath}/editions.json?limit=100`,
      { next: { revalidate: 86400 } },
    );
    if (!editionsRes.ok) return fallback;

    const editionsData = (await editionsRes.json()) as OLEditionsResponse;
    const entries = editionsData.entries ?? [];
    const targetCodes = MARC_COUNTRY_CODES[region];

    // Step 3: find the first edition matching the target region with an ISBN
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

/**
 * Google Books fallback: search for the same book by title+author with the
 * `country` parameter set to the target region. Google Books often returns
 * separate volumes for different regional editions (each with its own ISBN).
 * We pick the edition whose ISBN differs from the original — that's the
 * regional variant.
 */
async function resolveViaGoogleBooks(
  originalIsbn: string,
  region: Region,
  title: string,
  authors: string[],
): Promise<RegionalIsbnResult> {
  const fallback: RegionalIsbnResult = { isbn13: null, isbn10: null };

  try {
    // Use a plain query (no intitle:/inauthor: prefixes) so Google Books
    // returns all editions rather than deduplicating into one result.
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

    // Find an edition with a different ISBN13 than the original
    for (const item of items) {
      const identifiers = item.volumeInfo.industryIdentifiers ?? [];
      const isbn13 = identifiers.find((i) => i.type === 'ISBN_13')?.identifier ?? null;
      const isbn10 = identifiers.find((i) => i.type === 'ISBN_10')?.identifier ?? null;

      // Must have an ISBN13, must be different from the one we already have,
      // and must be the same book (title match)
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
