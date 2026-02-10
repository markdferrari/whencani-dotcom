# 0003 – Compose the release-focused homepage

## Status
Accepted

## Context
The site’s primary goal is to help people track release dates, so we needed a homepage that clearly communicates what’s coming to theaters and streaming while still leaving room for quick filtering and discovery. The homepage also had to introduce the newer Find Showtimes feature without overwhelming the small-screen experience.

## Decision
We treated `app/page.tsx` as a server component that orchestrates all TMDB calls through `lib/tmdb.ts` (`getTrendingTheatrical`, `getTrendingStreaming`, `getUpcomingMovies`, `getNowPlayingMovies`, and `getMovieGenres`). The layout is a three-column grid on large screens with two asides (trending carousels and filters/find showtimes) around a central section of release cards:

- The hero section introduces the mission with a leading gradient background and typography.
- The left sidebar hosts two `TrendingCarousel` instances (`TrendingCarousel.tsx` handles embla, hold scrolling, and rich cards) to highlight theatrical and streaming buzz.
- The right sidebar keeps discovery compact by wrapping `GenreFilter.tsx` (which syncs view/genre via search params) and the `FindShowtimes` component so location-based discovery is always reachable.
- The main column renders upcoming or recent releases depending on `view` query parameters, using `<Link>`-wrapped cards that lean on `components/MovieCard.tsx` styling and `lib/tmdb.ts` helpers for images and formatted dates.

## Consequences
- The server-heavy data fetching keeps the UI snappy and cache-friendly, while the grid gracefully collapses for mobile devices.
- The combination of carousels, filters, and cards makes the homepage feel like a magazine cover story about new releases rather than a raw API dump.
- Embedding `FindShowtimes` here primes users for the nearby cinema finder before they arrive on a specific movie page.
