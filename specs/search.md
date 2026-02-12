# Search

## Problem

Neither app has search. If a user hears about a game or movie and wants to check its release date, they must scroll through upcoming/recent lists hoping to find it. This is the single biggest gap in the core experience — the site exists to answer "when can I...?" but provides no way to ask the question directly.

## Goals

- Let users find any game or movie by typing its name
- Surface results quickly with minimal friction (typeahead/autocomplete)
- Work well on mobile where the header is compact

## Design

### Header search bar

Add a search input to the shared `Header` component in [packages/ui/src/components/header.tsx](packages/ui/src/components/header.tsx).

**Desktop (sm+):** Visible text input between logo and watchlist button.

```
[Logo]  [🔍 Search games/movies...        ]  [⭐ Watchlist] [🌙]
```

**Mobile (<sm):** Search icon button that expands into a full-width overlay/modal with autofocus input. This avoids cramming a text field into the narrow mobile header.

### Search results

Results appear in a dropdown panel below the input (desktop) or in the overlay (mobile):

- Show up to 8 results
- Each result is a compact card: cover image thumbnail, title, release date, type badge (movie/game)
- Clicking a result navigates to the detail page (`/movie/{id}` or `/game/{id}`)
- "No results found" empty state
- Loading skeleton while fetching

### Recent searches

Store the last 5 search queries in `localStorage` under key `recentSearches`. Show them as suggestions when the input is focused but empty. Clear button to remove history.

## API changes

### WhenCanIWatchIt

Add `searchMovies` to [apps/whencaniwatchit/lib/tmdb.ts](apps/whencaniwatchit/lib/tmdb.ts):

```typescript
export const searchMovies = async (query: string, limit = 8) => {
  const data = await tmdbFetch<TMDBListResponse>('/search/movie', { query });
  return data.results.slice(0, limit);
};
```

TMDB's `/search/movie` endpoint accepts a `query` parameter and returns the standard `TMDBListResponse` shape — no new types needed.

Add a new API route at `app/api/search/route.ts`:

```
GET /api/search?q=batman
→ { results: TMDBMovie[] }
```

Use a short cache (60s revalidate) or `no-store` since search queries are user-specific.

### WhenCanIPlayIt

Expand the existing `searchGameByName` in [apps/whencaniplayit/lib/igdb.ts](apps/whencaniplayit/lib/igdb.ts). Currently it returns only 1 result with minimal fields (`name, cover.url`). Change it to:

```typescript
export async function searchGames(query: string, limit = 8): Promise<IGDBGame[]> {
  const body = `
    search "${query}";
    fields name, cover.url, first_release_date, platforms.name,
      release_dates.human, release_dates.date, release_dates.platform.name, genres.name;
    limit ${limit};
  `;
  return igdbRequest<IGDBGame[]>('games', body, { cache: 60 });
}
```

Keep the existing `searchGameByName` (used by OpenCritic enrichment) but add this new multi-result function alongside it.

Add a new API route at `app/api/search/route.ts`:

```
GET /api/search?q=zelda
→ { results: IGDBGame[] }
```

## Components

### New: `SearchBar` (shared, `@whencani/ui`)

Client component (`"use client"`). Props:

| Prop | Type | Description |
|------|------|-------------|
| `placeholder` | `string` | e.g. "Search movies..." or "Search games..." |
| `onSearch` | `(query: string) => Promise<SearchResult[]>` | Fetches results from the app's `/api/search` route |
| `resultHref` | `(result: SearchResult) => string` | Builds the detail page URL |

Internal state: `query`, `results`, `isOpen`, `isLoading`, `recentSearches`.

Debounce input by 300ms before calling `onSearch`. Use `useRef` for the debounce timer.

### New: `SearchResult` type (shared, `@whencani/ui`)

```typescript
interface SearchResult {
  id: number;
  title: string;
  imageUrl: string | null;
  releaseDate: string | null;
}
```

Each app maps its API response (TMDBMovie / IGDBGame) into this shape before passing to the shared component.

### Modified: `Header` (shared)

Add optional `searchSlot` prop of type `ReactNode`. Each app renders its configured `<SearchBar>` into this slot. This keeps the shared header generic.

## Keyboard shortcuts

- `/` focuses the search input (common convention)
- `Escape` closes the dropdown and blurs the input
- Arrow keys navigate results, `Enter` selects

## Mobile considerations

- The search overlay should be full-screen with a back/close button
- Input should autofocus with the virtual keyboard opening
- Results should be touch-friendly (minimum 44px tap targets)
- Closing the overlay returns focus to where the user was

## Verification

1. Type a query in the search bar on both apps — results should appear within ~500ms
2. Click a result — should navigate to the correct detail page
3. On mobile, tap the search icon — overlay should open with keyboard
4. Focus the empty search bar — recent searches should appear
5. Press `/` from anywhere on the page — search input should focus
