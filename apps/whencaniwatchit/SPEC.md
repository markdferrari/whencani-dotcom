# Find Showtimes (Phase 1) — Implementation Spec

**Scope:** UK, Ireland, US | City fallback | Opens showtimes in new tab

---

## 1) User Experience (mobile-first)

### Entry point (movie detail page)
Add a new section between **Trailer** and **Cast**:
- Title: **Find Showtimes**
- Primary CTA: **Use my location**
- Secondary CTA: **Enter city** (fallback)
- Small print: "Opens showtimes in a new tab."

### Flow: Use my location
1. User taps "Use my location"
2. Browser asks permission
3. On success: load nearby cinemas within **15km radius**
4. Render cinema list with:
   - Name
   - Distance (km in UK/IE, miles in US)
   - "Showtimes" button (opens new tab to Google search)

### Flow: Enter city
1. User types city (e.g. "Dublin", "London", "Boston")
2. App geocodes city → lat/lng
3. Load nearby cinemas as above

### Results UI
Each cinema card:
- Cinema name
- Distance (formatted per locale)
- **Showtimes** button → new tab (Google search: "{movie} showtimes {cinema} {city}")
- Optional: **Open in Maps** button → new tab (Google Maps)

### Empty / error states
- No location permission: show city input
- No results: "No cinemas found within 15km of {city}"
- Network error: "Unable to find showtimes. Please try again."

---

## 2) Data sources

### Nearby cinemas
**OpenStreetMap Overpass API** (no API key)
- Query: cinema/theatre amenities within radius of lat/lng
- Free, good UK/IE/US coverage
- Rate limits apply: must cache + throttle

### City → lat/lng geocoding
**OpenStreetMap Nominatim** (no API key)
- Query: city name → lat/lng + display name
- Needs caching (7 days) + gentle rate limiting

---

## 3) Architecture (Next.js App Router)

### Client component
`components/FindShowtimes.tsx`
- State machine: `idle` → `requesting_location` | `manual_city` → `loading` → `results` | `error`
- Handles geolocation, city input, API calls, result rendering
- All results open in new tabs (`target="_blank"` + `rel="noreferrer noopener"`)

### Route handlers (server)
1. **`POST /api/geocode`**
   - Body: `{ city: string }`
   - Returns: `{ lat: number; lng: number; displayName: string }`
   - Caches 7 days

2. **`POST /api/cinemas/nearby`**
   - Body: `{ lat: number; lng: number; radiusKm: number }`
   - Returns:
     ```ts
     type NearbyCinema = {
       id: string;
       name: string;
       lat: number;
       lng: number;
       address?: string;
       distanceKm: number;
     };

     type NearbyCinemasResponse = {
       cinemas: NearbyCinema[];
       fetchedAt: string;
       source: "overpass";
     };
     ```
   - Caches 24 hours (rounded lat/lng + radius)
   - Sorts by distance

### Showtimes link builder (client)
```ts
const buildShowtimesUrl = (movie: { title: string }, cinema: { name: string }, city: string) => {
  const query = `${movie.title} showtimes ${cinema.name} ${city}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};
```

---

## 4) Caching & rate limiting

### Caching
- `geocode`: **7 days** (cities don't move)
- `nearby cinemas`: **24 hours** (lat/lng rounded to 2 decimals for key stability)

### Rate limiting
- Implement simple IP-based limiter in route handlers
- Protects OSM endpoints and app from abuse

---

## 5) Testing (TDD first)

### Route handler tests
- **`/api/geocode`**
  - ✓ returns 400 for empty/short city
  - ✓ returns { lat, lng, displayName } for valid city (mock Nominatim)
  - ✓ caches result

- **`/api/cinemas/nearby`**
  - ✓ returns 400 for invalid lat/lng/radius
  - ✓ normalizes Overpass response (mock fetch)
  - ✓ sorts by distance
  - ✓ returns empty array if no results
  - ✓ caches result

### Component tests
- ✓ If geolocation denied → city input shown
- ✓ City submit → geocode → cinemas → renders list
- ✓ Each cinema has "Showtimes" link with movie + cinema name
- ✓ "Showtimes" opens in new tab

### Integration test (optional, Phase 2)
- End-to-end: location permission → cinema list → click showtimes → new tab

---

## 6) Phase 2 (later)

When ready to add real showtimes:
- Integrate paid/free provider (e.g. Fandango, BFI Films, local APIs)
- Replace "Showtimes" Google search link with actual showtime list + booking URLs
- Tighten cache TTL to ~5–15 minutes

---

## Implementation To-Do List

### Setup & types
- [ ] Create `lib/types/cinemas.ts` with `NearbyCinema`, `NearbyCinemasResponse`, `GeocodeResponse` types
- [ ] Create `lib/osm.ts` with Nominatim + Overpass API helpers
- [ ] Create `lib/cache.ts` with generic cache utility for route handlers

### Route handlers & tests (TDD)
- [ ] Create `app/api/geocode/__tests__/route.test.ts` (failing tests for geocode API)
- [ ] Implement `app/api/geocode/route.ts` (POST handler, calls OSM Nominatim, caches 7 days)
- [ ] Create `app/api/cinemas/nearby/__tests__/route.test.ts` (failing tests for cinemas API)
- [ ] Implement `app/api/cinemas/nearby/route.ts` (POST handler, calls OSM Overpass, normalizes, caches 24h)
- [ ] Add rate limiting middleware (shared or per-route)

### Client component & tests
- [ ] Create `components/FindShowtimes/__tests__/FindShowtimes.test.tsx` (failing tests)
- [ ] Implement `components/FindShowtimes/FindShowtimes.tsx`:
  - State machine (idle → loading → results/error)
  - Geolocation permission + fallback to city input
  - City input (text, validation, submit)
  - Cinema list rendering
  - "Showtimes" + optional "Maps" buttons (new tab)
  - Loading skeleton
  - Error messaging
- [ ] Use existing MagicUI/shadcn components (dialog/drawer, buttons) if available; else use existing design patterns

### Integration
- [ ] Import `FindShowtimes` into `app/movie/[id]/page.tsx`
- [ ] Insert between Trailer and Cast sections
- [ ] Pass movie title as prop
- [ ] Test on mobile (iOS/Android) + desktop

### Final checks
- [ ] Verify no `any` types used
- [ ] Verify mobile-first UX (drawer/dialog, button sizing)
- [ ] Test all error paths (denied location, no results, network error)
- [ ] Test city fallback flow
- [ ] Lighthouse/performance check
- [ ] `yarn build` passes
- [ ] Commit with message: `feat: add find showtimes (phase 1)`

---

## Defaults (locked in)
- Default radius: **15km**
- Distance unit: **km** for UK/IE, **miles** for US (based on `navigator.language`)
- Sorting: **by distance ascending**
- New tab behavior: **all showtimes links + optional maps links**
