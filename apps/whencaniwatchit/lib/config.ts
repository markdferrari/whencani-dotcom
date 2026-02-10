// Type-safe config wrapper for environment variables
// All config values are read from process.env at runtime

export const config = {
  tmdb: {
    get apiKey(): string {
      return process.env.TMDB_API_KEY ?? '';
    },
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  google: {
    get mapsApiKey(): string {
      return process.env.GOOGLE_MAPS_API_KEY ?? '';
    },
  },
  aws: {
    get acmCertificateArn(): string {
      return process.env.ACM_CERTIFICATE_ARN ?? '';
    },
    get route53ZoneId(): string {
      return process.env.ROUTE53_ZONE_ID ?? '';
    },
  },
  app: {
    name: 'When Can I Watch It',
    url: 'https://whencaniwatchit.com',
  },
} as const;
