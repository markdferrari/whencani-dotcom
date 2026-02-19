// Type-safe config wrapper for environment variables
// All config values are read from process.env at runtime

export const config = {
  googleBooks: {
    get apiKey(): string {
      return process.env.GOOGLE_BOOKS_API_KEY ?? '';
    },
    baseUrl: 'https://www.googleapis.com/books/v1',
  },
  nytBooks: {
    get apiKey(): string {
      return process.env.NYT_BOOKS_API_KEY ?? '';
    },
    baseUrl: 'https://api.nytimes.com/svc/books/v3',
  },
  app: {
    name: 'When Can I Read It',
    url: 'https://whencanireadit.com',
  },
  features: {
    get search(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_SEARCH === 'true';
    },
    get bookshelfImprovements(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_BOOKSHELF_IMPROVEMENTS === 'true';
    },
    get nytBestsellers(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_NYT_BESTSELLERS === 'true';
    },
    get buyLinks(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_BUY_LINKS === 'true';
    },
    get calendar(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_CALENDAR === 'true';
    },
    get standardCarousels(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_STANDARD_CAROUSELS === 'true';
    },
    get regionalIsbn(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_REGIONAL_ISBN === 'true';
    },
    get regionSwitcher(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_REGION_SWITCHER === 'true';
    },
    get homepageGenreCarousels(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_HOMEPAGE_GENRE_CAROUSELS === 'true';
    },
    get bookshelfPage(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_BOOKSHELF_PAGE === 'true';
    },
    get openLibraryPrimary(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_OPEN_LIBRARY_PRIMARY === 'true';
    },
  },
} as const;
