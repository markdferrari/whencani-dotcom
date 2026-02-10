# SEO Implementation Plan for WhenCanIWatchIt.com

**Status: Stage 3/4 Complete** ✅

**Implementation Progress:**
- ✅ Stage 1: Dynamic Metadata (generateMetadata on pages + canonical URLs) — Commit `ffb68ba`
- ✅ Stage 2: Structured Data (ItemList, Movie, BreadcrumbList JSON-LD) — Commit `911259c`
- ✅ Stage 3: Robots & Sitemap (dynamic generation with genre/movie routes) — Commit `8a9c954`
- 🟡 Stage 4: Validation (manual checks + monitoring setup)

This document is a **copy/adaptation** of the WhenCanIPlayIt SEO plan, updated for **movie releases + streaming availability**.

## 0) Goals (what “done” means)

- Home (`/`) and Movie detail (`/movie/[id]`) pages ship **high-quality, keyword-relevant metadata** (title/description/canonical/OG/Twitter).
- Pages include **structured data** (JSON-LD) appropriate for movies (Movie, ItemList, BreadcrumbList).
- **Robots + sitemap** are present and correct (Next.js App Router file conventions).
- Filter states (`view`, `genre`, `provider`) produce **stable canonical URLs**.
- Baseline validation: `yarn build` passes, Lighthouse SEO checks look sane, and Rich Results testing reports valid JSON-LD.

---

## 1) Audit current CX/metadata

### Inventory current surfaces

- Pages:
  - `/` (home; filterable via `?view=upcoming|recent`, `?genre=...`, `?provider=...`)
  - `/movie/[id]`
  - `/watchlist`
- UI components that heavily influence SEO:
  - Home hero copy + browse copy
  - Movie hero (title + tagline + synopsis)
  - Internal linking (Header, carousels)

### Capture the current metadata

- Read what is currently in:
  - `app/layout.tsx` → default `metadata`
  - `app/page.tsx` → currently no `generateMetadata`
  - `app/movie/[id]/page.tsx` → currently no `generateMetadata`

### Canonical URL surface area

- Define which filter states should be indexable:
  - `view=upcoming` (default) ✅
  - `view=recent` ✅
  - `genre=<id>` ✅ (only when genre is valid)
  - `provider=<id>` ✅ (if/when provider filter is enabled)
- Ensure we **avoid exploding** indexable combinations. Keep a conservative allowlist in the sitemap (see section 5).

---

## 2) Dynamic metadata generator

> Per Next.js docs: `generateMetadata()` is only supported in **Server Components** (pages/layouts).

### 2.1 Global defaults in `app/layout.tsx`

Implement strong defaults:

- `metadataBase: new URL('https://whencaniwatchit.com')`
- `title` with template:
  - default: `WhenCanIWatchIt`
  - template: `%s | WhenCanIWatchIt`
- Default `description` targeting intent:
  - “Track new and upcoming movie release dates and when films hit streaming platforms. Browse by genre, see what’s trending, and save favourites.”
- Default OG/Twitter:
  - `openGraph.siteName`, `openGraph.type = 'website'`
  - `twitter.card = 'summary_large_image'`

### 2.2 Home page: `app/page.tsx` → `generateMetadata()`

Use `searchParams` to customize:

- `title` examples:
  - Default: `Upcoming Movies & Streaming Release Dates`
  - `view=recent`: `Now Playing Movies & What’s In Theaters`
  - `genre=X`: `${GenreName} Movies Coming Soon`
  - `provider=X`: `Movies Coming Soon on ${ProviderName}`
  - Combination: `Upcoming ${GenreName} Movies on ${ProviderName}` (only if both are valid)

- `description` should reflect the current filter state and include the value names.

- `alternates.canonical`:
  - Must be a deterministic canonical URL (stable param order, omit defaults).

- `openGraph` / `twitter`:
  - Use a safe default image (site-level) if you have one.
  - Optionally pick the top movie poster/backdrop from the current result set, but only if it’s stable and fast.

Implementation note:
- Reuse existing TMDB helpers (genres list, provider list if available) to turn IDs into names.

### 2.3 Movie page: `app/movie/[id]/page.tsx` → `generateMetadata()`

