# Release Calendar

## Problem

The site's name is "When Can I..." but the only way to see release dates is a chronological list. A calendar view gives users an immediate visual answer: a month grid where they can see what's coming and when, spot busy weeks, and plan ahead.

## Goals

- Month-grid calendar showing upcoming releases (and optionally just watchlisted items)
- Filterable by genre/platform (reuse existing filters)
- Tap a date to see that day's releases
- Works well on mobile (compact day cells, sheet/modal for day detail)
- Shared component usable by both apps

## Design

### Route

New page at `/calendar` on both apps. Add a "Calendar" link to the header alongside the existing "Watchlist" link.

### Month grid

Standard calendar grid: 7 columns (Sun–Sat), 4–6 rows per month.

- **Day cells** show small dots or stacked mini-thumbnails (1–3 covers) for days with releases
- **Today** is highlighted with a ring/border
- **Days with watchlisted items** get a star indicator
- **Month navigation**: `< Previous` / `Next >` arrows, current month label
- **Default view**: Current month

### Day detail

Tapping a day opens a panel showing all releases for that date:

- **Desktop**: Side panel or inline expansion below the grid
- **Mobile**: Bottom sheet or full-screen modal
- Each item shows: cover thumbnail, title, platform/genre pills, watchlist toggle
- Tapping an item navigates to its detail page

### Filters

Reuse the existing filter components:

- **WhenCanIPlayIt**: Platform filter (PS/Xbox/Nintendo/PC/All), Genre dropdown
- **WhenCanIWatchIt**: Genre dropdown

Filters are applied as query params: `/calendar?platform=1&genre=12`

### "My releases" toggle

A toggle to show only watchlisted items on the calendar. Reads from the existing watchlist cookie.

## Data

### WhenCanIWatchIt

The existing `getUpcomingMovies` in [apps/whencaniwatchit/lib/tmdb.ts](apps/whencaniwatchit/lib/tmdb.ts) returns movies sorted by `release_date` (ISO string format `YYYY-MM-DD`). Fetch a larger set (e.g. limit 50) and group client-side by date.

For past months / "now playing", use `getNowPlayingRecent`.

Add a new function:

```typescript
export const getMoviesForMonth = async (year: number, month: number, genreId?: number) => {
  // Combine upcoming + now_playing, filter to the target month
};
```

Alternatively, use TMDB's `/discover/movie` with `primary_release_date.gte` and `primary_release_date.lte` params for precise date-range queries. This is more efficient than fetching all upcoming and filtering.

### WhenCanIPlayIt

The existing `getUpcomingPSGames` in [apps/whencaniplayit/lib/igdb.ts](apps/whencaniplayit/lib/igdb.ts) returns games with `release_dates[].date` (Unix timestamps). Group by date similarly.

Add a new function:

```typescript
export async function getGamesForMonth(
  year: number,
  month: number,
  platform?: IGDBPlatformFilter,
  genreId?: number,
): Promise<IGDBGame[]> {
  const startOfMonth = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(year, month, 0, 23, 59, 59).getTime() / 1000);
  // Query release_dates where date >= startOfMonth & date <= endOfMonth
}
```

### API routes

New route on each app:

```
GET /api/calendar?year=2026&month=2&platform=1&genre=12
→ { releases: Array<{ date: string; items: Array<{ id, title, imageUrl, ... }> }> }
```

Returns releases grouped by date string (`YYYY-MM-DD`) for easy calendar rendering.

## Components

### New: `CalendarGrid` (shared, `@whencani/ui`)

Client component. Props:

| Prop | Type | Description |
|------|------|-------------|
| `releases` | `Map<string, CalendarItem[]>` | Date string → items for that day |
| `watchlistIds` | `number[]` | IDs in the user's watchlist |
| `onDayClick` | `(date: string) => void` | Handler when a day is tapped |
| `month` | `number` | 1-12 |
| `year` | `number` | e.g. 2026 |

### New: `CalendarItem` type (shared)

```typescript
interface CalendarItem {
  id: number;
  title: string;
  imageUrl: string | null;
  href: string;
}
```

### New: `DayDetail` (shared, `@whencani/ui`)

Shows the list of releases for a selected day. Renders `MediaCard` (or a compact variant) for each item.

### Modified: `Header`

Add a calendar icon link (`CalendarDays` from lucide-react) next to the watchlist link. Same pill styling as the existing watchlist button.

## Mobile considerations

- Calendar cells are small on mobile — use coloured dots rather than thumbnails
- Day detail opens as a bottom sheet (not inline) to avoid layout shifts
- Swipe left/right to change months
- "My releases" toggle should be prominent and easy to reach

## Verification

1. Navigate to `/calendar` — should show current month with release dots
2. Tap a day with releases — detail panel shows the correct items
3. Apply platform/genre filter — calendar updates to show filtered releases only
4. Toggle "My releases" — only watchlisted items appear
5. Navigate to previous/next month — grid and data update correctly
6. On mobile, verify dots are visible and day detail opens as a sheet
