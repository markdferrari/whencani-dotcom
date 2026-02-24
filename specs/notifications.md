# Notifications / Release Reminders

## Problem

A user discovers a game or movie, adds it to their watchlist, and then forgets about it until after release. The site does nothing to proactively close the loop. Release reminders turn passive browsing into active planning.

## Goals

- Let users opt in to browser push notifications for specific items
- "Remind me" button on detail pages with timing options
- No user account required (Web Push API works with browser permissions only)
- Later: weekly digest email (requires user accounts — out of scope for initial implementation)

## Design

### "Remind me" button

Add a bell icon button next to the watchlist toggle on detail pages. Tapping it shows a small popover with options:

On the user watchlist/favourite page, 'Remind me' button should be beside 'Buy Now'

- **1 day before release**
- **1 week before release**
- **On release day**

Selecting an option:
1. Requests notification permission (if not already granted)
2. Subscribes the browser to push notifications (if not already subscribed)
3. Stores the reminder in the backend
4. Shows a confirmation toast: "We'll remind you about {title} on {date}"

If the release date is TBA, show "We'll notify you when a release date is announced" (single option, no timing picker).

### Notification permission flow

- First time: browser's native permission prompt appears
- If denied: show an inline message explaining how to re-enable in browser settings
- If granted: proceed silently

### Push notification content

When the reminder fires:

```
🎬 Captain America: Brave New World releases tomorrow!
Tap to check showtimes and details.
```

or

```
🎮 GTA VI is out today!
Tap to see reviews and where to buy.
```

Tapping the notification opens the detail page.

## Technical approach

### Service worker

Add a service worker to both apps for handling push events. Place at `public/sw.js` (or use `next-pwa` / manual registration).

The service worker:
- Listens for `push` events
- Displays a notification with the payload data (title, body, icon, URL)
- Handles `notificationclick` to open/focus the detail page

### Web Push API

Use the [Web Push protocol](https://web.dev/push-notifications-overview/) with VAPID keys.

**New environment variables:**
- `VAPID_PUBLIC_KEY` — included in client-side subscription
- `VAPID_PRIVATE_KEY` — used server-side to send notifications
- `VAPID_SUBJECT` — mailto or URL identifier

Generate keys with `web-push generate-vapid-keys`.

### Backend storage

Store reminders in DynamoDB (same table planned for user accounts). Each reminder is a record:

```typescript
interface PushReminder {
  pk: string;           // e.g. "PUSH#<subscription_endpoint_hash>"
  sk: string;           // e.g. "REMINDER#<itemId>#<timing>"
  subscription: PushSubscription; // The browser's push subscription object
  itemId: number;
  itemType: 'movie' | 'game';
  itemTitle: string;
  releaseDate: string;  // ISO date or "TBA"
  remindAt: string;     // ISO date — when to send the notification
  app: 'whencaniwatchit' | 'whencaniplayit';
  createdAt: string;
}
```

### Sending notifications

A scheduled Lambda function (cron, daily at 09:00 UTC):

1. Query DynamoDB for reminders where `remindAt <= today`
2. For each, send a push notification via the Web Push API using the stored subscription
3. Delete the reminder after successful delivery
4. If delivery fails (subscription expired), clean up the record

Use the `web-push` npm package for sending.

### API routes

New routes on each app:

**POST /api/notifications/subscribe**
- Body: `{ subscription: PushSubscription }`
- Stores the subscription (or updates if endpoint already exists)

**POST /api/notifications/remind**
- Body: `{ itemId: number, timing: '1d' | '1w' | 'release' }`
- Validates the item exists and has a release date
- Computes `remindAt` based on timing
- Stores the reminder in DynamoDB

**DELETE /api/notifications/remind**
- Body: `{ itemId: number }`
- Removes all reminders for this item + subscription

**GET /api/notifications/reminders**
- Returns all active reminders for the current subscription
- Used to show which items the user has reminders for (filled bell icon)

## Components

### New: `RemindMeButton`

Client component. Props:

| Prop | Type | Description |
|------|------|-------------|
| `itemId` | `number` | Movie or game ID |
| `itemTitle` | `string` | For the confirmation toast |
| `releaseDate` | `string \| null` | ISO date or null for TBA |
| `itemType` | `'movie' \| 'game'` | Determines notification copy |

Uses a `Popover` (Radix UI, already a dependency) for timing options. Bell icon from lucide-react. Filled bell when a reminder is active.

### New: `useNotifications` hook

Manages:
- Permission state (`default`, `granted`, `denied`)
- Push subscription (subscribe/unsubscribe)
- Active reminders for current subscription (fetched from API)
- `setReminder(itemId, timing)` and `removeReminder(itemId)` actions

### Modified: detail pages

Add `<RemindMeButton>` next to `<WatchlistToggle>` on:
- [apps/whencaniwatchit/app/movie/[id]/page.tsx](apps/whencaniwatchit/app/movie/[id]/page.tsx) (line ~193)
- [apps/whencaniplayit/app/game/[id]/page.tsx](apps/whencaniplayit/app/game/[id]/page.tsx) (line ~254)

## Dependencies

New package: `web-push` (for sending push notifications server-side).

## Mobile considerations

- Push notifications work on Android Chrome and iOS Safari 16.4+
- On iOS, the site must be installed as a PWA for push to work — show a prompt encouraging "Add to Home Screen" if on iOS and not in standalone mode
- The "Remind me" popover should be large enough for touch targets

## Future: email digest

Once user accounts exist, add a weekly email option:
- "Your watchlist this week" — items releasing in the next 7 days
- Opt-in from account settings
- Uses SES or similar email service
- This is out of scope for the initial push notification implementation

## Verification

1. On a detail page, tap "Remind me" → "1 day before" — browser permission prompt appears, then confirmation toast
2. Check the bell icon is now filled for that item
3. In DynamoDB, verify the reminder record exists with correct `remindAt`
4. Trigger the cron Lambda manually — verify the push notification arrives
5. Tap the notification — detail page opens
6. Remove the reminder — bell icon returns to outline, DynamoDB record deleted
7. Test on mobile (Android Chrome) — notification appears in system tray
