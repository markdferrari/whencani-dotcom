# 0007 – Implement the Find Showtimes experience

## Status
Accepted

## Context
Phase 1 of the Find Showtimes spec (`SPEC.md`) required a mobile-first, location-aware way to browse nearby cinemas without introducing paid APIs. The experience had to work from the movie detail page and the homepage, handle geolocation denial gracefully, and fall back to city searches, all while ensuring the results stayed fresh yet cacheable.

## Decision
- Built a client component (`components/FindShowtimes/FindShowtimes.tsx`) that auto-requests browser geolocation, exposes a city search form, shows loading/error states, lists cinemas with distances, toggles an embedded map, and links each cinema name to Google Maps via search queries—even when no coordinates are available.
- Added `components/FindShowtimes/NearbyCinemasMap.tsx` using `react-leaflet`/`leaflet` for an interactive fallback map, and imported `leaflet/dist/leaflet.css` in `app/layout.tsx` so the tiles/rendering styles load globally.
- Implemented data helpers in `lib/osm.ts`: geocoding via Nominatim, cinema search via the Overpass API (nodes-only, 25 s timeout, radius hard-capped at 10 km), and `unstable_cache` wrappers that only cache successful responses (7 days for geocodes, 24 hours for cinema searches). The helpers parse JSON carefully, compute haversine distances, and sort results before returning them to the UI.
- Wired two API routes (`app/api/geocode/route.ts` and `app/api/cinemas/nearby/route.ts`) that validate inputs, enforce no-store caching on errors, cap radii, and emit `s-maxage` headers on successes so we can reuse results without hitting Overpass every request.

## Consequences
- The experience satisfies the spec: geolocation, city fallback, map, Google Maps links, and distance formatting are all covered in the client while server helpers keep Overpass/Nominatim usage efficient and cache-friendly.
- The leaflets map and Google Maps links make it easy to switch from discovery to directions, and the route handlers shield the UI from raw third-party behavior.
- Future phases (real showtimes provider) can reuse the same cinema list and map while layering in richer booking links.
