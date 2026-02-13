# WhenCanIReadIt — Implementation Spec

## Context

The whencani-dotcom monorepo has two apps (movies at whencaniwatchit.com, games at whencaniplayit.com) that share a UI package and follow identical architectural patterns. This spec adds a third app for **book releases** at `whencanireadit.com`, following the same structure and reusing shared components.

---

## Data Sources

### Primary: Google Books API v1
- **Base URL**: `https://www.googleapis.com/books/v1`
- **Env var**: `GOOGLE_BOOKS_API_KEY`
- **Endpoints**: `GET /volumes?q=`, `GET /volumes/{id}`, `GET /volumes?q=isbn:{isbn}`
- **Note**: Volume IDs are strings (e.g. `"dKlJzgEACAAJ"`), not numbers — this affects shared types

### Fallback: Open Library
- **Cover images**: `https://covers.openlibrary.org/b/isbn/{isbn}-{size}.jpg` (no key required)
- **Book data**: `https://openlibrary.org/isbn/{isbn}.json`
- **Strategy**: If Google Books returns no cover and ISBN exists, try Open Library

### Homepage: NYT Books API
- **Base URL**: `https://api.nytimes.com/svc/books/v3`
- **Env var**: `NYT_BOOKS_API_KEY`
- **Endpoints**: `GET /lists/current/{list-name}.json`
- **Lists**: `combined-print-and-e-book-fiction`, `combined-print-and-e-book-nonfiction`
- **Rate limit**: 500 req/day free tier — CloudFront caching with 24h TTL keeps this safe

---

## Routes

| Route | Description |
|---|---|
| `/` | Home — hero + carousel sections |
| `/book/[id]` | Book detail (Google Books volume ID) |
| `/calendar` | Weekly release calendar |
| `/bookshelf` | Saved books (sort/filter/export) |
| `/api/search` | Search proxy → Google Books |
| `/api/books` | Book detail proxy (by ID) |
| `/api/books/bestsellers` | NYT Bestsellers proxy |
| `/api/calendar` | Calendar date-range query |
| `/api/bookshelf` | Bookshelf CRUD (cookie-based) |

---

## Pages

### Home (`/`)
Server component. Hero section + 4 carousel sections using `MediaCarousel`:

1. **NYT Fiction Bestsellers** — from NYT API, cross-referenced to Google Books via ISBN for `/book/{id}` links
2. **NYT Non-Fiction Bestsellers** — same approach
3. **New This Week** — Google Books `orderBy=newest`, filtered to last 7 days
4. **Upcoming Releases** — Google Books with future publication dates

Simpler layout than movies/games — no sidebar filters, just stacked carousels.

### Book Detail (`/book/[id]`)
Server component. Reuses `DetailHeroCard` from shared UI.

**Layout:**
- `DetailBackLink` → back to home
- `DetailHeroCard` with:
  - **Backdrop**: blurred/enlarged cover image (CSS blur on same URL)
  - **Poster**: book cover at 2/3 aspect ratio (same as movies)
  - Title + `BookshelfToggle` + `ShareButton`
  - Author(s) line
  - Publication date badge
  - Genre/category pills
  - Collapsible description
  - Info cards: Publisher, Page Count, ISBN, Language
  - **Buy/Pre-order Links** (`BuyLinks` component)
- Similar books carousel via `MediaCarousel`

