import { config } from './config';
import { getBookByISBN } from './google-books';
import type { NYTBestsellerList, NYTBook, NYTListResponse } from './types';

type BestsellerListName =
  | 'combined-print-and-e-book-fiction'
  | 'combined-print-and-e-book-nonfiction'
  | 'hardcover-fiction'
  | 'hardcover-nonfiction'
  | 'paperback-nonfiction';

// Cache ISBN→Google Books ID mappings for 24h + up to 1h jitter to avoid thundering herd
const GOOGLE_ID_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h in ms
const GOOGLE_ID_CACHE_JITTER = 60 * 60 * 1000; // 1h in ms
const googleIdCache = new Map<string, { expires: number; googleBooksId: string | null }>();

function normalizeNYTBook(raw: NYTListResponse['results']['books'][number]): NYTBook {
  return {
    title: raw.title,
    author: raw.author,
    publisher: raw.publisher,
    description: raw.description,
    isbn13: raw.primary_isbn13,
    isbn10: raw.primary_isbn10,
    rank: raw.rank,
    rankLastWeek: raw.rank_last_week,
    weeksOnList: raw.weeks_on_list,
    coverUrl: raw.book_image || null,
    amazonUrl: raw.amazon_product_url || null,
    buyLinks: raw.buy_links ?? [],
    googleBooksId: null, // Resolved separately via ISBN lookup
  };
}

export async function getBestsellerList(listName: BestsellerListName): Promise<NYTBestsellerList> {
  const apiKey = config.nytBooks.apiKey;
  if (!apiKey) {
    throw new Error('NYT_BOOKS_API_KEY is not configured');
  }

  const url = `${config.nytBooks.baseUrl}/lists/current/${listName}.json?api-key=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
  if (!res.ok) {
    throw new Error(`NYT Books API error: ${res.status} ${res.statusText}`);
  }

  const data: NYTListResponse = await res.json();
  const results = data.results;

  return {
    listName: results.list_name,
    displayName: results.display_name,
    publishedDate: results.published_date,
    books: results.books.map(normalizeNYTBook),
  };
}

export async function getFictionBestsellers(): Promise<NYTBestsellerList> {
  return getBestsellerList('combined-print-and-e-book-fiction');
}

export async function getNonfictionBestsellers(): Promise<NYTBestsellerList> {
  return getBestsellerList('combined-print-and-e-book-nonfiction');
}

function getCachedGoogleId(isbn: string): { hit: true; googleBooksId: string | null } | { hit: false } {
  const entry = googleIdCache.get(isbn);
  if (entry && entry.expires > Date.now()) {
    return { hit: true, googleBooksId: entry.googleBooksId };
  }
  return { hit: false };
}

function cacheGoogleId(isbn: string, googleBooksId: string | null): void {
  const jitter = Math.floor(Math.random() * GOOGLE_ID_CACHE_JITTER);
  googleIdCache.set(isbn, { expires: Date.now() + GOOGLE_ID_CACHE_TTL + jitter, googleBooksId });
}

/**
 * Resolve Google Books volume IDs for every book in a list via parallel ISBN lookups.
 * Results are cached for 24h (+jitter) to avoid hammering the Google Books API.
 * Books that can't be matched keep `googleBooksId: null`.
 */
export async function enrichWithGoogleIds(list: NYTBestsellerList): Promise<NYTBestsellerList> {
  const enriched = await Promise.all(
    list.books.map(async (book) => {
      if (book.googleBooksId) return book;

      const isbn = book.isbn13 || book.isbn10;
      if (!isbn) return book;

      const cached = getCachedGoogleId(isbn);
      if (cached.hit) {
        return cached.googleBooksId ? { ...book, googleBooksId: cached.googleBooksId } : book;
      }

      try {
        const match = await getBookByISBN(isbn);
        cacheGoogleId(isbn, match?.id ?? null);
        return match ? { ...book, googleBooksId: match.id } : book;
      } catch {
        return book;
      }
    }),
  );

  return { ...list, books: enriched };
}
