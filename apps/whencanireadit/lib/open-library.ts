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

interface RegionalIsbnResult {
  isbn13: string | null;
  isbn10: string | null;
}

// MARC country codes that correspond to each region
const MARC_COUNTRY_CODES: Record<Region, string[]> = {
  GB: ['xxk', 'enk', 'stk', 'wlk'],
  US: ['xxu', 'nyu', 'miu'],
};

export async function resolveRegionalIsbn(
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
