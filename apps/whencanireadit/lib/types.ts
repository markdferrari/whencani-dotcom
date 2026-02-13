// Normalized book representation (from Google Books API)
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
