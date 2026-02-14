// Type-safe config wrapper for environment variables
// All config values are read from process.env at runtime

export const config = {
  igdb: {
    get clientId(): string {
      return process.env.IGDB_CLIENT_ID ?? '';
    },
    get clientSecret(): string {
      return process.env.IGDB_CLIENT_SECRET ?? '';
    },
    baseUrl: 'https://api.igdb.com/v4',
  },
  opencritic: {
    baseUrl: 'https://opencritic-api.p.rapidapi.com',
    get rapidApiKey(): string {
      return process.env.RAPID_API_KEY ?? '';
    },
  },
  app: {
    name: 'When Can I Play It',
    url: 'https://whencaniplayit.com',
  },
  amazon: {
    domain: 'amazon.co.uk',
    tag: 'whencaniplayg-21',
  },
  features: {
    get watchlistImprovements(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_WATCHLIST_IMPROVEMENTS === 'true';
    },
    get standardCarousels(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_STANDARD_CAROUSELS === 'true';
    },
    get amazonAffiliates(): boolean {
      return process.env.NEXT_PUBLIC_FEATURE_AMAZON_AFFILIATES === 'true';
    },
  },
} as const;
