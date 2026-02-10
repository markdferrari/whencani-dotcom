# 0005 – Deliver release v1 and build the release pipeline

## Status
Accepted

## Context
By the time we reached v1, the product needed filters, richer discovery, and a repeatable deploy step so we could ship predictable updates to production users.

## Decision
We centered the release around the `app/page.tsx` hero grid: two `TrendingCarousel` widgets (`components/TrendingCarousel.tsx`) deliver theatrical and streaming buzz while the `GenreFilter.tsx` / `PlatformFilter.tsx` controls (in the sidebar) let visitors scope the upcoming list without leaving the homepage. `lib/tmdb.ts` now implements helper functions (`getTrendingTheatrical`, `getTrendingStreaming`, `getUpcomingMovies`, `getNowPlayingMovies`, `getMovieGenres`) whose unified `tmdbFetch` uses `fetch(..., { next: { revalidate: 30 * 60 } })` so we can cache TMDB responses for 30 minutes even on server renders.

On the deployment side, we added `.github/workflows/release.yml` to run `semantic-release` on pushes to `main` so each release automatically bumps versioning, changelog, and GitHub releases. `sst.config.ts` now configures the `WhenCanIWatchIt` Next.js site with the production ACM certificate, DNS zone, and Lambda URL permissions so this release can land on the `whencaniwatchit.com` domain. These configuration updates align the infrastructure with the freshly polished UI and ensure we can promote future features without manual hosting work.

## Consequences
- The homepage filters plus embla carousels present both editorial (trending) and functional (filtered upcoming) experiences from a single server render.
- TMDB data is now cached at the edge without introducing client-side fetch logic, which keeps builds fast and avoids hitting rate limits.
- The `semantic-release` workflow and SST domain setup create a repeatable way to ship updates to production, reducing manual release overhead.