### Calendar (`/calendar`)
Same pattern as existing apps. Weekly view with prev/next navigation.
- Genre filter dropdown (book categories)
- "My Bookshelf" toggle
- No platform filter (books don't have platforms)

### Bookshelf (`/bookshelf`)
Mirrors `/watchlist` from existing apps.
- `WatchlistToolbar` for sort/filter/export
- Sort: Date Added, Release Soonest, Release Latest, Alphabetical
- Genre filter from book categories
- Grouped by release status: Coming Soon, This Month, Later, TBA, Released
- Cookie-based storage (JSON array of string volume IDs)

---

## Buy Links

Generated from ISBN in `lib/buy-links.ts`:

| Retailer | URL Pattern |
|---|---|
| Amazon | `https://www.amazon.com/dp/{isbn}` |
| Bookshop.org | `https://bookshop.org/p/books/{isbn}` |
| Barnes & Noble | `https://www.barnesandnoble.com/w/?ean={isbn}` |
| Google Books | `book.previewLink` (from API response) |
| Google Play | `book.saleInfo.buyLink` (if available) |

Rendered as a horizontal row of pill buttons. Pre-order state highlighted when `saleInfo.saleability === 'FOR_PREORDER'`. Gracefully handles missing ISBN (hide retailer links, show only Google links).

---

## Shared Package Changes

### 1. Header — configurable saved-items link
**File**: `packages/ui/src/components/header.tsx`

Add optional props (backward-compatible defaults):
```
savedItemsLabel?: string    // default: "Watchlist"
savedItemsHref?: string     // default: "/watchlist"
```
Books app passes `savedItemsLabel="Bookshelf"` and `savedItemsHref="/bookshelf"`.

### 2. CalendarItem — widen ID type
**File**: `packages/ui/src/types/calendar.ts`

Change `id: number` → `id: number | string`

### 3. SearchResult — widen ID type
**File**: `packages/ui/src/types/search.ts`

Change `id: number` → `id: number | string`

All three changes are backward-compatible — existing apps continue to pass numbers.

---

## New App-Specific Components

| Component | Purpose |
|---|---|
| `BookCard.tsx` | Wraps shared `MediaCard` — maps `Book` fields, shows authors, links to `/book/{id}` |
| `BookshelfToggle.tsx` | Star toggle for bookshelf — uses string IDs, calls `/api/bookshelf` |
| `BookshelfSection.tsx` | Bookshelf page content — mirrors `WatchlistSection` pattern |
| `BuyLinks.tsx` | Row of purchase link buttons generated from ISBN |
| `HomepageCarousels.tsx` | Orchestrates all homepage carousel data fetching/rendering |

---

## Feature Flags

In `lib/config.ts`, following the `NEXT_PUBLIC_FEATURE_*` pattern:

| Flag | Purpose |
|---|---|
| `NEXT_PUBLIC_FEATURE_SEARCH` | Enables search bar in header |
| `NEXT_PUBLIC_FEATURE_BOOKSHELF_IMPROVEMENTS` | Sort/filter/export on bookshelf |
| `NEXT_PUBLIC_FEATURE_NYT_BESTSELLERS` | Gates NYT API integration |
| `NEXT_PUBLIC_FEATURE_BUY_LINKS` | Gates purchase links on detail page |
| `NEXT_PUBLIC_FEATURE_CALENDAR` | Gates calendar page and header link |

---

## Deployment

### SST Config
Follows exact pattern from `apps/whencaniplayit/sst.config.ts`:
- **Name**: `whencanireadit`
- **Domain**: `www.whencanireadit.com` + alias `whencanireadit.com`
- **Runtime**: `nodejs22.x`, `arm64`, `us-east-1`, `sst-production` profile
- **Env vars**: `GOOGLE_BOOKS_API_KEY`, `NYT_BOOKS_API_KEY`
- **CloudFront caching**:
  - `/api/books/bestsellers*` — 24h default (weekly updates)
  - `/api/books` — 12h default
  - `/api/search` — 1h default

### Root `package.json` additions
```
"dev:read": "yarn workspace whencanireadit dev"
"build:read": "yarn workspace whencanireadit build"
"deploy:read": "yarn workspace whencanireadit sst:deploy"
"sst:dev:read": "yarn workspace whencanireadit sst:dev"
```
Update `deploy:all` to include `yarn deploy:read`.

### Dev port: `3002` (watch=3000, play=3001)

### Cross-links
Update footers of existing apps to link to whencanireadit.com, and new app footer links back to both.

---

## Directory Structure

```
apps/whencanireadit/
  app/
    layout.tsx
    page.tsx
    globals.css
    book/[id]/
      page.tsx, loading.tsx, error.tsx
    calendar/page.tsx
    bookshelf/page.tsx
    api/
      search/route.ts
      books/route.ts
      books/bestsellers/route.ts
      calendar/route.ts
      bookshelf/route.ts
  components/
    Header.tsx, BookCard.tsx, BookshelfToggle.tsx,
    BookshelfSection.tsx, BuyLinks.tsx, HomepageCarousels.tsx
  hooks/
    use-bookshelf.ts
  lib/
    config.ts, types.ts, google-books.ts, open-library.ts,
    nyt-books.ts, buy-links.ts, bookshelf.ts, schema.ts, seo.ts
  public/
    logo.png, book-placeholder.svg
  next.config.ts, package.json, sst.config.ts,
  tsconfig.json, eslint.config.mjs, postcss.config.mjs
```

---

## Implementation Phases

### Phase 1: Foundation
- Create `apps/whencanireadit/` scaffold (package.json, configs, layout, globals.css)
- Update shared Header with `savedItemsLabel`/`savedItemsHref` props
- Widen `CalendarItem.id` and `SearchResult.id` to `number | string`
- Verify `yarn dev:read` starts

### Phase 2: Data Layer
- `lib/types.ts` — Book, NYTBook, BookshelfItem, BuyLink interfaces
- `lib/google-books.ts` — search, getById, getByISBN, normalizer
- `lib/open-library.ts` — cover URL fallback
- `lib/nyt-books.ts` — bestseller lists
- `lib/buy-links.ts` — URL generators
- API routes: `/api/search`, `/api/books`, `/api/books/bestsellers`, `/api/bookshelf`

### Phase 3: Core Pages
- Home page with hero + `HomepageCarousels`
- Book detail page with `DetailHeroCard`, `BuyLinks`, similar books
- `BookCard`, `BookshelfToggle`, `use-bookshelf` hook

### Phase 4: Bookshelf + Calendar
- `BookshelfSection` + bookshelf page
- Calendar API route + calendar page

### Phase 5: SEO + Deployment
- Schema.org structured data, sitemap, robots
- Loading/error states
- SST config, root package.json scripts, footer cross-links
- Favicon and logo assets

---

## Verification

1. `yarn dev:read` — app starts on port 3002
2. Home page loads with NYT bestseller carousels (requires API keys in `.env.local`)
3. Search returns results from Google Books
4. `/book/{id}` shows detail page with cover, metadata, buy links
5. Bookshelf toggle adds/removes books, persists across page reloads (cookie)
6. `/bookshelf` displays saved books with sort/filter
7. `/calendar` shows weekly book releases
8. `yarn build:read` succeeds with no type errors
9. `yarn lint` passes
10. Existing apps (`yarn dev:watch`, `yarn dev:play`) unaffected by shared package changes
