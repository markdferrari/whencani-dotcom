# C4 Overview – WhenCanIWatchIt Components

## Context
This diagram explains how the WhenCanIWatchIt.com experience is constructed for users, the Next.js application, and the third-party systems it relies on for content and location data.

```mermaid
%%{init: { 'securityLevel': 'strict' }}%%
C4Context
  title WhenCanIWatchIt.com Context
  Person(user, "Visitor")
  Person(productOwner, "Product Owner")
  System(webApp, "WhenCanIWatchIt.com Web App", "Next.js 16.1.6 / React 19", "Presents movie release tracking, filters, and Find Showtimes UX")
  System(tmdb, "TMDB API", "third-party API", "Provides movie metadata, release dates, watch providers, cast/crew")
  System(osm, "OpenStreetMap Services", "third-party API", "Delivers geocoding (Nominatim) and nearby cinemas (Overpass)")
  System(googleMaps, "Google Maps", "web service", "Receives search queries for cinema directions/booking")

  Rel(user, webApp, "Browses homepage, detail pages, and showtimes")
  Rel(productOwner, webApp, "Publishes updates via semantic-release + SST deploy")
  Rel(webApp, tmdb, "Fetches movie/trending data", "HTTPS, cached via tmdbFetch")
  Rel(webApp, osm, "Calls /api/geocode and /api/cinemas/nearby", "POST, radius capped to 10km")
  Rel(webApp, googleMaps, "Links to cinema search results", "GET query")
```

## Containers & Components
```mermaid
%%{init: { 'securityLevel': 'strict' }}%%
C4Container
  title WhenCanIWatchIt.com Container View
  Person(visitor, "Visitor", "Uses desktop or mobile browser to browse releases and find cinemas")
  System_Boundary(nextApp, "WhenCanIWatchIt.com") {
    Container(frontend, "Next.js App", "React 19 client + App Router", "Serves homepage, detail page, Find Showtimes UI")
    Container(api, "API Routes", "Next.js Route Handlers", "Expose /api/geocode and /api/cinemas/nearby")
    Container(dbCache, "Next.js Edge Cache", "Caching layer", "Stores TMDB + Overpass results per route")
  }
  System(tmdb, "TMDB API", "REST API")
  System(osm, "OpenStreetMap (Nominatim + Overpass)", "REST APIs")
  System(googleMaps, "Google Maps Search", "Web search link")
  System(sst, "SST + AWS", "Hosting and deployment")

  Rel(visitor, frontend, "Loads pages, interacts with showtimes search")
  Rel(frontend, api, "Calls to geocode/cinemas for location data and caches results")
  Rel(frontend, dbCache, "Uses Next.js caching headers")
  Rel(api, osm, "Fetches geocode + cinema nodes (nodes-only query, 25s timeout)")
  Rel(frontend, tmdb, "Fetches movies, genres, credits via tmdbFetch")
  Rel(frontend, googleMaps, "Opens cinema directions/results in new tab")
  Rel(sst, frontend, "Deploys Next.js app, manages ACM cert + DNS")
```

## Key Components
- `components/FindShowtimes/FindShowtimes.tsx`: client component that handles geolocation, city search form, map toggle, and cinema list rendering.
- `components/FindShowtimes/NearbyCinemasMap.tsx`: Leaflet map (lazy loaded) visualizing center point, search radius, and cinema markers.
- `app/api/geocode/route.ts` and `app/api/cinemas/nearby/route.ts`: server routes validating input, capping radius, and forwarding requests to Nominatim/Overpass via `lib/osm.ts` helpers.
- `lib/osm.ts`: wrappers around OpenStreetMap APIs with `unstable_cache`, haversine distance calculations, and JSON parsing safeguards.
- `lib/tmdb.ts`: central TMDB fetch helper that sets `revalidate` TTLs, handles API key errors, and exposes `getUpcomingMovies`, `getTrendingTheatrical`, etc.
- `app/page.tsx` + `app/movie/[id]/page.tsx`: server components that orchestrate data fetching and slot in carousels, filters, and the Find Showtimes module.
- `sst.config.ts` + `.github/workflows/release.yml`: infrastructure that deploys the app to AWS via SST and automates release tagging with `semantic-release`.

```
Rationale: provide users and stakeholders with a single-bounded view of systems, the container responsibilities, and the key interactions that implement tracking and location discovery while highlighting third-party dependencies.
```
