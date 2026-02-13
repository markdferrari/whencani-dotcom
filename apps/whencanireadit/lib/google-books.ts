import { config } from './config';
import type {
  Book,
  GoogleBooksVolumeResponse,
  GoogleBooksSearchResponse,
} from './types';

function normalizeVolume(raw: GoogleBooksVolumeResponse): Book {
  const info = raw.volumeInfo;
  const identifiers = info.industryIdentifiers ?? [];
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10')?.identifier ?? null;
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13')?.identifier ?? null;

  // Prefer largest available image, falling back to thumbnail
  const images = info.imageLinks;
  const coverUrlLarge =
    images?.extraLarge ?? images?.large ?? images?.medium ?? images?.small ?? images?.thumbnail ?? null;
  const coverUrl = images?.thumbnail ?? images?.smallThumbnail ?? coverUrlLarge;

  // Google Books serves http URLs — upgrade to https
  const toHttps = (url: string | null): string | null =>
    url ? url.replace(/^http:/, 'https:') : null;

  const saleInfo = raw.saleInfo;

  return {
    id: raw.id,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    description: info.description ?? null,
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    isbn10,
    isbn13,
    coverUrl: toHttps(coverUrl),
    coverUrlLarge: toHttps(coverUrlLarge),
    language: info.language ?? null,
    previewLink: info.previewLink ?? null,
    infoLink: info.infoLink ?? null,
    averageRating: info.averageRating ?? null,
    ratingsCount: info.ratingsCount ?? null,
    maturityRating: info.maturityRating ?? null,
    saleInfo: saleInfo
      ? {
          saleability: saleInfo.saleability as NonNullable<Book['saleInfo']>['saleability'],
          buyLink: saleInfo.buyLink ?? null,
          listPrice: saleInfo.listPrice ?? null,
        }
      : null,
  };
}

async function fetchGoogleBooks(path: string, params: Record<string, string> = {}): Promise<Response> {
  const url = new URL(`${config.googleBooks.baseUrl}${path}`);
  if (config.googleBooks.apiKey) {
    url.searchParams.set('key', config.googleBooks.apiKey);
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status} ${res.statusText}`);
  }
  return res;
}

export async function searchBooks(query: string, maxResults = 10): Promise<Book[]> {
  const res = await fetchGoogleBooks('/volumes', {
    q: query,
    maxResults: String(maxResults),
    printType: 'books',
    langRestrict: 'en',
  });
  const data: GoogleBooksSearchResponse = await res.json();
  return (data.items ?? []).map(normalizeVolume);
}

export async function getBookById(volumeId: string): Promise<Book | null> {
  try {
    const res = await fetchGoogleBooks(`/volumes/${volumeId}`);
    const raw: GoogleBooksVolumeResponse = await res.json();
    return normalizeVolume(raw);
  } catch {
    return null;
  }
}

export async function getBookByISBN(isbn: string): Promise<Book | null> {
  const res = await fetchGoogleBooks('/volumes', {
    q: `isbn:${isbn}`,
    maxResults: '1',
  });
  const data: GoogleBooksSearchResponse = await res.json();
  if (!data.items?.length) return null;
  return normalizeVolume(data.items[0]);
}

export async function getNewBooks(maxResults = 12): Promise<Book[]> {
  const res = await fetchGoogleBooks('/volumes', {
    q: 'subject:fiction OR subject:nonfiction',
    orderBy: 'newest',
    maxResults: String(maxResults),
    printType: 'books',
    langRestrict: 'en',
  });
  const data: GoogleBooksSearchResponse = await res.json();
  return (data.items ?? []).map(normalizeVolume);
}

export async function getUpcomingBooks(maxResults = 12): Promise<Book[]> {
  // Google Books doesn't have a clean "upcoming" filter,
  // so we search for pre-order/new books and filter client-side
  const res = await fetchGoogleBooks('/volumes', {
    q: 'subject:fiction OR subject:nonfiction',
    orderBy: 'newest',
    maxResults: String(Math.min(maxResults * 3, 40)),
    printType: 'books',
    langRestrict: 'en',
  });
  const data: GoogleBooksSearchResponse = await res.json();
  const now = new Date();
  const books = (data.items ?? []).map(normalizeVolume);

  const upcoming = books.filter((book) => {
    if (!book.publishedDate) return false;
    try {
      const pubDate = new Date(book.publishedDate);
      return pubDate > now;
    } catch {
      return false;
    }
  });

  return upcoming.slice(0, maxResults);
}

export async function getSimilarBooks(volumeId: string): Promise<Book[]> {
  try {
    // Try the associated volumes endpoint first
    const res = await fetchGoogleBooks(`/volumes/${volumeId}/associated`);
    const data: GoogleBooksSearchResponse = await res.json();
    if (data.items?.length) {
      return data.items.map(normalizeVolume);
    }
  } catch {
    // Fall through to category-based search
  }

  // Fallback: search by same categories/authors
  const book = await getBookById(volumeId);
  if (!book) return [];

  const query = book.categories.length > 0
    ? `subject:${book.categories[0]}`
    : book.authors.length > 0
      ? `inauthor:${book.authors[0]}`
      : book.title;

  const results = await searchBooks(query, 8);
  return results.filter((b) => b.id !== volumeId);
}