Fetch the movie (TMDB) and set:

- `title`: `${movie.title} (${release_year}) — Release date & where to watch`
- `description`: short plot summary + release date + “where to watch” positioning.
- `alternates.canonical`: `https://whencaniwatchit.com/movie/${id}`
- `openGraph`:
  - `type: 'video.movie'`
  - `images`: prefer backdrop, fallback poster.
- `twitter`:
  - `card: 'summary_large_image'`

---

## 3) Structured data & semantic markup

### 3.1 Home page JSON-LD (`ItemList`)

Add a `<script type="application/ld+json">` containing:

- `@type: ItemList`
- `itemListElement`: map of visible movies to `Movie` items with:
  - `name`
  - `url`
  - `image` (poster/backdrop when present)
  - `datePublished` / `releasedEvent` (if you decide to include; keep minimal if data is uncertain)

Keep JSON-LD tightly scoped to what is visible in the UI (avoid claiming more than we show).

### 3.2 Movie page JSON-LD (`Movie` + `BreadcrumbList`)

Add JSON-LD to `/movie/[id]`:

- `Movie`:
  - `name` (title)
  - `description` (overview)
  - `image` (poster/backdrop)
  - `datePublished` (release date, if present)
  - `director` (if available)
  - `actor` (top cast list; keep it short)
  - `aggregateRating` from TMDB vote average/count (optional—only if you are comfortable mapping it; otherwise omit)
  - `trailer` (if trailer embed exists; optional)

- `BreadcrumbList`:
  - `Home` → `Movie Title`

### 3.3 Semantic and accessibility hygiene

- Ensure all posters/backdrops have descriptive `alt` text (already mostly in place).
- Ensure headings are hierarchical:
  - Home has exactly one `<h1>`.
  - Movie page has one `<h1>` (title) and uses `<h2>` for sections (Trailer, Showtimes, Cast).

---

## 4) Content hierarchy & copy refresh (keyword alignment)

### Home hero copy

Adjust copy to include terms people search for:

- “upcoming movies”, “release dates”, “streaming release”, “where to watch”, “in theaters”, “now playing”.
- Keep it natural; avoid keyword stuffing.

### Movie page hero

- Add a short line (if not already present) reinforcing intent:
  - “Release date, trailer, cast, and where to watch.”

Optional later:
- Add a tiny FAQ block (2–4 Q/A) targeting search intent (data sources, when streaming dates appear, etc.).

---

## 5) Technical SEO hygiene

### 5.1 Canonicals for filter pages

Implement a helper (server-side) to build canonical URLs:

- Stable parameter order: `view`, then `genre`, then `provider`.
- Omit default `view=upcoming` from canonical.
- Only include `genre`/`provider` when valid.

### 5.2 `robots` file (Next.js convention)

Add `app/robots.ts` returning `MetadataRoute.Robots`:

- Allow `/`
- Disallow `/api/` (optional, conservative)
- Point to sitemap:
  - `https://whencaniwatchit.com/sitemap.xml`

### 5.3 `sitemap` file (Next.js convention)

Add `app/sitemap.ts` returning `MetadataRoute.Sitemap`.

Keep it intentionally small:

- Static routes:
  - `/`
  - `/?view=recent`
  - `/watchlist` (optional; likely low SEO value, but harmless)

- Filter routes:
  - A small allowlist of genres (top ~10) once you define them.
  - Provider routes only if/when provider filter is enabled.

- Movie routes:
  - Include a limited set of movie IDs (e.g., trending + now playing + upcoming top N) via TMDB fetch.
  - Do **not** attempt “all movies”.

### 5.4 Images + performance notes

- OG images: prefer backdrop (`w1280`) but ensure it’s not too large.
- Avoid adding metadata logic that significantly increases server response time.

---

## 6) Measurement & rollout

### Validation checklist

- Lighthouse SEO on:
  - `/`
  - `/?view=recent`
  - `/movie/<id>`
- Rich Results / schema validation:
  - Confirm JSON-LD parses.
- Verify canonical URLs are correct and stable.
- Confirm `robots.txt` and `sitemap.xml` are accessible.

