import { config } from './config';
import type { NYTBestsellerList, NYTBook, NYTListResponse } from './types';

type BestsellerListName =
  | 'combined-print-and-e-book-fiction'
  | 'combined-print-and-e-book-nonfiction'
  | 'hardcover-fiction'
  | 'hardcover-nonfiction'
  | 'paperback-nonfiction';

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
    googleBooksId: null,
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
