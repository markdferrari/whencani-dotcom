# Countdown Timers

## Problem

Release dates are shown as static text ("June 15, 2026"). A countdown ("Releases in 12 days") gives users an immediate emotional signal — excitement builds as the number shrinks. The games app already does this on detail pages but movies don't, and neither app shows it on browse cards.

## Current state

**WhenCanIPlayIt** — [apps/whencaniplayit/app/game/[id]/page.tsx](apps/whencaniplayit/app/game/[id]/page.tsx) lines 76–91:
- `formatReleaseBadge` computes "X days away", "Today", or "X days ago"
- Rendered as a secondary pill next to the release date on detail pages
- Not shown on browse cards (`GameCard` / `MediaCard`)

**WhenCanIWatchIt** — [apps/whencaniwatchit/app/movie/[id]/page.tsx](apps/whencaniwatchit/app/movie/[id]/page.tsx) lines 202–207:
- Only shows the formatted release date as a sky-blue pill
- No countdown

## Changes

### 1. Shared countdown utility

Create a `formatCountdown` function in `packages/ui` (or a shared utils package) so both apps use the same logic:

```typescript
function formatCountdown(releaseDate: Date | string | number): string | null
```

Returns:
- `"Out now"` — release date is today
- `"X days"` — release date is 1–30 days away
- `"X weeks"` — release date is 31–90 days away (rounded)
- `"X months"` — release date is 91+ days away (rounded)
- `"X days ago"` — release date is in the past (only on detail pages)
- `null` — no release date available

Accept unix timestamps (games), ISO strings (movies), or Date objects.

### 2. Detail page countdown — WhenCanIWatchIt

Add the countdown pill to the movie detail page, matching the existing game detail page style:

```tsx
{/* Release date */}
<div className="flex flex-wrap gap-3">
  <span className="rounded-full bg-sky-500 px-4 py-2 ...">
    {formatReleaseDate(movie.release_date)}
  </span>
  {countdown && (
    <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:bg-zinc-900/70 dark:text-sky-400">
      {countdown}
    </span>
  )}
</div>
```

**File to change:** [apps/whencaniwatchit/app/movie/[id]/page.tsx](apps/whencaniwatchit/app/movie/[id]/page.tsx) — add countdown pill after the release date badge (~line 206).

### 3. Detail page countdown — WhenCanIPlayIt

Replace the inline `formatReleaseBadge` with the shared `formatCountdown` utility for consistency.

**File to change:** [apps/whencaniplayit/app/game/[id]/page.tsx](apps/whencaniplayit/app/game/[id]/page.tsx) — replace `formatReleaseBadge` (~lines 76–91) with import of shared utility.

### 4. Browse card countdown

Add a subtle countdown to `MediaCard` for upcoming items. Show it below the release date text:

```
JUNE 15, 2026
The Last of Us Part III
12 days                    ← new, smaller muted text
```

**File to change:** [packages/ui/src/cards/MediaCard.tsx](packages/ui/src/cards/MediaCard.tsx)

Add an optional `countdown` prop (string). Render it as a small muted line under the release date:

```tsx
{releaseDate && (
  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">{releaseDate}</p>
)}
{countdown && (
  <p className="text-[0.65rem] font-medium text-sky-600 dark:text-sky-400">{countdown}</p>
)}
```

Each app's card component (`MovieCard`, `GameCard`) computes the countdown from the release date and passes it as a prop.

### 5. Client-side live updates (optional enhancement)

Since countdown values change daily (not per-second), server-rendered values are fine for most users. However, if a user has the page open overnight, the value becomes stale.

Optional: wrap the countdown text in a lightweight client component that re-renders once per hour using `setInterval`. This is low priority — server-rendered is good enough initially.

## Mobile considerations

- The countdown text is small and doesn't take extra space
- On browse cards (mobile), the countdown sits naturally under the release date
- No layout changes needed

## Verification

1. Open a movie detail page for an upcoming movie — countdown pill appears next to release date
2. Open a game detail page — countdown uses the same formatting as movies
3. Browse the homepage — each upcoming card shows "12 days", "3 weeks", etc. below the date
4. Check a movie/game that released yesterday — shows "1 day ago" on detail page, nothing on browse card
5. Check a TBA item — no countdown shown
