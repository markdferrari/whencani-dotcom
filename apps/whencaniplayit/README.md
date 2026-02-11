# When Can I Play It

Discover when games are coming to your preferred gaming platform.

## Documentation

Technical documentation is available in the [docs](./docs/) folder:

- **[Caching Strategy](./docs/caching/overview.md)** - Complete overview of caching implementation
- **[Cache Revalidation API](./docs/caching/revalidation-api.md)** - Manual cache invalidation

## Development

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** AWS Lambda (via SST)
- **APIs:** OpenCritic, IGDB, TMDB

## Environment Variables

Required environment variables:

```bash
IGDB_CLIENT_ID=your-igdb-client-id
IGDB_CLIENT_SECRET=your-igdb-client-secret
RAPID_API_KEY=your-rapidapi-key
REVALIDATE_SECRET=your-revalidation-secret
```

See [.env.example](.env.example) for details.

## Architecture

- **App Directory:** [app](./app/) - Next.js App Router pages and API routes
- **Components:** [components](./components/) - React components
- **Lib:** [lib](./lib/) - API clients and utilities
- **Hooks:** [hooks](./hooks/) - React hooks
- **Docs:** [docs](./docs/) - Technical documentation

## License

See repository root for license information.
