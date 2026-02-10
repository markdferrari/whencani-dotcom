# 0004 – Design the movie detail experience

## Status
Accepted

## Context
We wanted each movie detail view to read like a premium profile card with a hero banner, cast highlights, trailer, and quick sources for showtimes without duplicating data-fetching logic from the homepage.

## Decision
`app/movie/[id]/page.tsx` is a server component that eagerly fetches the movie, credits, and videos data from `lib/tmdb.ts` alongside cast external IDs (for IMDb links). The layout: a backdrop hero, poster column, metadata grid, and a `CastCarousel.tsx` client component that uses `embla-carousel-react` to scroll cast cards with playable `imdbUrl` anchors. Below the hero we expose the trailer iframe (if available), the shared `FindShowtimes` component for live cinema lookup, and the `CastCarousel`. We also ship dedicated `loading.tsx` and `error.tsx` files so the App Router can show polished skeletons or recoverable failure states while the movie data loads.

## Consequences
- The detail page stays consistent with the rest of the site’s theming (rounded cards, gradient background) while still surfacing high-bandwidth content like trailers and cast galleries.
- `FindShowtimes` is in context, so a user can jump from browsing cast/trailer to nearby screenings in one flow.
- The separate loading/error boundaries keep Next.js’ streaming behavior graceful for slow TMDB responses.
