# Include Board Games

I want to include board games on the games app

Data source should be the BoardGameGeek API

Board Games should be added as a filter to the games homepage, and a new lib/bgg.ts added to handle all logic.

Game detail pages should be the same as existing, with amazon links as per existing.

We should have a Trending Board Games carousel on the homepage, pulling the top 10-20 'hot'games from BGG

---

## Implementation Plan

### Context

The games app (`whencaniplayit`) currently only tracks video games via IGDB. The goal is to add board games as a first-class content type alongside video games, using BoardGameGeek (BGG) as the data source. This expands the app's value proposition to tabletop gamers while reusing existing UI patterns.

---

### 1. Feature Flag

**File:** `apps/whencaniplayit/lib/config.ts`

Add `boardGames` feature flag:
```ts
get boardGames(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_BOARD_GAMES === 'true';
}
```

Add to `.env.local`: `NEXT_PUBLIC_FEATURE_BOARD_GAMES=true`

---

### 2. BGG API Client

**New file:** `apps/whencaniplayit/lib/bgg.ts`

BGG uses XML API2 (no auth required). Need to add `fast-xml-parser` dependency for XML parsing.

#### Types
```ts
interface BGGBoardGame {
  id: number;
  name: string;
  yearPublished?: number;
  description?: string;
  thumbnail?: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlayTime?: number;
  maxPlayTime?: number;
  minAge?: number;
  rating?: number;
  numRatings?: number;
  rank?: number;
  categories?: string[];
  mechanics?: string[];
  designers?: string[];
  publishers?: string[];
}

interface BGGHotGame {
  id: number;
  rank: number;
  name: string;
  thumbnail?: string;
  yearPublished?: number;
}
```

#### Functions
| Function | Endpoint | Cache | Returns |
|---|---|---|---|
| `getHotBoardGames()` | `/xmlapi2/hot?type=boardgame` | 6 hours | `BGGHotGame[]` (top 20) |
| `getBoardGameById(id)` | `/xmlapi2/thing?id={id}&stats=1` | 24 hours | `BGGBoardGame \| null` |
| `getBoardGamesByIds(ids)` | `/xmlapi2/thing?id={ids}&stats=1` | 24 hours | `BGGBoardGame[]` |
| `searchBoardGames(query)` | `/xmlapi2/search?query={q}&type=boardgame` | 5 min | `BGGSearchResult[]` |

All functions: 10s timeout via `AbortSignal.timeout()`, return null/empty on failure, log errors.

---

### 3. Homepage Filter ("Game Type" dropdown)

**File:** `apps/whencaniplayit/components/PlatformFilter.tsx`

- Add a "Game Type" dropdown above the existing Platform dropdown with options: "Video Games" (default), "Board Games"
- URL param: `?type=board` (absent = video games, the default)
- When `type=board`: hide Platform and Studio dropdowns (not applicable), keep Genre dropdown but populate with BGG categories from an API route
- Gate the entire Game Type dropdown behind `config.features.boardGames`

**File:** `apps/whencaniplayit/app/page.tsx`

- Read `type` search param
- Pass it through to `GamesSection` and `PlatformFilter`
- Update metadata generation to handle board games context

---

### 4. Games Section Updates

**File:** `apps/whencaniplayit/components/GamesSection.tsx`

- Read `type` param from URL search params
- When `type=board`: fetch from `/api/board-games` instead of `/api/games`
- Render `BoardGameCard` instead of `GameCard` for board games
- Update empty state message for board games context

**File:** `apps/whencaniplayit/components/ViewToggle.tsx`

