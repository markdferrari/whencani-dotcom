# Progressive Web App — Audit & Implementation Plan

Each of these apps should meet the PWA standard.

---

## Current State Audit (Feb 2026)

### PWA Criteria Checklist

| Requirement | whencaniplayit | whencaniwatchit | whencanireadit |
|---|---|---|---|
| **HTTPS** | ✅ CloudFront + ACM cert | ✅ CloudFront + ACM cert | ✅ CloudFront + ACM cert |
| **Web App Manifest** | ❌ Missing | ❌ Missing | ❌ Missing |
| **Service Worker** | ❌ Missing | ❌ Missing | ❌ Missing |
| **Icons 192px PNG** | ❌ Missing | ❌ Missing | ❌ Missing |
| **Icons 512px PNG** | ❌ Missing | ❌ Missing | ❌ Missing |
| **apple-touch-icon** | ❌ Missing | ❌ Missing | ❌ Missing |
| **`theme-color` meta** | ❌ Missing | ❌ Missing | ❌ Missing |
| **`display: standalone`** | ❌ No manifest | ❌ No manifest | ❌ No manifest |
| **Offline fallback** | ❌ No SW | ❌ No SW | ❌ No SW |
| **favicon.ico** | ✅ `app/favicon.ico` | ✅ `app/favicon.ico` | ✅ `app/favicon.ico` |
| **Existing logo** | ✅ `public/logo.png` | ✅ `public/logo.png` | ✅ `public/logo.png` |

### Summary of Gaps

All three sites are served over HTTPS via AWS CloudFront with ACM certificates — that pillar is met.
However, **none of the three sites have any PWA infrastructure**:

1. **No web app manifest** — no `manifest.json`, `manifest.webmanifest`, or `app/manifest.ts` in any app.
2. **No service worker** — no `sw.js`, no `next-pwa`, no `@serwist/next`, no Workbox integration.
3. **No installability icons** — only `favicon.ico` exists; no 192px or 512px PNG icons, no `apple-touch-icon`.
4. **No `theme-color` meta tag** — none of the layouts set `<meta name="theme-color">`.
5. **No offline experience** — without a service worker, any network loss gives a browser error page.

---

## Implementation Plan

### Feature Flag

All PWA features will be gated behind a feature flag per the project convention:

```
NEXT_PUBLIC_FEATURE_PWA=true
```

This gates the service worker registration script. The manifest and icons are harmless metadata and can ship ungated.

---

### Phase 1: Web App Manifest & Icons (All 3 Sites)

**Goal:** Make each site recognisable as an installable web app.

#### 1.1 Generate Icon Assets

For each app, create properly sized icons from the existing `public/logo.png`:

| File | Size | Location | Purpose |
|---|---|---|---|
| `icon-192.png` | 192×192 | `app/` | Manifest icon (required minimum) |
| `icon-512.png` | 512×512 | `app/` | Manifest icon (splash/install) |
| `apple-icon.png` | 180×180 | `app/` | iOS home screen icon |

Place these in each app's `app/` directory so Next.js auto-generates the appropriate `<link>` tags via the App Router file conventions.

#### 1.2 Create `app/manifest.ts`

Create a typed manifest file in each app's `app/` directory using the Next.js `MetadataRoute.Manifest` type:

**whencaniplayit:**
```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WhenCanIPlayIt.com - Game Release Tracker',
    short_name: 'WhenCanIPlayIt',
    description: 'Track game release dates, reviews, and trending titles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',           // sky-500 — matches brand primary
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

**whencaniwatchit:** same pattern with movie-specific name/description.
**whencanireadit:** same pattern with book-specific name/description.

#### 1.3 Add `theme-color` to Layout Metadata

In each app's `app/layout.tsx`, add to the `metadata` export:

```ts
other: {
  'theme-color': '#0ea5e9',
},
```

Or use the `themeColor` metadata field (deprecated in newer Next.js — verify against local docs).

---

### Phase 2: Service Worker & Offline Support

**Goal:** Register a service worker with a fetch handler and provide a meaningful offline fallback.

#### 2.1 Choose Approach: `@serwist/next`

Use `@serwist/next` (the maintained Workbox/Next.js integration, successor to `next-pwa`). It provides:
- Automatic precaching of the App Shell (built JS/CSS)
- Runtime caching strategies for API routes and images
- An offline fallback page

Install in each app:
```bash
yarn add @serwist/next && yarn add -D serwist
```

#### 2.2 Create Service Worker Entry (`app/sw.ts`)

```ts
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()
```

#### 2.3 Create Offline Fallback Page (`app/offline/page.tsx`)

A simple page shown when the user is offline and navigates to an uncached route:

```tsx
export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">You're offline</h1>
      <p className="mt-2 text-muted-foreground">
        Check your connection and try again.
      </p>
    </div>
  )
}
```

#### 2.4 Configure `next.config.ts`

Wrap the existing Next config with the Serwist plugin:

```ts
import withSerwist from '@serwist/next'

