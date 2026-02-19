// Normalized book representation (provider-agnostic)
export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
  categories: string[];
  isbn10: string | null;
  isbn13: string | null;
  coverUrl: string | null;
  coverUrlLarge: string | null;
  language: string | null;
  previewLink: string | null;
  infoLink: string | null;
  averageRating: number | null;
  ratingsCount: number | null;
  maturityRating: string | null;
  saleInfo: BookSaleInfo | null;
  source?: 'google' | 'openlibrary';
}

export interface BookSaleInfo {
  saleability: 'FOR_SALE' | 'NOT_FOR_SALE' | 'FREE' | 'FOR_PREORDER';
  buyLink: string | null;
  listPrice: { amount: number; currencyCode: string } | null;
}

// NYT Bestseller list item
export interface NYTBook {
  title: string;
  author: string;
  publisher: string;
  description: string;
  isbn13: string;
  isbn10: string;
  rank: number;
  rankLastWeek: number;
  weeksOnList: number;
  coverUrl: string | null;
  amazonUrl: string | null;
  buyLinks: Array<{ name: string; url: string }>;
  googleBooksId: string | null;
}

export interface NYTBestsellerList {
  listName: string;
  displayName: string;
  publishedDate: string;
  books: NYTBook[];
}

// Bookshelf item (for cookie-based storage)
export interface BookshelfItem {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  publishedDate: string | null;
  categories: string[];
  isbn13: string | null;
}

// Buy link structure
export interface BuyLink {
  name: string;
  url: string;
  icon: string;
}

// Google Books API raw response types
export interface GoogleBooksVolumeResponse {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13' | 'OTHER';
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
  };
  saleInfo?: {
    saleability: string;
    buyLink?: string;
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
  };
}

export interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolumeResponse[];
}

// Open Library API response types
export interface OLSearchResponse {
  numFound: number;
  docs: OLSearchDoc[];
}

export interface OLSearchDoc {
  key: string; // "/works/OL..."
  title: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
  language?: string[];
}

export interface OLEditionDetail {
  title: string;
  subtitle?: string;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  isbn_13?: string[];
  isbn_10?: string[];
  covers?: number[];
  works?: Array<{ key: string }>;
  authors?: Array<{ key: string }>;
  languages?: Array<{ key: string }>;
  description?: string | { type: string; value: string };
  subjects?: string[];
  physical_format?: string;
  publish_country?: string;
}

export interface OLWorkDetail {
  key: string;
  title: string;
  description?: string | { type: string; value: string };
  covers?: number[];
  subjects?: string[];
  authors?: Array<{ author: { key: string }; type?: { key: string } }>;
}

export interface OLRatingsResponse {
  summary: {
    average?: number;
    count?: number;
  };
}

export interface OLTrendingResponse {
  works: OLTrendingWork[];
}

export interface OLTrendingWork {
  key: string;
  title: string;
  edition_count: number;
  first_publish_year?: number;
  cover_i?: number;
  cover_edition_key?: string;
  author_key?: string[];
  author_name?: string[];
  subject?: string[];
  ia?: string[];
  availability?: { isbn?: string };
}

export interface OLSubjectResponse {
  name: string;
  work_count: number;
  works: OLSubjectWork[];
}

export interface OLSubjectWork {
  key: string;
  title: string;
  edition_count: number;
  cover_id?: number;
  cover_edition_key?: string;
  authors?: Array<{ name: string; key: string }>;
  first_publish_year?: number;
  subject?: string[];
  ia?: string[];
  availability?: { isbn?: string };
}

export interface OLAuthorResponse {
  name: string;
  key: string;
}

// Book edition (different format/language/publisher of the same work)
export interface BookEdition {
  isbn13: string | null;
  isbn10: string | null;
  title: string | null;
  publishDate: string | null;
  publishers: string[];
  language: string | null;
  coverUrl: string | null;
  format: string | null;
}

// Series information with other books in the series
export interface BookSeries {
  seriesName: string;
  books: Array<{
    id: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
  }>;
}

// NYT API raw response types
export interface NYTListResponse {
  status: string;
  results: {
    list_name: string;
    display_name: string;
    bestsellers_date: string;
    published_date: string;
    books: Array<{
      rank: number;
      rank_last_week: number;
      weeks_on_list: number;
      primary_isbn10: string;
      primary_isbn13: string;
      publisher: string;
      description: string;
      title: string;
      author: string;
      book_image: string;
      amazon_product_url: string;
      buy_links: Array<{
        name: string;
        url: string;
      }>;
    }>;
  };
}
