# Recently Viewed

## Problem

Users browse multiple games or movies, then want to go back to one they saw earlier. Currently they have to use browser history or remember the title and scroll through lists. A "Recently viewed" section gives quick access to pages they've visited.

## Goals

- Track the last 12 items a user has viewed (detail pages only)
- Show a "Recently viewed" section on the homepage
- Persist across sessions using localStorage
- Zero API calls — store enough data to render cards without fetching

## Design

### Storage

Store in `localStorage` under key `recentlyViewed`. Value is a JSON array of view records:

```typescript
interface RecentlyViewedItem {
  id: number;
  title: string;
  imageUrl: string | null;
  href: string;          // e.g. "/movie/123" or "/game/456"
  releaseDate: string | null;
  viewedAt: number;      // Date.now() timestamp
}
```

**Rules:**
- Max 12 items
- Newest first
- Viewing the same item again moves it to the front (deduplicates by `id`)
- Each app has its own `recentlyViewed` key (separate localStorage per domain)

### Recording a view

When a detail page renders, record the view. Since detail pages are Server Components, use a small client component (`<RecordView>`) that runs on mount:

```tsx
// components/RecordView.tsx
"use client";
import { useEffect } from "react";
import { recordRecentView } from "@/lib/recently-viewed";

export function RecordView({ item }: { item: RecentlyViewedItem }) {
  useEffect(() => {
    recordRecentView(item);
  }, [item]);
  return null;
}
```

Place `<RecordView>` at the bottom of each detail page, passing the item data that's already available from the server fetch.

### Homepage section

Add a "Recently viewed" section to the homepage of each app. It sits below the main content or in a sidebar position, depending on layout.

**Suggested placement:**
- On desktop: below the main browse list, full-width horizontal scroll
- On mobile: below the browse list, horizontal scroll

The section only renders if there are items in localStorage (no empty state needed — just don't show the section).

Use the shared `MediaCarousel` component (already exists) to render items as compact cards.

### Clearing history

A small "Clear" text button in the section header. Clicking it:
1. Removes `recentlyViewed` from localStorage
2. Hides the section immediately

## Implementation

### New: `lib/recently-viewed.ts` (per app)

```typescript
const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 12;

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentView(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  const current = getRecentlyViewed();
  const filtered = current.filter((i) => i.id !== item.id);
  const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}
```

### New: `RecordView` component (per app)

Client component that calls `recordRecentView` on mount. Renders nothing. Placed at the bottom of detail pages.

### New: `RecentlyViewedSection` component (per app)

Client component that reads from localStorage on mount and renders a `MediaCarousel`. Shows nothing if the list is empty.

### Modified: detail pages

Add `<RecordView>` to:
- [apps/whencaniwatchit/app/movie/[id]/page.tsx](apps/whencaniwatchit/app/movie/[id]/page.tsx) — pass `{ id, title, imageUrl: posterUrl, href: /movie/${id}, releaseDate }`
- [apps/whencaniplayit/app/game/[id]/page.tsx](apps/whencaniplayit/app/game/[id]/page.tsx) — pass `{ id, title: game.name, imageUrl: coverUrl, href: /game/${id}, releaseDate: releaseDateHuman }`

### Modified: homepage

Add `<RecentlyViewedSection>` to:
- [apps/whencaniwatchit/app/page.tsx](apps/whencaniwatchit/app/page.tsx)
- [apps/whencaniplayit/app/page.tsx](apps/whencaniplayit/app/page.tsx)

## Mobile considerations

- Horizontal scroll carousel works well on mobile (matches existing carousels)
- Cards should be compact (cover image + title, no description)
- Touch-friendly clear button

## Verification

1. Visit 3 different detail pages, return to homepage — "Recently viewed" section shows all 3 in reverse chronological order
2. Visit the same detail page again — it moves to the front, no duplicates
3. Visit 13 items — only the most recent 12 appear
4. Click "Clear" — section disappears, localStorage key is removed
5. Refresh the page — recently viewed items persist from localStorage
6. Open the site in a private/incognito window — no recently viewed section (empty localStorage)