### Rollout

- Ship metadata first (low risk).
- Then add sitemap/robots.
- Then add JSON-LD.
- Iterate copy once Search Console query data exists.

---

## Implementation To-Do List (ready to execute)

### Metadata
- [ ] Update `app/layout.tsx` with `metadataBase`, title template, default OG/Twitter
- [ ] Add `generateMetadata()` to `app/page.tsx` using `searchParams`
- [ ] Add `generateMetadata()` to `app/movie/[id]/page.tsx` using TMDB details
- [ ] Add a canonical URL helper used by home metadata

### Structured data
- [ ] Add ItemList JSON-LD to `app/page.tsx` (top visible movies)
- [ ] Add Movie + BreadcrumbList JSON-LD to `app/movie/[id]/page.tsx`

### Robots + sitemap
- [ ] Add `app/robots.ts`
- [ ] Add `app/sitemap.ts` (static routes + conservative filter allowlist + limited movie IDs)

### Final checks
- [ ] Confirm noindex rules are not accidentally applied
- [ ] Verify metadata renders server-side (view source)
- [ ] `yarn build` passes

---

## 4) Stage 4: Validation & Monitoring

### Automated checks
- [x] `yarn build` passes (all routes compiled, TypeScript clean)
- [x] Robots.txt present (`/robots.txt` visible in route output)
- [x] Sitemap present (`/sitemap.xml` visible in route output with ~60+ entries)
- [x] No TypeScript errors in schema/SEO code

### Manual validation (post-deployment)

1. **Metadata rendering:**
   - Visit `https://whencaniwatchit.com` and check page source for:
     - `<title>` tag with dynamic title
     - `<meta name="description">`
     - `<link rel="canonical">`
     - OG tags: `og:title`, `og:description`, `og:url`, `og:image`
   - Repeat for `/?view=recent`, `/?genre=16` (Animation), and `/movie/12345` (sample movie)

2. **Structured data validation:**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results) on:
     - `https://whencaniwatchit.com` (check for ItemList + Movie schema)
     - `https://whencaniwatchit.com/movie/12345` (check for Movie + BreadcrumbList)
   - Verify no errors or warnings in JSON-LD schema

3. **Robots + Sitemap:**
   - Verify `/robots.txt` is accessible and contains correct allow/disallow rules
   - Verify `/sitemap.xml` is accessible and contains:
     - Static routes: `/`, `/?view=recent`, `/watchlist`
     - Genre routes: `/?view=upcoming&genre=<id>` (top 12)
     - Movie routes: `/movie/<id>` (trending + now-playing + upcoming, deduplicated)
   - Verify `sitemap.xml` is referenced in `robots.txt`

4. **Canonical URLs:**
   - Verify home page canonical is `https://whencaniwatchit.com/` (stable regardless of query order)
   - Verify filtered pages produce stable canonicals: `/` + ordered params
   - Verify movie pages produce correct canonicals: `/movie/<id>`

5. **Lighthouse SEO checks (local or deployed):**
   - Run Lighthouse on `/`, `/?view=recent`, `/movie/<sample-id>`
   - Verify SEO score (goal: 90+)
   - Check for missing/duplicate metadata warnings
   - Confirm no noindex warnings

### Ongoing monitoring

- **Google Search Console:**
  - Submit sitemap: `https://whencaniwatchit.com/sitemap.xml`
  - Monitor index coverage (look for errors/warnings)
  - Review Core Web Vitals and SEO reports monthly

- **Analytics:**
  - Track organic search traffic trends (Goal: +10–20% month-over-month)
  - Monitor click-through rate (CTR) from search results
  - Identify top-performing genres/filter combinations

- **Testing:**
  - Periodically re-validate Rich Results on sample movie pages
  - Test mobile rendering (mobile-first indexing)
  - Verify pagination / filter navigation doesn't create redirect chains

---

## Notes / open decisions

- Provider filter is currently optional/commented in UI; decide whether to include provider URLs in sitemap only after the filter is live.
- Decide whether `/watchlist` should be `index` or `noindex` (it’s user-specific-ish but currently cookie-based; simplest is to allow indexing or add `noindex` via metadata if you prefer).
