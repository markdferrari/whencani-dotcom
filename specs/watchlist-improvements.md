# Watchlist Improvements

## Problem

The watchlist is cookie-based with a 20-item hard cap, stores only IDs (requiring an API call to display anything), and shows items in a flat unsorted list. For a site built around tracking releases, the watchlist experience should be much richer.

## Current implementation

Key files:
- [apps/whencaniwatchit/lib/watchlist.ts](apps/whencaniwatchit/lib/watchlist.ts) — `WATCHLIST_MAX_ITEMS = 20`, cookie parse/serialize, add/remove helpers
- [apps/whencaniplayit/lib/watchlist.ts](apps/whencaniplayit/lib/watchlist.ts) — identical implementation
- `apps/*/hooks/use-watchlist.ts` — client hooks (`useWatchlistIds`, `useWatchlistActions`, `useWatchlistMovies`/`useWatchlistGames`)
- `apps/*/app/api/watchlist/route.ts` — GET (fetch full data for IDs) and POST (add/remove)
- `apps/*/components/WatchlistSection.tsx` — renders the watchlist page
- `apps/*/app/watchlist/page.tsx` — `/watchlist` route

Storage details:
- Cookie name: `watchlist`
- Value: JSON array of numeric IDs, e.g. `[123, 456, 789]`
- Max age: 365 days
- When exceeding 20 items, oldest are silently dropped

## Changes

### 1. Raise the item cap

Change `WATCHLIST_MAX_ITEMS` from 20 to 100 in both apps. A JSON array of 100 numbers is ~600 bytes — well within the 4KB cookie limit.

If we want to go higher than ~100, migrate storage to `localStorage` (no size concern) with the cookie as a fallback for SSR. For now, 100 is a pragmatic step.

**Files to change:**
- [apps/whencaniwatchit/lib/watchlist.ts](apps/whencaniwatchit/lib/watchlist.ts) — change `WATCHLIST_MAX_ITEMS`
- [apps/whencaniplayit/lib/watchlist.ts](apps/whencaniplayit/lib/watchlist.ts) — change `WATCHLIST_MAX_ITEMS`

### 2. Sort and filter controls on the watchlist page

Add a toolbar above the watchlist grid/list with:

- **Sort by**: Release date (soonest first), Release date (latest first), Date added (default), Alphabetical
- **Filter**: Genre dropdown (populated from the items in the list), Platform dropdown (games only)

"Date added" order is the natural order in the cookie array (newest at end), so reverse it for display.

"Release date" sort requires the full item data, which is already fetched by `useWatchlistMovies` / `useWatchlistGames`.

**Files to change:**
- `apps/*/components/WatchlistSection.tsx` — add sort/filter state and UI
- Consider extracting a new `WatchlistToolbar` component

### 3. Release-date grouping

Group watchlist items into sections:

| Group | Condition |
|-------|-----------|
| **Released** | Release date is in the past |
| **Coming soon** | Release date is within the next 7 days |
| **This month** | Release date is within the current calendar month (but not this week) |
| **Later** | Release date is beyond this month |
| **TBA** | No release date set |

Each group gets a heading. Groups with zero items are hidden. The "Released" group is collapsed by default with a count badge, so it doesn't dominate the list.

This grouping applies to the default "Release date (soonest first)" sort. When the user picks a different sort, show a flat list instead.

**Files to change:**
- `apps/*/components/WatchlistSection.tsx`
- Add a shared `groupByReleaseDate` utility to `packages/ui` or each app's `lib/`

### 4. "Released!" badge

On both the watchlist page and in `MediaCard` / browse lists, show a small badge when a watchlisted item's release date has passed:

- Badge text: "Out now" (green pill)
- Only shown for items in the user's watchlist
- On the browse page cards, this helps the user spot items they were tracking that have now launched

**Files to change:**
- [packages/ui/src/cards/MediaCard.tsx](packages/ui/src/cards/MediaCard.tsx) — add optional `releasedBadge` prop or compute from `releaseDate`
- `apps/*/components/WatchlistSection.tsx` — show badge in grouped view

### 5. Export / share watchlist

Add an "Export" button to the watchlist page with two options:

- **Copy link**: Encode watchlist IDs into a URL query param (e.g. `/watchlist?ids=123,456,789`). When the page loads with `?ids=`, show those items (read-only, no cookie modification). This lets users share their list.
- **Copy as text**: Generate a plain-text list of titles + release dates and copy to clipboard.

**Files to change:**
- `apps/*/app/watchlist/page.tsx` — read `?ids=` query param, pass to `WatchlistSection`
- `apps/*/components/WatchlistSection.tsx` — add export buttons
- `apps/*/app/api/watchlist/route.ts` — support fetching by explicit ID list (already works via `getMoviesByIds` / `getGamesByIds`)

## Components

### New: `WatchlistToolbar`

Client component with sort dropdown and filter controls. Emits `onSortChange` and `onFilterChange` callbacks.

### Modified: `WatchlistSection`

Accept sort/filter/grouping state. Render grouped sections with headings when in date-grouped mode. Add export/share actions.

### Modified: `MediaCard`

Add optional `badge` prop (`ReactNode`) rendered as an overlay on the card. Used for "Out now" badge.

## Mobile considerations

- Sort/filter toolbar should be horizontally scrollable on narrow screens
- Group headings should be sticky so users know which section they're in while scrolling
- Export actions in a dropdown menu to save space

## Verification

1. Add 25+ items to the watchlist — all should persist (no silent drops)
2. On the watchlist page, change sort to "Release date" — items reorder correctly
3. Items should appear in groups: Released, This week, This month, Later, TBA
4. A game/movie that released yesterday shows "Out now" badge
5. Click "Copy link" — paste in a new tab — shared watchlist loads correctly
6. Click "Copy as text" — paste in a text editor — shows formatted list