const withPWA = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = { /* existing config */ }

export default withPWA(nextConfig)
```

#### 2.5 Conditional SW Registration (Feature Flag)

Add a client component `components/ServiceWorkerRegistration.tsx` (included in layout only when the flag is enabled):

```tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])
  return null
}
```

In each layout, conditionally render it:

```tsx
{process.env.NEXT_PUBLIC_FEATURE_PWA === 'true' && <ServiceWorkerRegistration />}
```

---

### Phase 3: Enhanced Caching Strategies

**Goal:** Optimise runtime caching for the data-heavy nature of these sites.

| Route Pattern | Strategy | TTL | Rationale |
|---|---|---|---|
| `/api/igdb/**`, `/api/tmdb/**`, `/api/books/**` | StaleWhileRevalidate | 1 hour | Data freshness matters but staleness is acceptable briefly |
| `/_next/image?*` | CacheFirst | 30 days | Optimised images rarely change |
| `/_next/static/**` | CacheFirst | 1 year | Immutable hashed assets |
| Page navigations | NetworkFirst | — | Always try live content, fall back to cache |
| Google Fonts | CacheFirst | 1 year | Font files are versioned/immutable |

These are configured via the `runtimeCaching` array in the Serwist config.

---

### Phase 4: Testing & Validation

#### 4.1 Lighthouse PWA Audit

Run Lighthouse in Chrome DevTools (`Application` → `Manifest` and `Service Workers` panels) against each deployed site. Target criteria:

- [ ] Manifest is valid and has required fields
- [ ] Service worker registered with fetch handler
- [ ] `start_url` responds with 200 when offline
- [ ] Icons are correct sizes
- [ ] `theme-color` is set
- [ ] HTTPS
- [ ] Redirects HTTP to HTTPS
- [ ] Lighthouse PWA badge passes

#### 4.2 Manual Install Test

- **Chrome Desktop:** Verify install icon appears in address bar
- **Chrome Android:** Verify "Add to Home Screen" banner/prompt
- **Safari iOS:** Verify the app can be added to home screen with correct icon & name
- **Edge:** Verify install option in browser menu

#### 4.3 Offline Test

- Load any page → toggle airplane mode → navigate to another cached page (should work)
- Navigate to an uncached page while offline → should see the offline fallback

---

### Implementation Order & Effort Estimates

| # | Task | Effort | Dependencies |
|---|---|---|---|
| 1 | Add `NEXT_PUBLIC_FEATURE_PWA` flag to all 3 `config.ts` | S | — |
| 2 | Generate icon assets (192, 512, apple-touch) per site | S | Needs `logo.png` source |
| 3 | Create `app/manifest.ts` per site | S | #2 |
| 4 | Add `theme-color` to layout metadata per site | S | — |
| 5 | Install `@serwist/next` + `serwist` in all 3 apps | S | — |
| 6 | Create `app/sw.ts` per site | M | #5 |
| 7 | Create `app/offline/page.tsx` per site | S | — |
| 8 | Wrap `next.config.ts` with Serwist per site | M | #5, #6 |
| 9 | Add `ServiceWorkerRegistration` component per site | S | #8 |
| 10 | Configure runtime caching strategies | M | #6 |
| 11 | Run Lighthouse audits & fix issues | M | #1–10 |
| 12 | Manual install + offline testing on devices | S | #11 |
| 13 | Enable flag in production | S | #12 |

**Total estimated effort:** ~1 day of implementation across all 3 sites (most config is copy-paste with site-specific branding).

---

### Files Changed / Created Per Site

```
app/
  manifest.ts          (NEW)
  icon-192.png         (NEW — generated from logo.png)
  icon-512.png         (NEW — generated from logo.png)
  apple-icon.png       (NEW — 180×180 from logo.png)
  sw.ts                (NEW)
  offline/
    page.tsx           (NEW)
  layout.tsx           (MODIFIED — add theme-color, add SW registration)
components/
  ServiceWorkerRegistration.tsx  (NEW)
lib/
  config.ts            (MODIFIED — add PWA feature flag)
next.config.ts         (MODIFIED — wrap with @serwist/next)
package.json           (MODIFIED — add @serwist/next, serwist)
```
