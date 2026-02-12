# Share Buttons

## Problem

There's no way to share a game or movie page with someone. Users who discover something interesting have to manually copy the URL from the address bar. A share button reduces this to one tap — especially valuable on mobile where copying URLs is clunky.

## Goals

- One-tap sharing on detail pages
- Use the native Web Share API on mobile for the best experience
- Fallback to copy-to-clipboard on desktop
- Minimal UI footprint — a single button, not a row of social icons

## Design

### Placement

Add a share button next to the existing `WatchlistToggle` in the title area of detail pages.

Current layout:
```
Title                          [⭐ Watchlist]
```

New layout:
```
Title                    [↗ Share] [⭐ Watchlist]
```

Use the `Share2` icon from lucide-react (already a dependency).

### Behaviour

**Mobile (Web Share API supported):**

Tapping the button calls `navigator.share()` with:

```typescript
navigator.share({
  title: 'GTA VI — WhenCanIPlayIt.com',
  text: 'GTA VI releases on September 17, 2025. Check it out!',
  url: 'https://whencaniplayit.com/game/123',
});
```

This opens the native share sheet (Messages, WhatsApp, Twitter, etc.).

**Desktop (no Web Share API):**

Tapping the button copies the URL to the clipboard and shows a toast: "Link copied to clipboard".

### Share data

| Field | Movies | Games |
|-------|--------|-------|
| `title` | `{title} — WhenCanIWatchIt.com` | `{title} — WhenCanIPlayIt.com` |
| `text` | `{title} releases on {date}. Check it out!` | Same pattern |
| `url` | `https://whencaniwatchit.com/movie/{id}` | `https://whencaniplayit.com/game/{id}` |

If the release date is TBA, use: `Check out {title} on WhenCanI{Watch/Play}It.com`

## Components

### New: `ShareButton` (shared, `@whencani/ui`)

Client component (`"use client"`). Props:

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | The share title |
| `text` | `string` | The share description |
| `url` | `string` | The canonical URL to share |
| `className` | `string?` | Optional additional classes |

Implementation:

```typescript
const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

async function handleShare() {
  if (canShare) {
    try {
      await navigator.share({ title, text, url });
    } catch (err) {
      // User cancelled — do nothing
      if (err instanceof Error && err.name !== 'AbortError') {
        fallbackCopy();
      }
    }
  } else {
    fallbackCopy();
  }
}

function fallbackCopy() {
  navigator.clipboard.writeText(url);
  toast({ title: 'Link copied to clipboard' });
}
```

Style: same pill/button style as `WatchlistToggle` — rounded, bordered, compact. Icon only (no text label) to save space.

### Modified: detail pages

**Movie detail page** — [apps/whencaniwatchit/app/movie/[id]/page.tsx](apps/whencaniwatchit/app/movie/[id]/page.tsx) line ~193:

```tsx
<div className="flex items-start justify-between gap-4">
  <h1 ...>{movie.title}</h1>
  <div className="flex items-center gap-2">
    <ShareButton
      title={`${movie.title} — WhenCanIWatchIt.com`}
      text={`${movie.title} releases on ${formatReleaseDate(movie.release_date)}. Check it out!`}
      url={`https://whencaniwatchit.com/movie/${id}`}
    />
    <WatchlistToggle movieId={Number(id)} className="shadow" />
  </div>
</div>
```

**Game detail page** — [apps/whencaniplayit/app/game/[id]/page.tsx](apps/whencaniplayit/app/game/[id]/page.tsx) line ~250: same pattern.

## Mobile considerations

- The Web Share API is the primary path on mobile — it's native and familiar
- The button should meet 44px minimum tap target
- On iOS, `navigator.share` supports title, text, and url
- On Android, all three fields are used by most share targets

## Verification

1. On mobile, tap the share button — native share sheet opens with correct title, text, URL
2. On desktop, click the share button — toast appears saying "Link copied to clipboard"
3. Paste the clipboard contents — correct URL
4. Share a TBA item — text says "Check out {title}..." without a date
5. Cancel the share sheet on mobile — no error, no toast
