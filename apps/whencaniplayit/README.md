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

**Quick Setup:**

```bash
# 1. Local development - copy and edit .env.local
cp .env.example .env.local
nano .env.local

# 2. Production - set SST secrets (one-time)
yarn sst secret set IgdbClientId "your-value"
yarn sst secret set IgdbClientSecret "your-value"
yarn sst secret set RapidApiKey "your-value"
yarn sst secret set RevalidateSecret "your-value"

# Or use the interactive setup script from repo root
../../scripts/setup-secrets.sh
```

**Full documentation:** See [ENVIRONMENT_VARIABLES.md](../../ENVIRONMENT_VARIABLES.md) in the repository root.

## Architecture

- **App Directory:** [app](./app/) - Next.js App Router pages and API routes
- **Components:** [components](./components/) - React components
- **Lib:** [lib](./lib/) - API clients and utilities
- **Hooks:** [hooks](./hooks/) - React hooks
- **Docs:** [docs](./docs/) - Technical documentation

## License

See repository root for license information.
