# SEO Implementation Plan for WhenCanIPlayIt.com

1. **Audit current CX/metadata**
   - Extract current page titles, descriptions, keywords, OG/Twitter tags, and structured data from the existing `layout.tsx` and `page.tsx`.
   - Map the filter-driven states (`view`, `platform`, `genre`, `studio`) to canonical URLs so we understand the surface area we are optimizing.

2. **Dynamic metadata generator**
   - Move away from static metadata in `layout.tsx`; add `metadataBase` and keyword-rich defaults (site summary, focus keywords).
   - Implement `generateMetadata()` on `app/page.tsx` (server component) that: builds descriptive titles/descriptions per filter state, injects canonical URLs, adds Open Graph/Twitter metadata, and exposes keywords covering the filter choices (e.g., "PlayStation release window", "recent Xbox launch tracker").
   - Ensure metadata generation calls existing IGDB helpers to describe the current result set (e.g., upcoming vs recent, selected genre or studio).

3. **Structured data & semantic markup**
   - Add `application/ld+json` describing the top games as `ItemList`/`VideoGame` entities with release dates, platforms, and URLs.
   - Make sure `GameCard` includes alt text and accessible content that mentions the game name + release context.
   - Consider adding `aria-label`s or descriptive copy around filter controls to reinforce keywords.

4. **Content hierarchy & copy refresh**
   - Update the hero copy to mention strategic keywords (video game releases, release windows, review momentum, console names).
   - Add a short stats/benefits snippet (three cards) to highlight focus areas (verified releases, review momentum, launch confidence) using games terminology.
   - Possibly add a secondary copy block or FAQ-style section targeting search intent ("How do we source release dates?").

5. **Technical SEO hygiene**
   - Add `metadata` defaults for robots (index/follow) and `alternates.canonical` in `layout.tsx`.
   - Ensure platform/view filters map to unique canonical URLs (via `buildCanonicalPath`).
   - Add `sitemap.xml` (e.g., Next.js route or script) covering filter combinations, and `robots.txt` pointing to it.
   - Ensure images (covers, icons) have descriptive alt text and consider preloading hero assets.

6. **Measurement & rollout**
   - Add Lighthouse/URL testing instructions to README (core web vitals + SEO check).
   - Run Rich Results test on hero pages, verify structured data is valid.
   - Monitor Search Console for impressions on keyword sets, iterate copy/metadata as new query data arrives.

Next step: confirm data needs (e.g., limited genres/studios) and pick the first metadata properties to implement, then update `page.tsx`/`layout.tsx` accordingly.