- When `type=board`: show "Popular" / "New Releases" instead of "Coming Soon" / "Recently Released" (BGG doesn't have upcoming/release date tracking the same way)

---

### 5. New API Routes

#### `/api/board-games/route.ts`
- Calls `getHotBoardGames()` or a ranked list from BGG
- Returns normalised response: `{ games: BGGBoardGame[], categories: string[] }`
- Supports `view` param for different board game lists

#### `/api/bgg/hot/route.ts`
- Calls `getHotBoardGames()` from `lib/bgg.ts`
- Returns `{ games: BGGHotGame[] }`
- Used by the trending carousel

#### `/api/board-games/[id]/route.ts`
- Calls `getBoardGameById(id)`
- Returns full game details as JSON

---

### 6. Board Game Card

**New file:** `apps/whencaniplayit/components/BoardGameCard.tsx`

Wraps `MediaCard` from `@whencani/ui` (same pattern as `GameCard.tsx`):
- Image: BGG box art (direct URL, no `/api/image` proxy needed)
- Title, year published
- Summary: truncated description
- Genres: BGG categories
- Extra info: player count (e.g., "2-4 players"), play time
- Watchlist toggle (using board game watchlist)
- Amazon buy button (search-based URL)
- Links to `/board-game/{id}`

---

### 7. Trending Board Games Carousel

**New file:** `apps/whencaniplayit/components/TrendingBoardGamesSection.tsx`

Follow the pattern of `TrendingSection.tsx`:
- Client component, fetches from `/api/bgg/hot` on mount
- Uses `MediaCarousel` from `@whencani/ui` (same as `TrendingSectionStandard`)
- Shows loading/empty states matching existing style
- Purple/green accent instead of orange to visually differentiate
- Gate behind `config.features.boardGames`

**File:** `apps/whencaniplayit/app/page.tsx`
- Add `<TrendingBoardGamesSection />` to the left sidebar, below the existing `<TrendingSection />`

---

### 8. Board Game Detail Page

**New file:** `apps/whencaniplayit/app/board-game/[id]/page.tsx`

Separate route from video games to avoid ID collisions. Follow the pattern of `app/game/[id]/page.tsx`:

- **Metadata**: Title, description, OG tags from BGG data
- **DetailHeroCard** (reuse from `@whencani/ui`):
  - Box art as poster (aspect 1/1 or 3/4)
  - Title, year published
  - Player count + play time pills (instead of platform pills)
  - Category tags (instead of genre tags)
  - Collapsible description
  - Designer / Publisher info cards (instead of Developer / Publisher)
  - Watchlist toggle + Share button
  - Amazon link in posterFooter
- **No** MediaCarouselCombined (board games don't have trailers/screenshots)
- **No** ReviewSection (no OpenCritic equivalent)
- **No** GameLinks/notes sections
- **RecordView**: record for recently viewed, linking to `/board-game/{id}`
- **Schema.org**: Use `Product` or `Game` type

---

### 9. Watchlist Integration

The current watchlist stores `number[]` in a cookie. BGG IDs can overlap with IGDB IDs.

**Solution:** Use a separate cookie for board game watchlist.

**File:** `apps/whencaniplayit/lib/watchlist.ts`
- Add `BOARD_GAME_WATCHLIST_COOKIE_NAME = 'watchlist_bg'`
- Reuse existing `parseWatchlistCookie`, `serializeWatchlist`, `addToWatchlist`, `removeFromWatchlist` functions (they're generic)

**New file:** `apps/whencaniplayit/hooks/use-board-game-watchlist.ts`
- Clone the pattern from `hooks/use-watchlist.ts`
- Use `watchlist_bg` cookie and `watchlist_bg:update` event
- `useBoardGameWatchlistIds()`, `useBoardGameWatchlistActions()`, `useBoardGameWatchlistGames()`

**New file:** `apps/whencaniplayit/components/BoardGameWatchlistToggle.tsx`
- Same UI as `WatchlistToggle.tsx`, uses board game watchlist hooks

**File:** `apps/whencaniplayit/app/api/watchlist/route.ts`
- Add board game support: check a `type` param in POST body
- When `type=board`: use `BOARD_GAME_WATCHLIST_COOKIE_NAME`, fetch from `getBoardGamesByIds()`

**File:** `apps/whencaniplayit/components/WatchlistSection.tsx`
- When board games feature is enabled, show both video game and board game watchlist items
- Or add a type toggle within the watchlist page

---

### 10. Search Integration

**File:** `apps/whencaniplayit/app/api/search/route.ts`

- When `config.features.boardGames` is enabled, search both IGDB and BGG in parallel
- Add a `type` field to each search result (`"video"` or `"board"`)
- Board game results link to `/board-game/{id}`
- Return combined results, interleaved or grouped

---

### 11. Amazon Affiliate Links

**File:** `apps/whencaniplayit/lib/amazon.ts`

Add a new function for board games (BGG has no ASINs):
```ts
export function getAmazonBoardGameUrl(gameName: string): string {
  const { domain, tag } = config.amazon;
  const query = `${gameName} board game`;
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&tag=${tag}&linkCode=ll2&ref_=as_li_ss_tl`;
}
```

---

### Files Summary

| Action | File |
|---|---|
| Modify | `apps/whencaniplayit/lib/config.ts` |
| Create | `apps/whencaniplayit/lib/bgg.ts` |
| Modify | `apps/whencaniplayit/lib/amazon.ts` |
| Modify | `apps/whencaniplayit/lib/watchlist.ts` |
| Modify | `apps/whencaniplayit/components/PlatformFilter.tsx` |
| Modify | `apps/whencaniplayit/components/GamesSection.tsx` |
| Modify | `apps/whencaniplayit/components/ViewToggle.tsx` |
| Create | `apps/whencaniplayit/components/BoardGameCard.tsx` |
| Create | `apps/whencaniplayit/components/TrendingBoardGamesSection.tsx` |
| Create | `apps/whencaniplayit/components/BoardGameWatchlistToggle.tsx` |
| Create | `apps/whencaniplayit/hooks/use-board-game-watchlist.ts` |
| Modify | `apps/whencaniplayit/app/page.tsx` |
| Create | `apps/whencaniplayit/app/board-game/[id]/page.tsx` |
| Create | `apps/whencaniplayit/app/api/board-games/route.ts` |
| Create | `apps/whencaniplayit/app/api/bgg/hot/route.ts` |
| Create | `apps/whencaniplayit/app/api/board-games/[id]/route.ts` |
| Modify | `apps/whencaniplayit/app/api/search/route.ts` |
| Modify | `apps/whencaniplayit/app/api/watchlist/route.ts` |
| Modify | `apps/whencaniplayit/components/WatchlistSection.tsx` |

**New dependency:** `fast-xml-parser` (for BGG XML response parsing)

---

### Verification

1. `yarn install` succeeds
2. `yarn dev` in the play app - homepage loads without errors
3. Toggle "Game Type" to "Board Games" - main list shows BGG games
4. Trending Board Games carousel appears in left sidebar with hot games
5. Click a board game card - detail page at `/board-game/{id}` renders correctly
6. Watchlist toggle works on board game cards and detail page
7. Search returns both video game and board game results
8. Amazon "Buy now" links open correct search queries
9. Feature flag off (`NEXT_PUBLIC_FEATURE_BOARD_GAMES=false`) hides all board game UI
10. `yarn build` succeeds with no type errors
